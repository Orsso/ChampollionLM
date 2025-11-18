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
from .metadata import AudioMetadata, DocumentMetadata


class SourceType(str, Enum):
    """
    LEGACY: Simple source type classification.

    TODO: Migrate to SourceFormat (models/enums.py) which uses MIME types
    for precise format handling (audio/mp3, application/pdf, text/markdown, etc.).
    """
    AUDIO = "audio"
    DOCUMENT = "document"


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

    # Structured metadata: JSON storage for type-safe metadata handling
    # Contains AudioMetadata or DocumentMetadata depending on source type
    source_metadata: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        default=None
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(tz=UTC)
    )

    # Relationships
    project = relationship("Project", back_populates="sources")

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
