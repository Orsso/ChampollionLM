from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_session
from app.generators.base import DocumentProviderError
from app.models import (
    Document,
    DocumentSource,
    JobStatus,
    Project,
    Source,
    SourceType,
    User,
)
from app.generators import GeneratorRegistry
from app.processors.registry import ProcessorRegistry
from app.services.file import FileService
from app.services.processing_job import ProcessingJobService
from app.services.generation_job import GenerationJobService
from app.services.projects import ProjectService
from app.services.transcription import STTProviderError
from app.utils.text_extraction import TextExtractionError, extract_text_from_source
from app.utils.tokens import estimate_tokens

logger = logging.getLogger(__name__)


async def run_processing_job(
    project_id: int,
    provider: str,
    session: AsyncSession | None = None,
) -> None:
    """Process transcription queue for a project.

    Transcribes all recordings without transcripts, one at a time.
    Updates project status based on overall progress.

    Args:
        project_id: ID of the project to process
        provider: Name of the transcription provider (e.g., 'mistral')
        session: Optional AsyncSession (for DI/testing). If None, creates its own.
    """
    logger.info("Starting transcription job", extra={"project_id": project_id})

    # Create session if not provided (for backward compat with background tasks)
    if session is None:
        async for session in get_session():
            await _run_processing_job_impl(project_id, provider, session)
            return
    else:
        await _run_processing_job_impl(project_id, provider, session)


async def _run_processing_job_impl(
    project_id: int,
    provider: str,
    session: AsyncSession,
) -> None:
    """Internal implementation of processing job (requires session)."""
    file_svc = FileService()
    project_svc = ProjectService(session, user=None, file_service=file_svc)  # No user context for background job
    job_svc = ProcessingJobService(session)

    # Load project with sources
    project = await project_svc.get_project_for_job(project_id, with_sources=True)
    if not project:
        logger.error("Project not found", extra={"project_id": project_id})
        return

    # Get all audio AND PDF sources without processed content
    sources_to_process = [
        s for s in (project.sources or [])
        if getattr(s, 'type', None) in [SourceType.AUDIO, SourceType.PDF] and not s.processed_content
    ]
    logger.info("Found sources to process", extra={
        "project_id": project_id,
        "count": len(sources_to_process),
        "types": [getattr(s, 'type', None) for s in sources_to_process]
    })

    if not sources_to_process:
        logger.info("No pending sources to process", extra={"project_id": project_id})
        job = await job_svc.get_or_create_job(project_id)
        await job_svc.mark_succeeded(job.id)
        await session.commit()
        return

    # Get or create job
    job = await job_svc.get_or_create_job(project_id)
    job_id = job.id
    await job_svc.mark_in_progress(job_id)
    await session.commit()
    logger.info("Processing job marked as IN_PROGRESS", extra={"project_id": project_id})

    # Process sources sequentially
    for idx, source in enumerate(sources_to_process, 1):
        src_name = getattr(source, 'title', f"source#{getattr(source, 'id', '?')}")
        src_type = getattr(source, 'type', 'unknown')
        logger.info("Processing source", extra={
            "project_id": project_id,
            "source_idx": idx,
            "total_sources": len(sources_to_process),
            "source_title": src_name,
            "source_type": src_type
        })
        try:
            await _transcribe_audio_source(session, source, provider)
            logger.info("Successfully processed source", extra={
                "project_id": project_id,
                "source_title": src_name,
                "source_type": src_type
            })
        except Exception as exc:  # pragma: no cover - defensive catch
            logger.error("Error processing source", extra={
                "project_id": project_id,
                "source_title": src_name,
                "source_type": src_type,
                "error": str(exc)
            })
            await session.rollback()
            await job_svc.mark_failed(job_id, f"Source {src_name}: {str(exc)}")
            await session.commit()
            return

    # All sources processed successfully
    logger.info("All sources processed successfully", extra={"project_id": project_id})
    await job_svc.mark_succeeded(job_id)
    await session.commit()
    logger.info("Processing job completed successfully", extra={"project_id": project_id})


async def run_document_job(
    project_id: int,
    provider: str,
    source_ids: list[int] | None = None,
    document_title: str | None = None,
    document_type: str = "cours",
    session: AsyncSession | None = None,
) -> None:
    """Generate document from sources using LLM.

    Args:
        project_id: ID of the project
        provider: Name of the generation provider (e.g., 'mistral')
        source_ids: Optional list of source IDs to use (if None, use all)
        document_title: Optional title for generated document
        document_type: Type of document to generate (cours, resume, quiz)
        session: Optional AsyncSession (for DI/testing). If None, creates its own.
    """
    logger.info("Starting document generation job", extra={"project_id": project_id, "type": document_type})

    # Create session if not provided (for backward compat with background tasks)
    if session is None:
        async for session in get_session():
            await _run_document_job_impl(
                project_id, provider, source_ids, document_title, document_type, session
            )
            return
    else:
        await _run_document_job_impl(
            project_id, provider, source_ids, document_title, document_type, session
        )


async def _run_document_job_impl(
    project_id: int,
    provider: str,
    source_ids: list[int] | None,
    document_title: str | None,
    document_type: str,
    session: AsyncSession,
) -> None:
    """Internal implementation of document generation job (requires session)."""
    file_svc = FileService()
    project_svc = ProjectService(session, user=None, file_service=file_svc)  # No user context for background job
    job_svc = GenerationJobService(session)

    # Load project with sources
    project = await project_svc.get_project_for_job(
        project_id, with_sources=True, with_document=False
    )
    if not project:
        logger.error("Project not found", extra={"project_id": project_id})
        return

    # Get or create job
    job = await job_svc.get_or_create_job(project_id)
    job_id = job.id
    await job_svc.mark_in_progress(job_id)
    await session.commit()
    logger.info("Generation job marked as IN_PROGRESS", extra={"project_id": project_id})

    # Get sources that will be used for generation (for linking later)
    sources_used = await _get_sources_for_document(session, project, source_ids)
    
    try:
        markdown = await _generate_project_document(
            session, project, provider,
            source_ids=source_ids,
            document_title=document_title,
            document_type=document_type,
        )
    except Exception as exc:  # pragma: no cover - defensive catch
        logger.error(f"Error generating document: {str(exc)}", extra={
            "project_id": project_id,
            "error": str(exc)
        })
        await session.rollback()
        await job_svc.mark_failed(job_id, str(exc))
        await session.commit()
        return

    # Always create a new document
    now = datetime.now(tz=UTC)
    document = Document(
        project_id=project.id,
        provider=provider,
        title=document_title,
        markdown=markdown,
        created_at=now,
        type=document_type
    )
    session.add(document)
    await session.flush()  # Flush to get document.id

    # Link document to sources used for generation (for chat context)
    for source in sources_used:
        doc_source = DocumentSource(
            document_id=document.id,
            source_id=source.id
        )
        session.add(doc_source)

    # Mark job as succeeded
    await job_svc.mark_succeeded(job.id)
    await session.commit()
    logger.info("Document generation completed successfully", extra={
        "project_id": project_id,
        "sources_linked": len(sources_used)
    })


async def _transcribe_audio_source(session: AsyncSession, source: Source, provider: str) -> None:
    """Process a single source (audio or PDF) and save the result."""
    provider_lower = provider.lower()

    # Get the project and owner
    project = await session.get(Project, source.project_id)
    if not project:
        raise STTProviderError("Project not found")

    owner = project.owner or await session.get(User, project.user_id)
    if not owner:
        raise STTProviderError("Project owner not found")

    # Get effective API key (user's own key or demo key)
    from app.services.api_key_resolver import get_effective_api_key
    api_key = await get_effective_api_key(owner, session)
    if not api_key:
        raise STTProviderError("API key not configured and no active demo access")

    # Use ProcessorRegistry to get the processor class based on source format
    # Get source format/MIME type
    source_format = None
    if source.type == SourceType.AUDIO:
        # Audio sources use MIME type like 'audio/mpeg'
        source_format = getattr(source, 'source_metadata', {}).get('format') if hasattr(source, 'source_metadata') else None
        if not source_format:
            # Fallback: guess from file extension
            import mimetypes
            from pathlib import Path
            if source.file_path:
                source_format, _ = mimetypes.guess_type(source.file_path)
        if not source_format:
            source_format = "audio/mpeg"  # Default fallback
    elif source.type == SourceType.PDF:
        source_format = "application/pdf"
    else:
        raise STTProviderError(f"Unsupported source type: {source.type}")

    processor_class = ProcessorRegistry.get_processor(source_format)
    if not processor_class:
        raise STTProviderError(f"No processor found for format: {source_format}")

    # Configure processor with the resolved API key
    try:
        config_class = processor_class.config_class()
        config = config_class(api_key=api_key)
    except Exception as exc:
        raise STTProviderError(f"Configuration failed for provider {provider}: {str(exc)}")

    # Perform processing
    processor = processor_class(config)

    if not getattr(source, 'file_path', None):
        source_type_str = str(getattr(source, 'type', 'UNKNOWN')).upper()
        raise STTProviderError(f"{source_type_str} source missing file path")

    from pathlib import Path
    result = await processor.process(file_path=Path(source.file_path))

    if not result.success:
        raise STTProviderError(result.error or "Processing failed")

    if not result.processed_content or not result.processed_content.strip():
        raise STTProviderError("Processor returned empty result")

    # Store result in source.processed_content
    source.processed_content = result.processed_content.strip()
    source.token_count = estimate_tokens(source.processed_content)
    await session.commit()


async def _generate_project_document(
    session: AsyncSession,
    project: Project,
    provider: str,
    *,
    source_ids: list[int] | None = None,
    document_title: str | None = None,
    document_type: str = "cours",
) -> str:
    """Generate document from project sources using specified provider."""
    provider_lower = provider.lower()

    # Verify provider is supported
    if not GeneratorRegistry.is_supported(provider_lower):
        raise DocumentProviderError(f"Unsupported document provider: {provider}")

    # Get generator class from registry
    generator_class = GeneratorRegistry.get_generator(provider_lower)
    if not generator_class:
        raise DocumentProviderError(f"Generator not found for provider: {provider}")

    owner = project.owner or await session.get(User, project.user_id)
    if not owner:
        raise DocumentProviderError("Project owner not found")

    # Get effective API key (user's own key or demo key)
    from app.services.api_key_resolver import get_effective_api_key
    api_key = await get_effective_api_key(owner, session)
    if not api_key:
        raise DocumentProviderError("API key not configured and no active demo access")

    # Get sources (all or filtered by IDs)
    sources = await _get_sources_for_document(session, project, source_ids)
    
    if not sources:
        raise DocumentProviderError("No sources available")

    # Extract text from each source
    text_parts: list[str] = []
    for source in sources:
        try:
            text = extract_text_from_source(source)
            if text and text.strip():
                text_parts.append(f"=== Source: {source.title} ===\n\n{text}")
        except TextExtractionError as exc:
            # Skip sources that can't be extracted (e.g., audio without transcript)
            continue

    if not text_parts:
        raise DocumentProviderError("No content available from sources")

    # Create generator instance using registry with resolved API key
    try:
        config_class = generator_class.config_class()
        config = config_class(api_key=api_key)
    except Exception as exc:
        raise DocumentProviderError(f"Configuration failed for provider {provider}: {str(exc)}")

    generator = generator_class(config)

    # Prepare metadata
    metadata = {"project_title": project.title}
    if document_title:
        metadata["document_title"] = document_title

    # Generate document from all text parts
    result = await generator.generate(
        source_texts=text_parts,
        document_type=document_type,
        metadata=metadata,
    )

    if not result.success:
        raise DocumentProviderError(result.error or "Document generation failed")

    if not result.markdown_content:
        raise DocumentProviderError("Generator returned empty content")

    return result.markdown_content


async def _get_sources_for_document(
    session: AsyncSession,
    project: Project,
    source_ids: list[int] | None,
) -> list[Source]:
    """Get sources for document generation, with optional filtering."""
    if source_ids:
        stmt = (
            select(Source)
            .where(Source.project_id == project.id, Source.id.in_(source_ids))
            .order_by(Source.created_at)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    # No filters: return all sources
    stmt = (
        select(Source)
        .where(Source.project_id == project.id)
        .order_by(Source.created_at)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())
