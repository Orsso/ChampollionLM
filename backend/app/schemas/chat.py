"""Pydantic schemas for chat API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatMessageCreate(BaseModel):
    """Schema for creating a chat message request."""
    message: str = Field(..., min_length=1, max_length=10000)
    action: Literal["explain", "expand", "summarize", "refine"] | None = None
    selected_text: str | None = Field(None, max_length=5000)


class ChatMessageRead(BaseModel):
    """Schema for reading a chat message response."""
    id: int
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime
    message_metadata: dict | None = None

    model_config = {"from_attributes": True}


class ChatHistoryResponse(BaseModel):
    """Schema for chat history response."""
    document_id: int
    messages: list[ChatMessageRead]
    total_count: int


class ProjectChatMessageCreate(BaseModel):
    """Schema for creating a project chat message request."""
    message: str = Field(..., min_length=1, max_length=10000)
    action: Literal["explain", "expand", "summarize", "refine"] | None = None
    selected_text: str | None = Field(None, max_length=5000)
    source_ids: list[int] | None = Field(None, description="Filter to specific sources for RAG")
    session_id: int | None = Field(None, description="Chat session ID to associate this message with")


class ProjectChatHistoryResponse(BaseModel):
    """Schema for project chat history response."""
    project_id: int
    messages: list[ChatMessageRead]
    total_count: int


# ==================== SESSION SCHEMAS ====================

class ChatSessionCreate(BaseModel):
    """Schema for creating a chat session."""
    title: str = "Nouvelle conversation"


class ChatSessionRead(BaseModel):
    """Schema for reading a chat session."""
    id: int
    project_id: int
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0

    model_config = {"from_attributes": True}


class ChatSessionListResponse(BaseModel):
    """Schema for listing chat sessions."""
    sessions: list[ChatSessionRead]
    total_count: int
