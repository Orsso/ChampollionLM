from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models import ProjectStatus, JobStatus

if TYPE_CHECKING:
    from .source import SourceRead


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=160)
    description: str | None = Field(default=None)


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None)


class DocumentRead(BaseModel):
    """
    Generated document from sources.

    Corresponds to Frontend: src/types/index.ts::Document

    Type Mapping (see docs/TYPE_MAPPING.md):
    - provider: str → string ('mistral', etc.)
    - title: str | None → string | undefined
    - markdown: str → string (full document content)
    - created_at: datetime → string (ISO 8601)
    - type: str → string ('cours', 'resume', 'quiz')
    """
    id: int
    provider: str
    title: str | None = None
    markdown: str
    created_at: datetime
    type: str = "cours"

    model_config = ConfigDict(from_attributes=True)


class DocumentUpdate(BaseModel):
    """Update document title."""
    title: str | None = Field(default=None, min_length=1, max_length=160)


class ProjectSummary(BaseModel):
    """
    Project summary for list views.

    Corresponds to Frontend: src/types/index.ts::Project

    Type Mapping (see docs/TYPE_MAPPING.md):
    - id: int → string (converted at API boundary)
    - title: str → string
    - created_at: datetime → string (ISO 8601)
    - processing_status: JobStatusRead | None → ProcessingJob | null
    - document_status: JobStatusRead | None → GenerationJob | null
    - status: (computed) ProjectStatus → (computed) ProjectStatus
    """
    id: int
    title: str
    created_at: datetime
    sources_count: int = 0
    processing_status: JobStatusRead | None = None
    document_status: JobStatusRead | None = None

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def status(self) -> ProjectStatus:
        """Compute project status from job statuses.

        Rules:
        - If processing job in progress → PROCESSING
        - If generation job in progress → GENERATING (Note: not in ProjectStatus enum, fallback to PROCESSING)
        - If document exists → READY
        - Otherwise → DRAFT
        """
        if self.processing_status and self.processing_status.status in ("pending", "in_progress"):
            return ProjectStatus.PROCESSING
        if self.document_status and self.document_status.status == "in_progress":
            # Generation in progress - fallback to PROCESSING since GENERATING may not be in enum
            return ProjectStatus.PROCESSING
        if self.document_status and self.document_status.status == "succeeded":
            return ProjectStatus.READY
        return ProjectStatus.DRAFT

    @computed_field
    @property
    def status_updated_at(self) -> datetime | None:
        """Return the most recent status update time (job update time)."""
        latest_time = None
        if self.processing_status and self.processing_status.updated_at:
            latest_time = self.processing_status.updated_at
        if self.document_status and self.document_status.updated_at:
            if latest_time is None or self.document_status.updated_at > latest_time:
                latest_time = self.document_status.updated_at
        return latest_time


class ProjectDetail(ProjectSummary):
    """
    Project with full details (used for detail views).

    Corresponds to Frontend: src/types/index.ts::Project

    Type Mapping (see docs/TYPE_MAPPING.md):
    Inherits all fields from ProjectSummary, adds:
    - description: str | None → string | undefined
    - sources: list[SourceRead] → Source[]
    - documents: list[DocumentRead] → Document[]
    - processing_error: (computed) str | None → (derived from processing_status.error)
    - document_error: (computed) str | None → (derived from document_status.error)
    """
    description: str | None
    sources: list['SourceRead']
    documents: list['DocumentRead']
    processing_status: JobStatusRead | None = None
    document_status: JobStatusRead | None = None

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def processing_error(self) -> str | None:
        """Get transcription error from processing job."""
        return self.processing_status.error if self.processing_status else None

    @computed_field
    @property
    def document_error(self) -> str | None:
        """Get generation error from generation job."""
        return self.document_status.error if self.document_status else None


class TranscriptionRequest(BaseModel):
    provider: str = Field(..., min_length=1)


class DocumentRequest(BaseModel):
    """Request to generate a document from sources."""
    provider: str = Field(..., min_length=1)
    source_ids: list[int] | None = Field(default=None, description="Selected sources to include")
    title: str | None = Field(default=None, min_length=1, max_length=160)
    type: str = Field(default="cours", description="Type of document (cours, resume, quiz)")


class JobStatusRead(BaseModel):
    """
    Job status information (ProcessingJob or GenerationJob).

    Corresponds to Frontend: src/types/index.ts::ProcessingJob | GenerationJob

    Type Mapping (see docs/TYPE_MAPPING.md):
    - status: JobStatus → JobStatus ('pending' | 'in_progress' | 'succeeded' | 'failed')
    - updated_at: datetime → string (ISO 8601)
    - error: str | None → string | undefined
    """
    status: JobStatus
    updated_at: datetime
    error: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TokenEstimation(BaseModel):
    """Token count estimation for sources."""
    total_tokens: int = Field(..., description="Total token count")
    formatted_count: str = Field(..., description="Human-readable format (e.g., '45k')")
    context_percentage: float = Field(..., description="Percentage of 128k context used")
    context_limit: int = Field(..., description="Maximum context window size")
    source_count: int = Field(..., description="Number of sources included")


# Resolve forward references after SourceRead is imported
from .source import SourceRead  # noqa: E402
ProjectDetail.model_rebuild()
