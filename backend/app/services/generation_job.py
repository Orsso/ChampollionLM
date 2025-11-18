"""Service for managing generation jobs (document generation)."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import GenerationJob, JobStatus, Project

logger = logging.getLogger(__name__)


class GenerationJobService:
    """CRUD and lifecycle management for GenerationJob."""

    def __init__(self, session: AsyncSession):
        """
        Initialize GenerationJobService.

        Args:
            session: AsyncSession for database operations
        """
        self.session = session

    async def get_job(self, job_id: int) -> GenerationJob | None:
        """
        Get a generation job by ID.

        Args:
            job_id: ID of the generation job

        Returns:
            GenerationJob if found, None otherwise
        """
        result = await self.session.execute(
            select(GenerationJob).where(GenerationJob.id == job_id)
        )
        return result.scalars().first()

    async def get_job_by_project(self, project_id: int) -> GenerationJob | None:
        """
        Get the generation job for a specific project.

        Args:
            project_id: ID of the project

        Returns:
            GenerationJob if found, None otherwise
        """
        result = await self.session.execute(
            select(GenerationJob).where(GenerationJob.project_id == project_id)
        )
        return result.scalars().first()

    async def get_or_create_job(self, project_id: int) -> GenerationJob:
        """
        Get existing generation job for project, or create one if none exists.

        Args:
            project_id: ID of the project

        Returns:
            Existing or newly created GenerationJob
        """
        job = await self.get_job_by_project(project_id)
        if job:
            return job

        job = GenerationJob(project_id=project_id)
        self.session.add(job)
        await self.session.flush()  # Flush to get the ID
        return job

    async def mark_in_progress(self, job_id: int) -> GenerationJob:
        """
        Mark a generation job as in progress.

        Args:
            job_id: ID of the generation job

        Returns:
            Updated GenerationJob

        Raises:
            ValueError: If job not found
        """
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"Generation job {job_id} not found")

        job.status = JobStatus.IN_PROGRESS
        job.error = None
        job.updated_at = datetime.now(tz=UTC)
        await self.session.flush()
        return job

    async def mark_succeeded(self, job_id: int) -> GenerationJob:
        """
        Mark a generation job as succeeded.

        Args:
            job_id: ID of the generation job

        Returns:
            Updated GenerationJob

        Raises:
            ValueError: If job not found
        """
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"Generation job {job_id} not found")

        job.status = JobStatus.SUCCEEDED
        job.error = None
        job.updated_at = datetime.now(tz=UTC)
        await self.session.flush()
        return job

    async def mark_failed(self, job_id: int, error_message: str) -> GenerationJob:
        """
        Mark a generation job as failed with error message.

        Args:
            job_id: ID of the generation job
            error_message: Error message (will be truncated if too long)

        Returns:
            Updated GenerationJob

        Raises:
            ValueError: If job not found
        """
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"Generation job {job_id} not found")

        job.status = JobStatus.FAILED
        job.error = self._truncate_error(error_message)
        job.updated_at = datetime.now(tz=UTC)
        await self.session.flush()
        return job

    async def get_project(self, job_id: int) -> Project | None:
        """
        Get the project associated with a generation job.

        Args:
            job_id: ID of the generation job

        Returns:
            Project if found, None otherwise
        """
        job = await self.get_job(job_id)
        if not job:
            return None

        result = await self.session.execute(
            select(Project).where(Project.id == job.project_id)
                .options(selectinload(Project.owner))
        )
        return result.scalars().first()

    async def delete_job(self, job_id: int) -> bool:
        """
        Delete a generation job.

        Args:
            job_id: ID of the generation job

        Returns:
            True if deleted, False if not found
        """
        job = await self.get_job(job_id)
        if not job:
            return False

        await self.session.delete(job)
        await self.session.flush()
        return True

    @staticmethod
    def _truncate_error(message: str, length: int = 512) -> str:
        """
        Truncate error message to maximum length.

        Args:
            message: Error message to truncate
            length: Maximum length (default 512)

        Returns:
            Truncated message
        """
        if len(message) <= length:
            return message
        return message[: length - 3] + "..."
