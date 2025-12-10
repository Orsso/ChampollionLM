"""Database models exported for consumers."""

from .base import Base
from .user import User
from .project import Project
from .source import Source, SourceType
from .document import Document
from .document_source import DocumentSource
from .chat_message import ChatMessage
from .project_chat_message import ProjectChatMessage
from .project_chat_session import ProjectChatSession
from .job import GenerationJob, ProcessingJob
from .demo_access import DemoAccess
from .enums import (
    JobStatus,
    ProjectStatus,
    SourceFormat,
    SourceStatus,
    DocumentFormat,
    DocumentType,
    ProcessingJobType,
)

__all__ = [
    # Core models
    "Base",
    "User",
    "Project",
    "Source",
    "Document",
    "DocumentSource",
    "ChatMessage",
    "ProjectChatMessage",
    "ProjectChatSession",
    "ProcessingJob",
    "GenerationJob",
    "DemoAccess",
    # Legacy enums (still in their original files for backward compat)
    "SourceType",
    # Centralized enums
    "JobStatus",
    "ProjectStatus",
    "SourceFormat",
    "SourceStatus",
    "DocumentFormat",
    "DocumentType",
    "ProcessingJobType",
]
