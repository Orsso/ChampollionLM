from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile, status, Response, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.api.deps import get_db_session, get_file_service
from app.core.auth import current_active_user
from app.models import User
from app.schemas import (
    ProjectCreate,
    ProjectDetail,
    ProjectSummary,
    ProjectUpdate,
    DocumentRead,
    DocumentRequest,
    DocumentUpdate,
    JobStatusRead,
    SourceCreate,
    SourceDetail,
    SourceRead,
    SourceUpdate,
    TokenEstimation,
)
from app.schemas.pagination import PaginatedResponse, PaginationParams
from app.services.projects import ProjectService
from app.services.jobs import run_document_job, run_processing_job
from app.services.sources import SourceService
from app.utils.text_extraction import extract_text_from_source
from app.utils.tokens import (
    estimate_tokens,
    format_token_count,
    get_context_usage_percentage,
    MISTRAL_CONTEXT_LIMIT,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/projects", tags=["projects"])


def get_project_service(
    session = Depends(get_db_session),
    user: User = Depends(current_active_user),
    file_service = Depends(get_file_service),
) -> ProjectService:
    return ProjectService(session, user, file_service)


def get_source_service(
    session = Depends(get_db_session),
    user: User = Depends(current_active_user),
) -> SourceService:
    return SourceService(session, user)


@router.get("/providers/transcription", tags=["providers"])
async def get_transcription_providers() -> list[str]:
    """
    Get list of available transcription providers.

    Returns:
        List of provider names (e.g., ['mistral'])
    """
    from app.services.projects import get_supported_transcription_providers
    providers = get_supported_transcription_providers()
    return sorted(list(providers))


@router.get("/providers/generation", tags=["providers"])
async def get_generation_providers() -> list[str]:
    """
    Get list of available document generation providers.

    Returns:
        List of provider names (e.g., ['mistral'])
    """
    from app.generators import GeneratorRegistry
    providers = GeneratorRegistry.list_providers()
    return sorted(providers)


@router.get("", response_model=list[ProjectSummary])
async def list_projects(service: ProjectService = Depends(get_project_service)) -> list[ProjectSummary]:
    """List all projects (no pagination). Deprecated: use /projects/paginated instead."""
    return await service.list_projects()


@router.get("/paginated", response_model=PaginatedResponse[ProjectSummary])
async def list_projects_paginated(
    pagination: PaginationParams = Depends(),
    service: ProjectService = Depends(get_project_service),
) -> PaginatedResponse[ProjectSummary]:
    """
    List projects with pagination support (Phase 9).

    Query Parameters:
        - limit: Number of items per page (1-100, default: 20)
        - offset: Number of items to skip (default: 0)

    Returns:
        PaginatedResponse with projects, total count, and pagination metadata
    """
    projects, total = await service.list_projects_paginated(
        limit=pagination.limit,
        offset=pagination.offset
    )
    return PaginatedResponse.create(
        items=projects,
        total=total,
        limit=pagination.limit,
        offset=pagination.offset
    )


@router.post("", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    service: ProjectService = Depends(get_project_service),
) -> ProjectDetail:
    return await service.create_project(payload)


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(
    project_id: int,
    service: ProjectService = Depends(get_project_service),
) -> ProjectDetail:
    return await service.get_project_detail(project_id)


@router.patch("/{project_id}", response_model=ProjectDetail)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    service: ProjectService = Depends(get_project_service),
) -> ProjectDetail:
    return await service.update_project(project_id, payload)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_project(
    project_id: int,
    service: ProjectService = Depends(get_project_service),
) -> Response:
    await service.delete_project(project_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{project_id}/sources/audio", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
# Rate limited globally by slowapi (200/minute default)
async def upload_audio_source(
    project_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    service: ProjectService = Depends(get_project_service),
    source_service: SourceService = Depends(get_source_service),
) -> SourceRead:
    source = await service.add_audio_source(project_id, file)
    # Automatically trigger transcription for the uploaded audio source
    # Use 'mistral' as default provider (OpenAI is scaffold/future scope)
    default_provider = "mistral"
    background_tasks.add_task(run_processing_job, project_id, default_provider)
    return source


class YouTubeImportRequest(BaseModel):
    """Request body for YouTube video import."""
    url: str = Field(..., description="YouTube video URL")


@router.post("/{project_id}/sources/youtube", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
async def import_youtube_source(
    project_id: int,
    payload: YouTubeImportRequest,
    service: ProjectService = Depends(get_project_service),
) -> SourceRead:
    """
    Import YouTube video transcript as source.

    Extracts the transcript from a YouTube video (requires captions enabled).
    Supports both manually uploaded and auto-generated captions.
    """
    return await service.add_youtube_source(project_id, payload.url)



@router.get("/{project_id}/tokens/estimate", response_model=TokenEstimation)
async def estimate_tokens_endpoint(
    project_id: int,
    source_ids: list[int] = Query(default=[]),
    service: ProjectService = Depends(get_project_service),
    source_service: SourceService = Depends(get_source_service),
) -> TokenEstimation:
    """Estimate token count for selected sources.
    
    Args:
        project_id: ID of the project
        source_ids: List of source IDs to estimate. If empty, estimates all sources.
        
    Returns:
        TokenEstimation with total tokens, formatted count, and context percentage
    """
    if source_ids:
        sources = await source_service.get_sources_by_ids(project_id, source_ids)
    else:
        sources = await source_service.get_sources_by_ids(project_id, None)

    total_tokens = 0
    
    for source in sources:
        if source.token_count is not None:
            total_tokens += source.token_count
        else:
            # Fallback for legacy sources without cached token count
            try:
                text = extract_text_from_source(source)
                if text and text.strip():
                    count = estimate_tokens(text)
                    total_tokens += count
            except Exception as e:
                logger.warning(
                    "Failed to extract text for token estimation",
                    extra={"source_id": source.id, "error": str(e)}
                )
                continue

    return TokenEstimation(
        total_tokens=total_tokens,
        formatted_count=format_token_count(total_tokens),
        context_percentage=get_context_usage_percentage(total_tokens),
        context_limit=MISTRAL_CONTEXT_LIMIT,
        source_count=len(sources) if sources else 0,
    )


@router.post("/{project_id}/documents", response_model=JobStatusRead, status_code=status.HTTP_202_ACCEPTED)
async def start_document_generation(
    project_id: int,
    payload: DocumentRequest,
    background_tasks: BackgroundTasks,
    service: ProjectService = Depends(get_project_service),
) -> JobStatusRead:
    """Generate document from project sources using LLM."""
    job = await service.start_document_job(project_id, payload.provider, payload.type)
    source_ids = payload.source_ids or None
    background_tasks.add_task(
        run_document_job,
        project_id,
        payload.provider.lower(),
        source_ids,
        payload.title or None,
        payload.type,
    )
    return job


@router.get("/{project_id}/documents/status", response_model=JobStatusRead)
async def get_document_status(
    project_id: int,
    service: ProjectService = Depends(get_project_service),
) -> JobStatusRead:
    """Get document generation status."""
    return await service.get_document_status(project_id)


@router.get("/{project_id}/documents", response_model=list[DocumentRead])
async def list_documents(
    project_id: int,
    service: ProjectService = Depends(get_project_service),
) -> list[DocumentRead]:
    """List all documents for a project."""
    return await service.list_documents(project_id)


@router.get("/{project_id}/documents/{document_id}", response_model=DocumentRead)
async def get_document(
    project_id: int,
    document_id: int,
    service: ProjectService = Depends(get_project_service),
) -> DocumentRead:
    """Get a specific document."""
    return await service.get_document(project_id, document_id)


@router.delete("/{project_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_document(
    project_id: int,
    document_id: int,
    service: ProjectService = Depends(get_project_service),
) -> Response:
    """Delete a specific document."""
    await service.delete_document(project_id, document_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{project_id}/documents/{document_id}", response_model=DocumentRead)
async def update_document(
    project_id: int,
    document_id: int,
    payload: DocumentUpdate,
    service: ProjectService = Depends(get_project_service),
) -> DocumentRead:
    """Update document title."""
    return await service.update_document(project_id, document_id, title=payload.title)


@router.get("/{project_id}/documents/{document_id}/export/pdf", response_class=FileResponse)
async def export_document_pdf(
    project_id: int,
    document_id: int,
    background_tasks: BackgroundTasks,
    service: ProjectService = Depends(get_project_service),
) -> FileResponse:
    """Export document as PDF via Pandoc."""
    from app.exporters.pdf import PDFExporter, PDFExportError

    document = await service.get_document(project_id, document_id)

    pdf_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
    pdf_path = Path(pdf_file.name)
    pdf_file.close()

    try:
        # Use new PDF exporter from scaffold architecture
        exporter = PDFExporter()
        result = await exporter.export(
            markdown_content=document.markdown,
            output_path=pdf_path,
            metadata={"title": document.title or "Document"},
        )

        if not result.success:
            raise PDFExportError(result.error or "Export failed")

        safe_title = "".join(c if c.isalnum() or c in (' ', '-', '_') else '-' for c in (document.title or "document"))
        filename = f"{safe_title}.pdf"

        background_tasks.add_task(pdf_path.unlink, missing_ok=True)

        resp = FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=filename,
        )
        return resp
    except PDFExportError as exc:
        try:
            pdf_path.unlink()
        except OSError:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )



@router.post("/{project_id}/sources", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
async def create_source(
    project_id: int,
    payload: SourceCreate,
    service: SourceService = Depends(get_source_service),
) -> SourceRead:
    """Create a new source (e.g., document) for a project."""
    return await service.create_source(project_id, payload)


@router.get("/{project_id}/sources", response_model=list[SourceRead])
async def list_sources(
    project_id: int,
    service: SourceService = Depends(get_source_service),
) -> list[SourceRead]:
    """List all sources for a project."""
    return await service.list_sources(project_id)


@router.get("/{project_id}/sources/{source_id}", response_model=SourceDetail)
async def get_source(
    project_id: int,
    source_id: int,
    service: SourceService = Depends(get_source_service),
) -> SourceDetail:
    """Get detailed information about a source."""
    return await service.get_source(project_id, source_id)


@router.delete("/{project_id}/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_source(
    project_id: int,
    source_id: int,
    service: SourceService = Depends(get_source_service),
) -> Response:
    """Delete a source from a project."""
    await service.delete_source(project_id, source_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{project_id}/sources/{source_id}", response_model=SourceRead)
async def update_source(
    project_id: int,
    source_id: int,
    payload: SourceUpdate,
    service: SourceService = Depends(get_source_service),
) -> SourceRead:
    updated = await service.update_source(project_id, source_id, payload)
    return updated


@router.get("/{project_id}/sources/{source_id}/file", response_class=FileResponse)
async def get_source_file(
    project_id: int,
    source_id: int,
    service: SourceService = Depends(get_source_service),
) -> FileResponse:
    return await service.get_source_file(project_id, source_id)


@router.post("/{project_id}/sources/{source_id}/reprocess", status_code=status.HTTP_202_ACCEPTED)
async def reprocess_source(
    project_id: int,
    source_id: int,
    background_tasks: BackgroundTasks,
    service: SourceService = Depends(get_source_service),
    project_service: ProjectService = Depends(get_project_service),
) -> dict:
    """
    Retry processing a failed source.
    
    Resets the source processing status and triggers a new processing job.
    """
    # Verify source exists and belongs to project
    await service.get_source(project_id, source_id)
    
    # Reset processing status
    await project_service.reset_processing_status(project_id)
    
    # Trigger processing job again
    default_provider = "mistral"
    background_tasks.add_task(run_processing_job, project_id, default_provider)
    
    return {"message": "Reprocessing started", "source_id": source_id}
