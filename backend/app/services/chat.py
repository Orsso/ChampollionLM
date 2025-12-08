"""Chat service for document conversations with AI.

Uses Mistral function calling for RAG-based source search.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import AsyncIterator, Any

from mistralai import Mistral
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import decrypt_api_key
from app.models import ChatMessage, Document, Source, User
from app.services.embedding import EmbeddingService, ChunkResult

logger = logging.getLogger(__name__)

# Constants
CHAT_MODEL = "mistral-large-latest"
MAX_HISTORY_MESSAGES = 10

# Tool definitions for Mistral function calling
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_sources",
            "description": "Recherche dans les sources originales du cours (transcriptions, documents). Utilise cet outil quand tu as besoin d'informations détaillées qui ne sont pas dans le document principal.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Termes de recherche pour trouver l'information pertinente"
                    }
                },
                "required": ["query"]
            }
        }
    }
]


class ChatService:
    """Service for managing document chat conversations.
    
    Provides AI-powered chat capabilities for documents, including:
    - Contextual responses based on document content
    - RAG-based source search via tool calling
    - Streaming responses for real-time UI updates
    - Conversation history management
    """

    def __init__(self, session: AsyncSession, user: User):
        """Initialize ChatService.
        
        Args:
            session: AsyncSession for database operations
            user: Current authenticated user
        """
        self.session = session
        self.user = user
        self._embedding_service: EmbeddingService | None = None

    def _get_embedding_service(self) -> EmbeddingService:
        """Lazy-load embedding service."""
        if self._embedding_service is None:
            self._embedding_service = EmbeddingService(self.user)
        return self._embedding_service

    async def get_document(self, document_id: int) -> Document | None:
        """Get document with sources preloaded.
        
        Args:
            document_id: ID of the document
            
        Returns:
            Document if found and owned by user, None otherwise
        """
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
        """Send a message and stream the AI response.
        
        Uses Mistral tool calling to allow the model to search sources when needed.
        """
        # Get document with sources
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

        # Index sources for RAG (lazy, cached)
        sources = list(document.sources)
        if sources:
            embedding_svc = self._get_embedding_service()
            await embedding_svc.index_sources(document_id, sources)

        # Get recent history
        history = await self.get_history(document_id)
        history = [h for h in history if h.id != user_msg.id][-MAX_HISTORY_MESSAGES:]

        # Build messages for Mistral
        messages = self._build_messages(document, history, message, action, selected_text)

        # Agentic loop with tool calling - capture sources for saving
        full_response = ""
        sources_used: list[str] = []
        chunks_found: list[dict] = []
        
        async for chunk in self._agentic_loop(document_id, messages):
            # Parse EVENT markers to capture sources
            if chunk.startswith("[EVENT:search_complete:"):
                try:
                    # Extract JSON payload
                    payload_str = chunk[23:-1]  # Remove [EVENT:search_complete: and ]
                    payload = json.loads(payload_str)
                    sources_used = payload.get("sources", [])
                    chunks_found = payload.get("chunks", [])
                except Exception:
                    pass
            elif not chunk.startswith("[EVENT:"):
                full_response += chunk
            yield chunk

        # Clean any remaining event markers from response (edge cases)
        import re
        clean_response = re.sub(r'\[EVENT:[^\]]*(?:\[[^\]]*\])*[^\]]*\]', '', full_response)

        # Build metadata with sources if any were found
        assistant_metadata = None
        if sources_used or chunks_found:
            assistant_metadata = {
                "sources_used": sources_used,
                "chunks_found": chunks_found
            }

        # Save assistant response (clean content + sources metadata)
        assistant_msg = ChatMessage(
            document_id=document_id,
            role="assistant",
            content=clean_response.strip(),
            message_metadata=assistant_metadata,
            created_at=datetime.now(tz=UTC)
        )
        self.session.add(assistant_msg)
        await self.session.commit()

    def _build_messages(
        self,
        document: Document,
        history: list[ChatMessage],
        message: str,
        action: str | None,
        selected_text: str | None
    ) -> list[dict[str, Any]]:
        """Build message list for Mistral API."""
        
        # System prompt
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
""" + document.markdown[:3000]  # Truncate

        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt}
        ]

        # Add history
        for msg in history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add current message
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

    async def _agentic_loop(
        self,
        document_id: int,
        messages: list[dict[str, Any]]
    ) -> AsyncIterator[str]:
        """Execute agentic loop with tool calling.
        
        1. Call model with tools
        2. If tool call, execute and add result
        3. Call model again to get final response
        """
        api_key = decrypt_api_key(self.user.api_key_encrypted)
        client = Mistral(api_key=api_key)

        max_iterations = 3  # Prevent infinite loops
        
        for iteration in range(max_iterations):
            try:
                response = await client.chat.complete_async(
                    model=CHAT_MODEL,
                    messages=messages,
                    tools=TOOLS,
                    tool_choice="auto",
                    temperature=0.3,
                    max_tokens=800,
                )
            except Exception as exc:
                logger.error("Error calling Mistral", exc_info=exc)
                return

            if not response.choices:
                return

            choice = response.choices[0]
            message = choice.message

            # Debug: log tool calls
            logger.info("Mistral response", extra={
                "has_tool_calls": bool(message.tool_calls),
                "tool_calls": [tc.function.name for tc in message.tool_calls] if message.tool_calls else [],
                "content_preview": message.content[:100] if message.content else None
            })

            # Check for tool calls
            if message.tool_calls:
                # Execute tool calls
                for tool_call in message.tool_calls:
                    if tool_call.function.name == "search_sources":
                        # Parse arguments
                        try:
                            args = json.loads(tool_call.function.arguments)
                            query = args.get("query", "")
                        except json.JSONDecodeError:
                            query = tool_call.function.arguments

                        # Emit tool call start event
                        yield f'[EVENT:search_start:{json.dumps({"query": query})}]'

                        # Search sources
                        results, source_titles, chunks_preview = await self._execute_search(document_id, query)

                        # Emit tool call complete event with sources and chunks
                        yield f'[EVENT:search_complete:{json.dumps({"sources": source_titles, "chunks": chunks_preview})}]'

                        # Add tool call and result to messages
                        messages.append({
                            "role": "assistant",
                            "content": None,
                            "tool_calls": [
                                {
                                    "id": tool_call.id,
                                    "type": "function",
                                    "function": {
                                        "name": tool_call.function.name,
                                        "arguments": tool_call.function.arguments
                                    }
                                }
                            ]
                        })
                        messages.append({
                            "role": "tool",
                            "name": "search_sources",
                            "content": results,
                            "tool_call_id": tool_call.id
                        })

                # Continue loop to get final response
                continue

            # No tool calls - stream the response
            # For non-streaming response, yield all at once
            if message.content:
                # Handle content being string or list of ContentChunk objects
                content = message.content
                if isinstance(content, list):
                    # Mistral-large returns list of ContentChunk with .text attribute
                    # Filter to only get TextChunk (type='text'), skip ReferenceChunk
                    parts = []
                    for chunk in content:
                        # Check chunk type - only process text chunks
                        chunk_type = getattr(chunk, 'type', None)
                        if chunk_type == 'text' and hasattr(chunk, 'text'):
                            parts.append(chunk.text)
                        elif isinstance(chunk, str):
                            parts.append(chunk)
                        # Skip reference chunks and other types
                    content = "".join(parts)
                yield content
            return

        # Max iterations reached
        yield "[Réponse interrompue - trop d'itérations]"

    async def _execute_search(self, document_id: int, query: str) -> tuple[str, list[str], list[dict]]:
        """Execute search_sources tool.
        
        Args:
            document_id: ID of the document
            query: Search query
            
        Returns:
            Tuple of (formatted results string, list of source titles, list of chunk previews)
        """
        embedding_svc = self._get_embedding_service()
        
        try:
            results = await embedding_svc.search(document_id, query, top_k=3)
        except Exception as exc:
            logger.error("Error searching sources", exc_info=exc)
            return "Erreur lors de la recherche dans les sources.", [], []

        if not results:
            return "Aucun résultat trouvé dans les sources.", [], []

        # Collect unique source titles
        source_titles = list(dict.fromkeys(chunk.source_title for chunk in results))
        
        # Create chunk previews for UI - center around query term
        query_lower = query.lower()
        chunks_preview = []
        for chunk in results:
            content = chunk.content
            # Find the query in the chunk and center preview around it
            idx = content.lower().find(query_lower)
            if idx != -1:
                # Show 100 chars before and 150 chars after the term
                start = max(0, idx - 100)
                end = min(len(content), idx + len(query) + 150)
                preview = ("..." if start > 0 else "") + content[start:end] + ("..." if end < len(content) else "")
            else:
                # Fallback to first 200 chars
                preview = content[:200] + ("..." if len(content) > 200 else "")
            chunks_preview.append({
                "source": chunk.source_title,
                "preview": preview
            })

        # Format results for LLM (use full chunk content)
        parts = ["Extraits pertinents des sources:"]
        for i, chunk in enumerate(results, 1):
            parts.append(f"\n[{i}] {chunk.source_title}:")
            parts.append(chunk.content)  # Don't truncate - chunks are already sized

        return "\n".join(parts), source_titles, chunks_preview

