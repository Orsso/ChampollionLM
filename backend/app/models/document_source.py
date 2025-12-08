"""Document-Source association model for tracking which sources were used to generate a document."""

from __future__ import annotations

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class DocumentSource(Base):
    """Association table linking documents to their source materials.
    
    This tracks which sources were used when a document was generated,
    enabling the chat feature to provide contextual AI responses.
    """
    __tablename__ = "document_source"

    document_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("document.id", ondelete="CASCADE"),
        primary_key=True
    )
    source_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("source.id", ondelete="CASCADE"),
        primary_key=True
    )
