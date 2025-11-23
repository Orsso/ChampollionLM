from __future__ import annotations

import logging
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Project, Source, SourceType, User
from app.schemas import SourceCreate, SourceDetail, SourceRead, SourceUpdate
from app.utils.db import save_and_refresh
from app.utils.errors import raise_invalid_request, raise_not_found, raise_resource_unavailable
from app.utils.tokens import estimate_tokens


class SourceNotFoundError(HTTPException):
    """Raised when a source is not found."""
    def __init__(self, source_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source {source_id} not found"
        )


class SourceService:
    """Service for managing sources."""
    
    def __init__(self, session: AsyncSession, user: User):
        self.session = session
        self.user = user
    
    async def create_source(self, project_id: int, data: SourceCreate) -> SourceRead:
        """Create a new source for a project."""
        # Verify project ownership
        project = await self._get_project(project_id)
        
        # Validate source data
        if data.type == SourceType.DOCUMENT and not data.content:
            raise_invalid_request("Document sources must have content")

        # Create source
        source = Source(
            project_id=project.id,
            type=data.type,
            title=data.title,
            content=data.content,
            source_metadata=data.metadata,  # Map metadata (API) to source_metadata (DB)
        )

        # For document sources, set processed_content immediately
        # Documents don't need processing - they're already in text form
        if data.type == SourceType.DOCUMENT and data.content:
            source.processed_content = data.content
            source.token_count = estimate_tokens(data.content)

        await save_and_refresh(self.session, source)

        return self._to_source_read(source)
    
    async def list_sources(self, project_id: int) -> list[SourceRead]:
        """List all sources for a project."""
        # Verify project ownership
        await self._get_project(project_id)
        
        # Query sources
        stmt = (
            select(Source)
            .where(Source.project_id == project_id)
            .order_by(Source.created_at)
        )
        result = await self.session.execute(stmt)
        sources = result.scalars().all()
        
        return [self._to_source_read(source) for source in sources]
    
    async def get_source(self, project_id: int, source_id: int) -> SourceDetail:
        """Get detailed information about a source."""
        source = await self._get_source_with_ownership(project_id, source_id)
        
        return SourceDetail.model_validate(source)
    
    async def delete_source(self, project_id: int, source_id: int) -> None:
        """Delete a source and its associated file if present."""
        source = await self._get_source_with_ownership(project_id, source_id)
        
        # Delete file on disk if present
        if source.file_path:
            file_path = Path(source.file_path)
            if file_path.exists():
                try:
                    file_path.unlink()
                except OSError as exc:
                    # Log but don't block DB deletion
                    logging.warning(f"Failed to delete file {file_path}: {exc}")
        
        await self.session.delete(source)
        await self.session.commit()

    async def update_source(self, project_id: int, source_id: int, payload: SourceUpdate) -> SourceRead:
    
        source = await self._get_source_with_ownership(project_id, source_id)
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(source, key, value)
        
        # Recalculate tokens if content changed
        if 'processed_content' in update_data and update_data['processed_content']:
             source.token_count = estimate_tokens(update_data['processed_content'])
        elif 'content' in update_data and update_data['content'] and source.type == SourceType.DOCUMENT:
             source.processed_content = update_data['content']
             source.token_count = estimate_tokens(update_data['content'])

        await self.session.commit()
        await self.session.refresh(source)
        return self._to_source_read(source)
    
    async def get_sources_by_ids(
        self,
        project_id: int,
        source_ids: list[int] | None = None
    ) -> list[Source]:
        """Get sources by IDs, or all sources if no IDs provided."""
        # Verify project ownership
        await self._get_project(project_id)
        
        # Build query
        stmt = (
            select(Source)
            .where(Source.project_id == project_id)
        )
        
        if source_ids:
            stmt = stmt.where(Source.id.in_(source_ids))
        
        stmt = stmt.order_by(Source.created_at)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_source_file(self, project_id: int, source_id: int):
        source = await self._get_source_with_ownership(project_id, source_id)
        if not source.file_path:
            raise_resource_unavailable("Source file", "no file path set")
        file_path = Path(source.file_path)
        if not file_path.exists():
            raise_resource_unavailable("Source file", "file not found on disk")
        # Infer media type
        ext = file_path.suffix.lower()
        media_types = {
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".webm": "audio/webm",
            ".m4a": "audio/mp4",
        }
        media_type = media_types.get(ext, "application/octet-stream")
        from fastapi.responses import FileResponse
        return FileResponse(path=str(file_path), media_type=media_type, filename=file_path.name)
    
    async def _get_project(self, project_id: int) -> Project:
        """Get project and verify ownership."""
        stmt = select(Project).where(Project.id == project_id, Project.user_id == self.user.id)
        result = await self.session.execute(stmt)
        project = result.scalars().first()

        if not project:
            raise_not_found("Project", project_id)

        return project
    
    async def _get_source_with_ownership(self, project_id: int, source_id: int) -> Source:
        """Get source and verify project ownership."""
        await self._get_project(project_id)
        
        stmt = (
            select(Source)
            .where(Source.id == source_id, Source.project_id == project_id)
        )
        result = await self.session.execute(stmt)
        source = result.scalars().first()
        
        if not source:
            raise SourceNotFoundError(source_id)
        
        return source
    
    @staticmethod
    def _to_source_read(source: Source) -> SourceRead:
        """Convert Source model to SourceRead schema."""
        return SourceRead(
            id=source.id,
            type=source.type,
            status=source.status,
            title=source.title,
            created_at=source.created_at,
            processed_content=source.processed_content,
            audio_metadata=source.audio_metadata,
            document_metadata=source.document_metadata,
            content=source.content if source.type == SourceType.DOCUMENT else None,
        )
