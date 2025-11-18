"""Service for managing processing jobs (transcription, OCR, extraction, etc.)."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import JobStatus, ProcessingJob, Project

logger = logging.getLogger(__name__)


class ProcessingJobService:
    """CRUD and lifecycle management for ProcessingJob."""

    def __init__(self, session: AsyncSession):
        """
        Initialize ProcessingJobService.

        Args:
            session: AsyncSession for database operations
        """
        self.session = session

    async def get_job(self, job_id: int) -> ProcessingJob | None:
        """
        Get a processing job by ID.

        Args:
            job_id: ID of the processing job

        Returns:
            ProcessingJob if found, None otherwise
        """
        result = await self.session.execute(
            select(ProcessingJob).where(ProcessingJob.id == job_id)
        )
        return result.scalars().first()

    async def get_job_by_project(self, project_id: int) -> ProcessingJob | None:
        """
        Get the processing job for a specific project.

        Args:
            project_id: ID of the project

        Returns:
            ProcessingJob if found, None otherwise
        """
        result = await self.session.execute(
            select(ProcessingJob).where(ProcessingJob.project_id == project_id)
        )
        return result.scalars().first()

    async def get_or_create_job(self, project_id: int) -> ProcessingJob:
        """
        Get existing processing job for project, or create one if none exists.

        Args:
            project_id: ID of the project

        Returns:
            Existing or newly created ProcessingJob
        """
        job = await self.get_job_by_project(project_id)
        if job:
            return job

        job = ProcessingJob(project_id=project_id)
        self.session.add(job)
        await self.session.flush()  # Flush to get the ID
        return job

    async def mark_in_progress(self, job_id: int) -> ProcessingJob:
        """
        Mark a processing job as in progress.

        Args:
            job_id: ID of the processing job

        Returns:
            Updated ProcessingJob

        Raises:
            ValueError: If job not found
        """
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"Processing job {job_id} not found")

        job.status = JobStatus.IN_PROGRESS
        job.error = None
        job.updated_at = datetime.now(tz=UTC)
        await self.session.flush()
        return job

    async def mark_succeeded(self, job_id: int) -> ProcessingJob:
        """
        Mark a processing job as succeeded.

        Args:
            job_id: ID of the processing job

        Returns:
            Updated ProcessingJob

        Raises:
            ValueError: If job not found
        """
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"Processing job {job_id} not found")

        job.status = JobStatus.SUCCEEDED
        job.error = None
        job.updated_at = datetime.now(tz=UTC)
        await self.session.flush()
        return job

    async def mark_failed(self, job_id: int, error_message: str) -> ProcessingJob:
        """
        Mark a processing job as failed with error message.

        Args:
            job_id: ID of the processing job
            error_message: Error message (will be truncated if too long)

        Returns:
            Updated ProcessingJob

        Raises:
            ValueError: If job not found
        """
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"Processing job {job_id} not found")

        job.status = JobStatus.FAILED
        job.error = self._truncate_error(error_message)
        job.updated_at = datetime.now(tz=UTC)
        await self.session.flush()
        return job

    async def get_project(self, job_id: int) -> Project | None:
        """
        Get the project associated with a processing job.

        Args:
            job_id: ID of the processing job

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
        Delete a processing job.

        Args:
            job_id: ID of the processing job

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
