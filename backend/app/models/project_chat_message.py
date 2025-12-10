"""Project chat message model for project-level conversations."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ProjectChatMessage(Base):
    """Model for storing chat conversation history per project.
    
    Messages are grouped into sessions for organization.
    Used for RAG-based conversations with all project sources.
    """
    __tablename__ = "project_chat_message"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("project_chat_session.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user" | "assistant" | "system"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Metadata for contextual messages (selected text, action type, source filters, etc.)
    message_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=None)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=UTC)
    )

    # Relationships
    project = relationship("Project", back_populates="chat_messages")
    session = relationship("ProjectChatSession", back_populates="messages")

