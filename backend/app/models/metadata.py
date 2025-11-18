"""Structured metadata types for sources."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class AudioMetadata(BaseModel):
    """Metadata for audio sources.

    Contains information about audio file characteristics
    extracted during upload or processing.
    """
    duration_seconds: Optional[float] = Field(
        None,
        description="Audio duration in seconds",
        ge=0
    )
    sample_rate: Optional[int] = Field(
        None,
        description="Sample rate in Hz (e.g., 44100, 48000)",
        ge=0
    )
    channels: Optional[int] = Field(
        None,
        description="Number of audio channels (1 for mono, 2 for stereo)",
        ge=1,
        le=8
    )
    size_bytes: Optional[int] = Field(
        None,
        description="File size in bytes",
        ge=0
    )
    format: Optional[str] = Field(
        None,
        description="Audio file format (e.g., 'mp3', 'wav', 'ogg')"
    )
    bitrate: Optional[int] = Field(
        None,
        description="Audio bitrate in kbps",
        ge=0
    )

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "duration_seconds": 125.5,
                "sample_rate": 44100,
                "channels": 2,
                "size_bytes": 2048000,
                "format": "mp3",
                "bitrate": 128
            }
        }


class DocumentMetadata(BaseModel):
    """Metadata for document sources.

    Contains information about document file characteristics
    extracted during upload or processing.
    """
    pages: Optional[int] = Field(
        None,
        description="Number of pages in the document",
        ge=1
    )
    word_count: Optional[int] = Field(
        None,
        description="Total word count in the document",
        ge=0
    )
    size_bytes: Optional[int] = Field(
        None,
        description="File size in bytes",
        ge=0
    )
    format: Optional[str] = Field(
        None,
        description="Document file format (e.g., 'pdf', 'docx', 'txt')"
    )
    language: Optional[str] = Field(
        None,
        description="Detected document language (ISO 639-1 code)"
    )

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "pages": 15,
                "word_count": 3500,
                "size_bytes": 1024000,
                "format": "pdf",
                "language": "en"
            }
        }


class SourceMetadataUnion(BaseModel):
    """Union of all metadata types.

    Container for source metadata that can hold either audio
    or document metadata, depending on the source type.
    """
    audio: Optional[AudioMetadata] = Field(
        None,
        description="Audio metadata (present if source is audio)"
    )
    document: Optional[DocumentMetadata] = Field(
        None,
        description="Document metadata (present if source is document)"
    )

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "audio": {
                    "duration_seconds": 125.5,
                    "sample_rate": 44100,
                    "channels": 2,
                    "size_bytes": 2048000,
                    "format": "mp3"
                }
            }
        }
