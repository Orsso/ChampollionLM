"""Base chat service with common agentic loop and search logic.

This module provides a base class that factors out the shared code
between ChatService (document-level) and ProjectChatService (project-level).
"""

from __future__ import annotations

import json
import logging
import re
from abc import ABC, abstractmethod
from typing import AsyncIterator, Any

from mistralai import Mistral
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decrypt_api_key
from app.services.api_key_resolver import get_effective_api_key_sync
from app.models import User

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
            "description": "Recherche dans les sources (transcriptions, documents). Utilise cet outil quand tu as besoin d'informations détaillées.",
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


class BaseChatService(ABC):
    """Base service providing common chat functionality.
    
    Subclasses must implement:
    - _search_sources: Execute RAG search for the specific context
    """

    def __init__(self, session: AsyncSession, user: User):
        """Initialize base chat service."""
        self.session = session
        self.user = user

    @abstractmethod
    async def _search_sources(self, context_id: int, query: str) -> tuple[str, list[str], list[dict]]:
        """Execute search in the appropriate context (document or project).
        
        Args:
            context_id: ID of the document or project
            query: Search query
            
        Returns:
            Tuple of (formatted results for LLM, source titles, chunk previews for UI)
        """
        pass

    async def _agentic_loop(
        self,
        context_id: int,
        messages: list[dict[str, Any]]
    ) -> AsyncIterator[str]:
        """Execute agentic loop with tool calling.
        
        1. Call model with tools
        2. If tool call, execute and add result
        3. Call model again to get final response
        """
        api_key = get_effective_api_key_sync(self.user)
        if not api_key:
            raise ValueError("API key not configured and no active demo access")
        client = Mistral(api_key=api_key)

        max_iterations = 3

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

            # Check for tool calls
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    if tool_call.function.name == "search_sources":
                        try:
                            args = json.loads(tool_call.function.arguments)
                            query = args.get("query", "")
                        except json.JSONDecodeError:
                            query = tool_call.function.arguments

                        yield f'[EVENT:search_start:{json.dumps({"query": query})}]'

                        results, source_titles, chunks_preview = await self._search_sources(context_id, query)

                        yield f'[EVENT:search_complete:{json.dumps({"sources": source_titles, "chunks": chunks_preview})}]'

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

                continue

            # No tool calls - yield the response
            if message.content:
                content = message.content
                if isinstance(content, list):
                    parts = []
                    for chunk in content:
                        chunk_type = getattr(chunk, 'type', None)
                        if chunk_type == 'text' and hasattr(chunk, 'text'):
                            parts.append(chunk.text)
                        elif isinstance(chunk, str):
                            parts.append(chunk)
                    content = "".join(parts)
                yield content
            return

        yield "[Réponse interrompue - trop d'itérations]"

    @staticmethod
    def clean_response(response: str) -> str:
        """Remove event markers from response text."""
        return re.sub(r'\[EVENT:[^\]]*(?:\[[^\]]*\])*[^\]]*\]', '', response)

    @staticmethod
    def format_search_results(results: list, query: str) -> tuple[str, list[str], list[dict]]:
        """Format search results for LLM and UI.
        
        Args:
            results: List of ChunkResult objects
            query: Original search query
            
        Returns:
            Tuple of (formatted text for LLM, source titles, chunk previews)
        """
        if not results:
            return "Aucun résultat trouvé dans les sources.", [], []

        source_titles = list(dict.fromkeys(chunk.source_title for chunk in results))

        query_lower = query.lower()
        chunks_preview = []
        for chunk in results:
            content = chunk.content
            idx = content.lower().find(query_lower)
            if idx != -1:
                start = max(0, idx - 100)
                end = min(len(content), idx + len(query) + 150)
                preview = ("..." if start > 0 else "") + content[start:end] + ("..." if end < len(content) else "")
            else:
                preview = content[:200] + ("..." if len(content) > 200 else "")
            chunks_preview.append({
                "source": chunk.source_title,
                "preview": preview
            })

        parts = ["Extraits pertinents des sources:"]
        for i, chunk in enumerate(results, 1):
            parts.append(f"\n[{i}] {chunk.source_title}:")
            parts.append(chunk.content)

        return "\n".join(parts), source_titles, chunks_preview
