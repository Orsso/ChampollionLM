"""Generic base service for job lifecycle management.

This module provides a generic base class for CRUD and lifecycle management
of job models (ProcessingJob, GenerationJob, etc.), following DRY principles.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import JobStatus, Project

logger = logging.getLogger(__name__)

# Generic type variable for job models
TJob = TypeVar("TJob")


class BaseJobService(Generic[TJob]):
    """
    Generic CRUD and lifecycle management for job models.
    
    Subclasses must set `model_class` to the specific job model.
    This eliminates code duplication between ProcessingJobService 
    and GenerationJobService.
    """
    
    model_class: type[TJob]
    job_name: str = "job"  # For error messages
    
    def __init__(self, session: AsyncSession):
        """
        Initialize the job service.

        Args:
            session: AsyncSession for database operations
        """
        self.session = session

    async def get_job(self, job_id: int) -> TJob | None:
        """
        Get a job by ID.

        Args:
            job_id: ID of the job

        Returns:
            Job if found, None otherwise
        """
        result = await self.session.execute(
            select(self.model_class).where(self.model_class.id == job_id)
        )
        return result.scalars().first()

    async def get_job_by_project(self, project_id: int) -> TJob | None:
        """
        Get the job for a specific project.

        Args:
            project_id: ID of the project

        Returns:
            Job if found, None otherwise
        """
        result = await self.session.execute(
            select(self.model_class).where(self.model_class.project_id == project_id)
        )
        return result.scalars().first()

    async def get_or_create_job(self, project_id: int) -> TJob:
        """
        Get existing job for project, or create one if none exists.

        Args:
            project_id: ID of the project

        Returns:
            Existing or newly created job
        """
        job = await self.get_job_by_project(project_id)
        if job:
            return job

        job = self.model_class(project_id=project_id)
        self.session.add(job)
        await self.session.flush()
        return job

    async def mark_in_progress(self, job_id: int) -> TJob:
        """
        Mark a job as in progress.

        Args:
            job_id: ID of the job

        Returns:
            Updated job

        Raises:
            ValueError: If job not found
        """
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"{self.job_name} {job_id} not found")

        job.status = JobStatus.IN_PROGRESS
        job.error = None
        job.updated_at = datetime.now(tz=UTC)
        await self.session.flush()
        return job

    async def mark_succeeded(self, job_id: int) -> TJob:
        """
        Mark a job as succeeded.

        Args:
            job_id: ID of the job

        Returns:
            Updated job

        Raises:
            ValueError: If job not found
        """
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"{self.job_name} {job_id} not found")

        job.status = JobStatus.SUCCEEDED
        job.error = None
        job.updated_at = datetime.now(tz=UTC)
        await self.session.flush()
        return job

    async def mark_failed(self, job_id: int, error_message: str) -> TJob:
        """
        Mark a job as failed with error message.

        Args:
            job_id: ID of the job
            error_message: Error message (will be truncated if too long)

        Returns:
            Updated job

        Raises:
            ValueError: If job not found
        """
        job = await self.get_job(job_id)
        if not job:
            raise ValueError(f"{self.job_name} {job_id} not found")

        job.status = JobStatus.FAILED
        job.error = self._truncate_error(error_message)
        job.updated_at = datetime.now(tz=UTC)
        await self.session.flush()
        return job

    async def get_project(self, job_id: int) -> Project | None:
        """
        Get the project associated with a job.

        Args:
            job_id: ID of the job

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
        Delete a job.

        Args:
            job_id: ID of the job

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
