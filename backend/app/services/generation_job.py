"""Service for managing generation jobs (document generation)."""

from __future__ import annotations

from app.models import GenerationJob
from app.services.base_job import BaseJobService


class GenerationJobService(BaseJobService[GenerationJob]):
    """
    CRUD and lifecycle management for GenerationJob.
    
    Inherits all common job operations from BaseJobService.
    Add any generation-specific methods here if needed.
    """
    
    model_class = GenerationJob
    job_name = "Generation job"
