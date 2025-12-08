"""Chat message model for document conversations."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ChatMessage(Base):
    """Model for storing chat conversation history per document.
    
    Each message is either from the user or the AI assistant.
    Messages can include metadata about text selection and action type.
    """
    __tablename__ = "chat_message"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("document.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user" | "assistant" | "system"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Metadata for contextual messages (selected text, action type, etc.)
    message_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=None)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=UTC)
    )

    # Relationship to Document
    document = relationship("Document", back_populates="chat_messages")
