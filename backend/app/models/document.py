from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Document(Base):
    __tablename__ = "document"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str | None] = mapped_column(String(160), nullable=True)
    markdown: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="cours")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC))

    # Relationship to Project (many-to-one)
    project = relationship("Project", back_populates="documents")
    
    # Relationship to sources used for generation (via association table)
    sources = relationship(
        "Source",
        secondary="document_source",
        back_populates="documents",
        lazy="selectin"
    )
    
    # Relationship to chat messages
    chat_messages = relationship(
        "ChatMessage",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )
