from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON as PGJSON
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import SourceStatus
from .metadata import AudioMetadata, DocumentMetadata, YouTubeMetadata, PDFMetadata


class SourceType(str, Enum):
    """
    High-level source type classification for user-facing categorization.

    This enum provides simple categories for UI display and routing logic:
    
    - AUDIO: Audio files (mp3, wav, m4a, etc.) requiring speech-to-text transcription
    - DOCUMENT: Text-based document files (docx, txt, md, etc.) with direct text extraction
    - YOUTUBE: YouTube videos with transcript import from YouTube API
    - PDF: Portable Document Format files requiring OCR (Optical Character Recognition)
    
    Note: DOCUMENT and PDF are distinct because they use different processing:
    - DOCUMENT: Direct text extraction from text-based formats
    - PDF: OCR-based text extraction from binary/scanned documents
    
    For precise format handling (MIME types like audio/mp3, application/pdf, etc.),
    internal processing uses file extensions and content type detection rather than
    this enum. SourceFormat (models/enums.py) is defined for future granular tracking.
    """
    AUDIO = "audio"
    DOCUMENT = "document"
    YOUTUBE = "youtube"
    PDF = "pdf"


class Source(Base):
    """
    Unified model representing any content source (audio, documents, etc.)
    that can be used for note generation.
    """
    __tablename__ = "source"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    type: Mapped[SourceType] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)

    # Processing status: explicit tracking of source lifecycle
    status: Mapped[SourceStatus] = mapped_column(
        String(20),
        nullable=False,
        default=SourceStatus.UPLOADED,
        index=True
    )

    # Polymorphic storage: audio sources use file_path, documents use content
    file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Processed content: unified field for all extracted/processed text
    # Audio → transcription, PDF → OCR/extraction, Text → passthrough, etc.
    processed_content: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Token count for the processed content (cached for performance)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Structured metadata: JSON storage for type-safe metadata handling
    # Contains AudioMetadata or DocumentMetadata depending on source type
    source_metadata: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        default=None
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=UTC)
    )

    # Relationships
    project = relationship("Project", back_populates="sources")
    
    # Relationship to documents where this source was used (via association table)
    documents = relationship(
        "Document",
        secondary="document_source",
        back_populates="sources"
    )

    # Type-safe metadata accessors
    @property
    def audio_metadata(self) -> Optional[AudioMetadata]:
        """
        Safely extract audio metadata if this is an audio source.

        Returns:
            AudioMetadata object if valid audio source with metadata, else None
        """
        if self.type != SourceType.AUDIO or not self.source_metadata:
            return None
        try:
            return AudioMetadata(**self.source_metadata)
        except (KeyError, ValueError, TypeError):
            # Graceful fallback for invalid/legacy metadata
            return None

    @property
    def document_metadata(self) -> Optional[DocumentMetadata]:
        """
        Safely extract document metadata if this is a document source.

        Returns:
            DocumentMetadata object if valid document source with metadata, else None
        """
        if self.type != SourceType.DOCUMENT or not self.source_metadata:
            return None
        try:
            return DocumentMetadata(**self.source_metadata)
        except (KeyError, ValueError, TypeError):
            # Graceful fallback for invalid/legacy metadata
            return None

    @property
    def youtube_metadata(self) -> Optional[YouTubeMetadata]:
        """
        Safely extract YouTube metadata if this is a YouTube source.

        Returns:
            YouTubeMetadata object if valid YouTube source with metadata, else None
        """
        if self.type != SourceType.YOUTUBE or not self.source_metadata:
            return None
        try:
            return YouTubeMetadata(**self.source_metadata)
        except (KeyError, ValueError, TypeError):
            # Graceful fallback for invalid/legacy metadata
            return None

    @property
    def pdf_metadata(self) -> Optional[PDFMetadata]:
        """
        Safely extract PDF metadata if this is a PDF source.

        Returns:
            PDFMetadata object if valid PDF source with metadata, else None
        """
        if self.type != SourceType.PDF or not self.source_metadata:
            return None
        try:
            return PDFMetadata(**self.source_metadata)
        except (KeyError, ValueError, TypeError):
            # Graceful fallback for invalid/legacy metadata
            return None
