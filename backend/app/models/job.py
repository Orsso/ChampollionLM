from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import JobStatus


class ProcessingJob(Base):
    """
    Source processing job (handles any type of source → text conversion).

    Processing types:
    - TRANSCRIPTION: Audio → Text (STT)
    - OCR: Image/Scanned PDF → Text
    - EXTRACTION: Text PDF → Text (direct)
    - TRANSLATION: Text → Text (different language)
    """
    __tablename__ = "processing_job"
    __table_args__ = (UniqueConstraint("project_id", name="uq_processing_job_project"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    # TODO: Add job_type field to differentiate TRANSCRIPTION, OCR, EXTRACTION, etc.
    # job_type: Mapped[ProcessingJobType] = mapped_column(String(20), nullable=False)
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus, name="processing_job_status", native_enum=False), nullable=False, default=JobStatus.PENDING)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(tz=UTC))

    project = relationship("Project", back_populates="processing_job")


class GenerationJob(Base):
    """
    Document generation job.

    Handles generation of any document type from project sources:
    notes, summaries, articles, quizzes, etc.
    """
    __tablename__ = "generation_job"
    __table_args__ = (UniqueConstraint("project_id", name="uq_generation_job_project"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus, name="generation_job_status", native_enum=False), nullable=False, default=JobStatus.PENDING)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(tz=UTC))

    project = relationship("Project", back_populates="generation_job")

