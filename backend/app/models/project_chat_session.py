"""Project chat session model for persistent conversations.

Allows users to have multiple chat sessions per project.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ProjectChatSession(Base):
    """A chat session for project-level conversations.
    
    Each session groups related messages together, allowing users
    to have multiple independent conversations about a project.
    """
    
    __tablename__ = "project_chat_session"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Nouvelle conversation")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC), onupdate=lambda: datetime.now(tz=UTC))
    
    # Relationships
    project = relationship("Project", back_populates="chat_sessions")
    messages = relationship("ProjectChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ProjectChatMessage.created_at")
