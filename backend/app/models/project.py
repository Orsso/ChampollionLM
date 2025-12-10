from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Project(Base):
    __tablename__ = "project"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC))

    owner = relationship("User", back_populates="projects")
    sources = relationship("Source", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    processing_job = relationship("ProcessingJob", back_populates="project", uselist=False, cascade="all, delete-orphan")
    generation_job = relationship("GenerationJob", back_populates="project", uselist=False, cascade="all, delete-orphan")
    chat_messages = relationship("ProjectChatMessage", back_populates="project", cascade="all, delete-orphan")
    chat_sessions = relationship("ProjectChatSession", back_populates="project", cascade="all, delete-orphan", order_by="ProjectChatSession.updated_at.desc()")

