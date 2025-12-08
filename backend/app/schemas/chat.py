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
