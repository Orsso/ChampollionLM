from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Project,
    ProjectStatus,
    JobStatus,
    GenerationJob,
    Source,
    SourceType,
    SourceStatus,
    ProcessingJob,
    User,
)
from app.schemas.project import (
    ProjectCreate,
    ProjectDetail,
    ProjectSummary,
    ProjectUpdate,
    DocumentRead,
    JobStatusRead,
)
from app.schemas import SourceRead
from app.generators import GeneratorRegistry
from app.utils.db import save_and_refresh
from app.utils.errors import raise_invalid_request, raise_not_found, raise_resource_unavailable

if TYPE_CHECKING:
    from app.services.file import FileService

# Use registries to determine supported providers
def get_supported_document_providers() -> set[str]:
    """Get available document generation providers from registry."""
    return set(GeneratorRegistry.list_providers())


def get_supported_transcription_providers() -> set[str]:
    """Get available transcription providers from registry."""
    from app.processors import TranscriptionRegistry
    return set(TranscriptionRegistry.list_providers())

_PENDING_STATUSES = {JobStatus.PENDING, JobStatus.IN_PROGRESS}


class ProjectService:
    def __init__(self, session: AsyncSession, user: User, file_service: FileService):
        self.session = session
        self.user = user
        self.file_service = file_service

    async def list_projects(self) -> list[ProjectSummary]:
        """
        List all projects for current user (no pagination).

        Maintained for backward compatibility. For new code,
        consider using list_projects_paginated().
        """
        stmt = (
            select(Project)
            .where(Project.user_id == self.user.id)
            .order_by(Project.created_at.desc())
            .options(
                selectinload(Project.sources),
                selectinload(Project.processing_job),
                selectinload(Project.generation_job),
            )
        )
        result = await self.session.execute(stmt)
        projects = result.scalars().all()
        return [self._to_summary(project) for project in projects]

    async def list_projects_paginated(
        self,
        limit: int = 20,
        offset: int = 0
    ) -> tuple[list[ProjectSummary], int]:
        """
        List projects with pagination support.

        Args:
            limit: Maximum number of projects to return (default: 20)
            offset: Number of projects to skip (default: 0)

        Returns:
            Tuple of (project_list, total_count)
        """
        # Count total projects for user
        from sqlalchemy import func
        count_stmt = (
            select(func.count(Project.id))
            .where(Project.user_id == self.user.id)
        )
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Fetch paginated projects
        stmt = (
            select(Project)
            .where(Project.user_id == self.user.id)
            .order_by(Project.created_at.desc())
            .limit(limit)
            .offset(offset)
            .options(
                selectinload(Project.sources),
                selectinload(Project.processing_job),
                selectinload(Project.generation_job),
            )
        )
        result = await self.session.execute(stmt)
        projects = result.scalars().all()

        return [self._to_summary(project) for project in projects], total

    async def get_project(self, project_id: int, *, with_details: bool = False) -> Project:
        stmt = select(Project).where(
            Project.id == project_id,
            Project.user_id == self.user.id,
        )
        if with_details:
            stmt = stmt.options(
                selectinload(Project.sources),
                selectinload(Project.document),
                selectinload(Project.processing_job),
                selectinload(Project.generation_job),
            )
        result = await self.session.execute(stmt)
        project = result.scalars().first()
        if not project:
            raise_not_found("Project", project_id)
        return project

    async def get_project_for_job(
        self,
        project_id: int,
        *,
        with_sources: bool = False,
        with_document: bool = False,
    ) -> Project | None:
        """
        Get project without user isolation check (for background jobs).

        This method is used by background job workers that don't have
        user context. Returns None if project not found (instead of raising).

        Args:
            project_id: ID of the project
            with_sources: Load project sources relationship
            with_document: Load project document relationship

        Returns:
            Project if found, None otherwise
        """
        options = [
            selectinload(Project.owner),
            selectinload(Project.processing_job),
            selectinload(Project.generation_job),
        ]
        if with_sources:
            options.append(selectinload(Project.sources))
        if with_document:
            options.append(selectinload(Project.document))

        stmt = select(Project).where(Project.id == project_id).options(*options)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_project_detail(self, project_id: int) -> ProjectDetail:
        project = await self.get_project(project_id, with_details=True)
        return self._to_detail(project)

    async def create_project(self, payload: ProjectCreate) -> ProjectDetail:
        project = Project(
            user_id=self.user.id,
            title=payload.title,
            description=payload.description,
        )
        await save_and_refresh(self.session, project)
        detailed = await self.get_project(project.id, with_details=True)
        return self._to_detail(detailed)

    async def update_project(self, project_id: int, payload: ProjectUpdate) -> ProjectDetail:
        project = await self.get_project(project_id)
        update_data = payload.model_dump(exclude_unset=True)
        if update_data:
            for key, value in update_data.items():
                setattr(project, key, value)
            await self.session.commit()
            await self.session.refresh(project)
        detailed = await self.get_project(project.id, with_details=True)
        return self._to_detail(detailed)

    async def delete_project(self, project_id: int) -> None:
        project = await self.get_project(project_id)
        await self.session.delete(project)
        await self.session.commit()
        # Delete project storage files
        self.file_service.delete_project_storage(self.user.id, project.id)

    async def add_audio_source(self, project_id: int, file: UploadFile) -> SourceRead:
        """
        Add audio source to project.

        Delegates file I/O (validation, conversion, metadata extraction) to FileService.

        Args:
            project_id: ID of project to add source to
            file: Uploaded audio file

        Returns:
            SourceRead schema with audio source details

        Raises:
            HTTPException: If file is invalid, unsupported format, too large, or duration invalid
        """
        project = await self.get_project(project_id)
        if not file.filename:
            raise_invalid_request("Filename is required")

        try:
            # Delegate file operations to FileService
            file.file.seek(0)
            file_path, metadata = await self.file_service.save_audio_recording(
                file_content=file.file,
                filename=file.filename,
                user_id=self.user.id,
                project_id=project.id,
            )
        except ValueError as exc:
            # Convert validation errors to HTTP exceptions
            message = str(exc)
            status_code = (
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                if "size" in message.lower() or "maximum allowed size" in message.lower()
                else status.HTTP_400_BAD_REQUEST
            )
            await file.close()
            raise HTTPException(status_code=status_code, detail=message) from exc
        finally:
            await file.close()

        # Use original client filename as default title for better UX
        from pathlib import Path
        default_title = Path(file.filename).name

        # Create audio source in database with typed metadata
        # Note: source_metadata is JSON column, metadata.model_dump() converts Pydantic → dict
        audio_source = Source(
            project_id=project.id,
            type=SourceType.AUDIO,
            title=default_title,
            file_path=file_path,
            source_metadata=metadata.model_dump(),  # AudioMetadata → dict (JSON column handles serialization)
            status=SourceStatus.UPLOADED,  # Explicit status (Phase 7)
        )
        await save_and_refresh(self.session, audio_source)

        return SourceRead.model_validate(audio_source, from_attributes=True)

    async def start_document_job(self, project_id: int, provider: str) -> JobStatusRead:
        """Start document generation job."""
        provider = provider.lower()
        if not GeneratorRegistry.is_supported(provider):
            raise_invalid_request(f"Unsupported document provider: {provider}")

        project = await self.get_project(project_id, with_details=True)
        # Allow generation if at least one source exists; extractor will filter valid content
        has_any_source = bool(project.sources)
        if not has_any_source:
            raise_invalid_request("No sources available")

        job = project.generation_job
        if job and job.status in _PENDING_STATUSES:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Document generation already in progress")

        now = datetime.now(tz=UTC)
        if not job:
            job = GenerationJob(project_id=project.id)
            self.session.add(job)

        job.status = JobStatus.PENDING
        job.error = None
        job.updated_at = now

        await self.session.commit()
        await self.session.refresh(job)
        return JobStatusRead.model_validate(job, from_attributes=True)

    async def get_document_status(self, project_id: int) -> JobStatusRead:
        """Get document generation status."""
        project = await self.get_project(project_id, with_details=True)
        job = project.generation_job
        if not job:
            raise_resource_unavailable("Document job", "not created yet")
        return JobStatusRead.model_validate(job, from_attributes=True)

    async def get_document(self, project_id: int) -> DocumentRead:
        """Get generated document."""
        project = await self.get_project(project_id, with_details=True)
        if not project.document:
            raise_resource_unavailable("Document", "not generated yet")
        return DocumentRead.model_validate(project.document, from_attributes=True)

    async def update_document(self, project_id: int, *, title: str | None) -> DocumentRead:
        """Update document title."""
        project = await self.get_project(project_id, with_details=True)
        if not project.document:
            raise_resource_unavailable("Document", "not generated yet")
        if title:
            project.document.title = title
            await self.session.commit()
            await self.session.refresh(project.document)
        return DocumentRead.model_validate(project.document, from_attributes=True)

    async def delete_document(self, project_id: int) -> None:
        """Delete document and generation job for a project."""
        project = await self.get_project(project_id, with_details=True)
        
        # Delete document if exists
        if project.document:
            await self.session.delete(project.document)

        # Delete notes job if exists
        if project.generation_job:
            await self.session.delete(project.generation_job)

        await self.session.commit()

    def _to_summary(self, project: Project) -> ProjectSummary:
        """Convert Project model to ProjectSummary schema."""
        processing_status = (
            JobStatusRead.model_validate(project.processing_job, from_attributes=True)
            if project.processing_job
            else None
        )
        document_status = (
            JobStatusRead.model_validate(project.generation_job, from_attributes=True)
            if project.generation_job
            else None
        )
        
        # Count audio sources
        sources_count = len([s for s in project.sources if s.type == SourceType.AUDIO])
        
        return ProjectSummary(
            id=project.id,
            title=project.title,
            created_at=project.created_at,
            sources_count=sources_count,
            processing_status=processing_status,
            document_status=document_status,
        )

    def _to_detail(self, project: Project) -> ProjectDetail:
        """Convert Project model to ProjectDetail schema."""
        from app.services.sources import SourceService
        
        # Convert sources to new unified SourceRead format
        sources = [SourceService._to_source_read(source) for source in project.sources]
        
        document = self._to_document(project.document)
        processing_status = (
            JobStatusRead.model_validate(project.processing_job, from_attributes=True)
            if project.processing_job
            else None
        )
        document_status = (
            JobStatusRead.model_validate(project.generation_job, from_attributes=True)
            if project.generation_job
            else None
        )

        return ProjectDetail(
            id=project.id,
            title=project.title,
            created_at=project.created_at,
            description=project.description,
            sources=sources,
            document=document,
            sources_count=len([s for s in project.sources if s.type == SourceType.AUDIO]),
            processing_status=processing_status,
            document_status=document_status,
        )

    @staticmethod
    def _to_document(document) -> DocumentRead | None:
        """Convert Document model to DocumentRead schema."""
        if not document:
            return None
        return DocumentRead.model_validate(document, from_attributes=True)
