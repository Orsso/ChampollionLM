"""API routes for document chat functionality."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.core.auth import current_user_with_demo
from app.models import User
from app.schemas import ChatMessageCreate, ChatMessageRead, ChatHistoryResponse
from app.services.chat import ChatService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["chat"])


def get_chat_service(
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user_with_demo),
) -> ChatService:
    """Dependency to get ChatService instance."""
    return ChatService(session=session, user=user)


@router.post("/{document_id}/chat")
async def send_chat_message(
    document_id: int,
    payload: ChatMessageCreate,
    service: ChatService = Depends(get_chat_service),
) -> StreamingResponse:
    """Send a message and stream AI response.
    
    Returns a streaming response with Server-Sent Events format.
    Each chunk is sent as `data: {chunk}\n\n`.
    End of stream is signaled with `data: [DONE]\n\n`.
    
    Args:
        document_id: ID of the document to chat about
        payload: Chat message request body
        
    Returns:
        StreamingResponse with AI-generated content
        
    Raises:
        404: Document not found
        400: API key not configured
    """
    async def generate():
        try:
            async for chunk in service.send_message(
                document_id=document_id,
                message=payload.message,
                action=payload.action,
                selected_text=payload.selected_text,
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except ValueError as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.get(
    "/{document_id}/chat/history",
    response_model=ChatHistoryResponse
)
async def get_chat_history(
    document_id: int,
    service: ChatService = Depends(get_chat_service),
) -> ChatHistoryResponse:
    """Get conversation history for a document.
    
    Args:
        document_id: ID of the document
        
    Returns:
        Chat history with all messages
    """
    # Verify document access
    document = await service.get_document(document_id)
    if not document:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    messages = await service.get_history(document_id)
    return ChatHistoryResponse(
        document_id=document_id,
        messages=[ChatMessageRead.model_validate(msg) for msg in messages],
        total_count=len(messages)
    )


@router.delete(
    "/{document_id}/chat/history",
    status_code=status.HTTP_204_NO_CONTENT
)
async def clear_chat_history(
    document_id: int,
    service: ChatService = Depends(get_chat_service),
):
    """Clear conversation history for a document.
    
    Args:
        document_id: ID of the document
    """
    # Verify document access
    document = await service.get_document(document_id)
    if not document:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    await service.clear_history(document_id)
