"""Service for managing processing jobs (transcription, OCR, extraction, etc.)."""

from __future__ import annotations

from app.models import ProcessingJob
from app.services.base_job import BaseJobService


class ProcessingJobService(BaseJobService[ProcessingJob]):
    """
    CRUD and lifecycle management for ProcessingJob.
    
    Inherits all common job operations from BaseJobService.
    Add any processing-specific methods here if needed.
    """
    
    model_class = ProcessingJob
    job_name = "Processing job"
