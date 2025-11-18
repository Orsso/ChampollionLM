"""Database models exported for consumers."""

from .base import Base
from .user import User
from .project import Project
from .source import Source, SourceType
from .document import Document
from .job import GenerationJob, ProcessingJob
from .enums import (
    JobStatus,
    ProjectStatus,
    SourceFormat,
    SourceStatus,
    DocumentFormat,
    DocumentType,
    ProcessingJobType,
)

__all__ = [
    # Core models
    "Base",
    "User",
    "Project",
    "Source",
    "Document",
    "ProcessingJob",
    "GenerationJob",
    # Legacy enums (still in their original files for backward compat)
    "SourceType",
    # Centralized enums
    "JobStatus",
    "ProjectStatus",
    "SourceFormat",
    "SourceStatus",
    "DocumentFormat",
    "DocumentType",
    "ProcessingJobType",
]

