"""Chat service for document conversations with AI.

Uses Mistral function calling for RAG-based source search.
Inherits common agentic loop logic from BaseChatService.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import AsyncIterator, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import ChatMessage, Document, User
from app.services.base_chat import BaseChatService, MAX_HISTORY_MESSAGES
from app.services.embedding import EmbeddingService

logger = logging.getLogger(__name__)


class ChatService(BaseChatService):
    """Service for managing document chat conversations.
    
    Provides AI-powered chat capabilities for documents, including:
    - Contextual responses based on document content
    - RAG-based source search via tool calling
    - Streaming responses for real-time UI updates
    - Conversation history management
    """

    def __init__(self, session: AsyncSession, user: User):
        """Initialize ChatService."""
        super().__init__(session, user)
        self._embedding_service: EmbeddingService | None = None

    def _get_embedding_service(self) -> EmbeddingService:
        """Lazy-load embedding service."""
        if self._embedding_service is None:
            self._embedding_service = EmbeddingService(self.user)
        return self._embedding_service

    async def get_document(self, document_id: int) -> Document | None:
        """Get document with sources preloaded."""
        result = await self.session.execute(
            select(Document)
            .options(
                selectinload(Document.sources),
                selectinload(Document.project)
            )
            .where(Document.id == document_id)
        )
        document = result.scalar_one_or_none()

        if not document:
            return None

        if document.project and document.project.user_id != self.user.id:
            return None

        return document

    async def get_history(self, document_id: int) -> list[ChatMessage]:
        """Get conversation history for a document."""
        result = await self.session.execute(
            select(ChatMessage)
            .where(ChatMessage.document_id == document_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(result.scalars().all())

    async def clear_history(self, document_id: int) -> None:
        """Clear conversation history for a document."""
        result = await self.session.execute(
            select(ChatMessage)
            .where(ChatMessage.document_id == document_id)
        )
        messages = result.scalars().all()
        for msg in messages:
            await self.session.delete(msg)
        await self.session.commit()

    async def send_message(
        self,
        document_id: int,
        message: str,
        *,
        action: str | None = None,
        selected_text: str | None = None
    ) -> AsyncIterator[str]:
        """Send a message and stream the AI response."""
        document = await self.get_document(document_id)
        if not document:
            raise ValueError("Document not found or access denied")

        if not self.user.api_key_encrypted:
            raise ValueError("API key not configured")

        # Save user message
        user_msg = ChatMessage(
            document_id=document_id,
            role="user",
            content=message,
            message_metadata={
                "action": action,
                "selected_text": selected_text
            } if action or selected_text else None,
            created_at=datetime.now(tz=UTC)
        )
        self.session.add(user_msg)
        await self.session.flush()

        # Index sources for RAG
        sources = list(document.sources)
        if sources:
            embedding_svc = self._get_embedding_service()
            await embedding_svc.index_sources(document_id, sources)

        # Get recent history
        history = await self.get_history(document_id)
        history = [h for h in history if h.id != user_msg.id][-MAX_HISTORY_MESSAGES:]

        # Build messages for Mistral
        messages = self._build_messages(document, history, message, action, selected_text)

        # Agentic loop - capture sources for saving
        full_response = ""
        sources_used: list[str] = []
        chunks_found: list[dict] = []
        
        async for chunk in self._agentic_loop(document_id, messages):
            if chunk.startswith("[EVENT:search_complete:"):
                try:
                    payload_str = chunk[23:-1]
                    payload = json.loads(payload_str)
                    sources_used = payload.get("sources", [])
                    chunks_found = payload.get("chunks", [])
                except Exception:
                    pass
            elif not chunk.startswith("[EVENT:"):
                full_response += chunk
            yield chunk

        clean_response = self.clean_response(full_response)

        # Save assistant response
        assistant_metadata = None
        if sources_used or chunks_found:
            assistant_metadata = {
                "sources_used": sources_used,
                "chunks_found": chunks_found
            }

        assistant_msg = ChatMessage(
            document_id=document_id,
            role="assistant",
            content=clean_response.strip(),
            message_metadata=assistant_metadata,
            created_at=datetime.now(tz=UTC)
        )
        self.session.add(assistant_msg)
        await self.session.commit()

    async def _search_sources(self, document_id: int, query: str) -> tuple[str, list[str], list[dict]]:
        """Execute search in document sources."""
        embedding_svc = self._get_embedding_service()
        
        try:
            results = await embedding_svc.search(document_id, query, top_k=3)
        except Exception as exc:
            logger.error("Error searching sources", exc_info=exc)
            return "Erreur lors de la recherche dans les sources.", [], []

        return self.format_search_results(results, query)

    def _build_messages(
        self,
        document: Document,
        history: list[ChatMessage],
        message: str,
        action: str | None,
        selected_text: str | None
    ) -> list[dict[str, Any]]:
        """Build message list for Mistral API."""
        
        system_prompt = """Tu es un assistant pédagogique pour un étudiant qui consulte ses notes de cours.

RÈGLES IMPORTANTES:
1. Si l'utilisateur pose une QUESTION sur le contenu, les sources, ou demande une info spécifique → UTILISE L'OUTIL search_sources pour chercher dans les sources originales (transcriptions, documents PDF, etc.)
2. Si l'utilisateur dit "bonjour", "merci", ou fait la conversation → réponds normalement SANS utiliser l'outil
3. Si l'utilisateur demande si un mot/concept est mentionné → UTILISE L'OUTIL search_sources
4. Quand tu utilises l'outil, base ta réponse sur les extraits retournés

STYLE DE RÉPONSE:
- Sois CONCIS: 1-3 paragraphes maximum
- Réponds en français
- NE CITE JAMAIS les sources dans ta réponse (les sources sont affichées automatiquement par l'interface)
- Ne mets pas de section "Sources:" ou "Références:" - c'est géré par le système

DOCUMENT DE RÉFÉRENCE (résumé des notes):
""" + document.markdown[:3000]

        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt}
        ]

        for msg in history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        user_content = message
        if selected_text:
            user_content = f'[Texte sélectionné: "{selected_text[:200]}"]\n\n{message}'
        if action:
            action_prompts = {
                "explain": "Explique ce passage.",
                "expand": "Développe ce point.",
                "summarize": "Résume ce contenu.",
                "refine": "Propose des améliorations.",
            }
            user_content = f"{action_prompts.get(action, '')}\n\n{user_content}"

        messages.append({"role": "user", "content": user_content})

        return messages
