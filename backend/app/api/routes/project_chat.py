"""API routes for project chat functionality."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.api.deps import get_db_session
from app.core.auth import current_user_with_demo
from app.models import User
from app.schemas import (
    ProjectChatMessageCreate, ChatMessageRead, ProjectChatHistoryResponse,
    ChatSessionCreate, ChatSessionRead, ChatSessionListResponse
)
from app.services.project_chat import ProjectChatService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/projects", tags=["project-chat"])
def get_project_chat_service(
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(current_user_with_demo),
) -> ProjectChatService:
    """Dependency to get ProjectChatService instance."""
    return ProjectChatService(session=session, user=user)


# ==================== SESSION ENDPOINTS ====================

@router.get("/{project_id}/chat/sessions", response_model=ChatSessionListResponse)
async def list_chat_sessions(
    project_id: int,
    service: ProjectChatService = Depends(get_project_chat_service),
) -> ChatSessionListResponse:
    """List all chat sessions for a project."""
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    sessions_with_counts = await service.list_sessions(project_id)
    session_reads = [
        ChatSessionRead(
            id=s.id,
            project_id=s.project_id,
            title=s.title,
            created_at=s.created_at.isoformat(),
            updated_at=s.updated_at.isoformat(),
            message_count=count
        )
        for s, count in sessions_with_counts
    ]
    
    return ChatSessionListResponse(sessions=session_reads, total_count=len(session_reads))


@router.post("/{project_id}/chat/sessions", response_model=ChatSessionRead, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    project_id: int,
    payload: ChatSessionCreate,
    service: ProjectChatService = Depends(get_project_chat_service),
) -> ChatSessionRead:
    """Create a new chat session for a project."""
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    session_obj = await service.create_session(project_id, payload.title)
    return ChatSessionRead(
        id=session_obj.id,
        project_id=session_obj.project_id,
        title=session_obj.title,
        created_at=session_obj.created_at.isoformat(),
        updated_at=session_obj.updated_at.isoformat(),
        message_count=0
    )


@router.delete("/{project_id}/chat/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    project_id: int,
    session_id: int,
    service: ProjectChatService = Depends(get_project_chat_service),
):
    """Delete a chat session and all its messages."""
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    deleted = await service.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")


@router.get("/{project_id}/chat/sessions/{session_id}/history", response_model=ProjectChatHistoryResponse)
async def get_session_chat_history(
    project_id: int,
    session_id: int,
    service: ProjectChatService = Depends(get_project_chat_service),
) -> ProjectChatHistoryResponse:
    """Get conversation history for a specific session."""
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    messages = await service.get_session_history(session_id)
    return ProjectChatHistoryResponse(
        project_id=project_id,
        messages=[ChatMessageRead.model_validate(msg) for msg in messages],
        total_count=len(messages)
    )


# ==================== CHAT ENDPOINT ====================

@router.post("/{project_id}/chat")
async def send_project_chat_message(
    project_id: int,
    payload: ProjectChatMessageCreate,
    service: ProjectChatService = Depends(get_project_chat_service),
) -> StreamingResponse:
    """Send a message and stream AI response for a project.
    
    The session_id in payload determines which session to save messages to.
    If no session_id is provided, messages go to session_id=null (deprecated).
    """
    # Validate project access before starting stream
    project = await service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    async def generate():
        try:
            async for chunk in service.send_message(
                project_id=project_id,
                message=payload.message,
                action=payload.action,
                selected_text=payload.selected_text,
                source_ids=payload.source_ids,
                session_id=payload.session_id,
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except ValueError as e:
            logger.warning(f"Chat value error for project {project_id}: {e}")
            yield f"data: [ERROR] {str(e)}\n\n"
        except Exception as e:
            logger.exception(f"Unexpected error in chat stream for project {project_id}")
            yield f"data: [ERROR] Une erreur inattendue s'est produite\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
