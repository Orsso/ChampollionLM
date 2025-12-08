from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import SourceType
from app.models.enums import SourceStatus
from app.models.metadata import AudioMetadata, DocumentMetadata, YouTubeMetadata


class ProcessedContentRead(BaseModel):
    """Processed content information (transcription, extraction, etc.)."""
    provider: str
    text: str
    created_at: datetime


class SourceCreate(BaseModel):
    """Schema for creating a new source."""
    type: SourceType
    title: str = Field(..., min_length=1, max_length=160)
    content: str | None = Field(default=None, description="Content for document sources")
    metadata: str | None = Field(default=None, description="JSON metadata")


class SourceRead(BaseModel):
    """
    Basic source information with typed metadata.

    Corresponds to Frontend: src/types/index.ts::Source

    Type Mapping (see docs/TYPE_MAPPING.md):
    - id: int → string (converted at API boundary)
    - type: SourceType → 'audio' | 'document' | 'youtube'
    - status: SourceStatus → 'uploaded' | 'processing' | 'processed' | 'failed'
    - title: str → string
    - created_at: datetime → string (ISO 8601)
    - processed_content: str | None → string | undefined
    - audio_metadata: AudioMetadata | None → AudioMetadata | undefined
    - document_metadata: DocumentMetadata | None → DocumentMetadata | undefined
    - youtube_metadata: YouTubeMetadata | None → YouTubeMetadata | undefined
    """
    id: int
    type: SourceType
    status: SourceStatus
    title: str
    created_at: datetime

    # Processed content (transcription, extraction, etc.)
    processed_content: str | None = Field(
        default=None,
        description="Processed text content (transcription for audio, extracted text for documents)"
    )

    # Typed metadata based on source type
    audio_metadata: AudioMetadata | None = Field(
        default=None,
        description="Audio file metadata (only present for audio sources)"
    )
    document_metadata: DocumentMetadata | None = Field(
        default=None,
        description="Document metadata (only present for document sources)"
    )
    youtube_metadata: YouTubeMetadata | None = Field(
        default=None,
        description="YouTube metadata (only present for YouTube sources)"
    )

    # Raw content for document sources
    content: str | None = Field(
        default=None,
        description="Raw content for document sources"
    )

    model_config = ConfigDict(from_attributes=True)


class SourceDetail(SourceRead):
    """
    Detailed source information including file paths and full content.

    Includes all fields from SourceRead plus internal file paths
    for administrative/debugging purposes.
    """
    file_path: str | None = Field(
        default=None,
        description="Internal file path for audio sources"
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SourceUpdate(BaseModel):
    """Schema for updating a source (title and/or content)."""
    title: str | None = Field(default=None, min_length=1, max_length=160)
    content: str | None = Field(default=None)
