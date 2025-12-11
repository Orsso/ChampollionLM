"""Project chat service for project-level conversations with AI.

Uses Mistral function calling for RAG-based source search across all project sources.
Inherits common agentic loop logic from BaseChatService.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import AsyncIterator, Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import ProjectChatMessage, ProjectChatSession, Project, Source, User
from app.services.base_chat import BaseChatService, MAX_HISTORY_MESSAGES
from app.services.embedding import EmbeddingService

logger = logging.getLogger(__name__)


class ProjectChatService(BaseChatService):
    """Service for managing project-level chat conversations.
    
    Provides AI-powered chat capabilities for projects, including:
    - RAG-based source search across all project sources
    - Streaming responses for real-time UI updates
    - Session-based conversation history management
    - Optional source filtering
    """

    def __init__(self, session: AsyncSession, user: User):
        """Initialize ProjectChatService."""
        super().__init__(session, user)
        self._embedding_service: EmbeddingService | None = None

    def _get_embedding_service(self) -> EmbeddingService:
        """Lazy-load embedding service."""
        if self._embedding_service is None:
            self._embedding_service = EmbeddingService(self.user)
        return self._embedding_service

    async def get_project(self, project_id: int) -> Project | None:
        """Get project with sources preloaded."""
        result = await self.session.execute(
            select(Project)
            .options(selectinload(Project.sources))
            .where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project or project.user_id != self.user.id:
            return None
        return project

    # ==================== SESSION MANAGEMENT ====================

    async def list_sessions(self, project_id: int) -> list[tuple[ProjectChatSession, int]]:
        """List all chat sessions for a project with message counts.
        
        Returns a list of tuples (session, message_count) to avoid N+1 queries.
        """
        project = await self.get_project(project_id)
        if not project:
            return []
        
        # Subquery to count messages per session
        message_count_subq = (
            select(func.count(ProjectChatMessage.id))
            .where(ProjectChatMessage.session_id == ProjectChatSession.id)
            .correlate(ProjectChatSession)
            .scalar_subquery()
        )
        
        result = await self.session.execute(
            select(ProjectChatSession, message_count_subq.label("message_count"))
            .where(ProjectChatSession.project_id == project_id)
            .order_by(ProjectChatSession.updated_at.desc())
        )
        return list(result.all())

    async def get_session(self, session_id: int) -> ProjectChatSession | None:
        """Get a specific chat session."""
        result = await self.session.execute(
            select(ProjectChatSession)
            .options(selectinload(ProjectChatSession.messages))
            .where(ProjectChatSession.id == session_id)
        )
        session_obj = result.scalar_one_or_none()
        if session_obj:
            project = await self.get_project(session_obj.project_id)
            if not project:
                return None
        return session_obj

    async def create_session(self, project_id: int, title: str = "Nouvelle conversation") -> ProjectChatSession:
        """Create a new chat session for a project."""
        project = await self.get_project(project_id)
        if not project:
            raise ValueError("Project not found or access denied")
        now = datetime.now(tz=UTC)
        chat_session = ProjectChatSession(
            project_id=project_id,
            title=title,
            created_at=now,
            updated_at=now
        )
        self.session.add(chat_session)
        await self.session.commit()
        await self.session.refresh(chat_session)
        return chat_session

    async def delete_session(self, session_id: int) -> bool:
        """Delete a chat session and all its messages."""
        session_obj = await self.get_session(session_id)
        if not session_obj:
            return False
        await self.session.delete(session_obj)
        await self.session.commit()
        return True

    async def _generate_session_title(
        self, 
        user_message: str, 
        assistant_response: str
    ) -> str:
        """Generate a concise title for a chat session using Ministral 3B.
        
        Args:
            user_message: The user's first question
            assistant_response: The assistant's first response
            
        Returns:
            A concise title (5-7 words max)
        """
        from mistralai import Mistral
        from app.services.api_key_resolver import get_effective_api_key_sync
        
        api_key = get_effective_api_key_sync(self.user)
        if not api_key:
            return "Nouvelle conversation"  # Fallback if no API key
        client = Mistral(api_key=api_key)
        
        prompt = f"""Génère un titre TRÈS CONCIS (5-7 mots maximum) pour cette conversation.
Le titre doit capturer le sujet principal de la discussion.

RÈGLES STRICTES:
- PAS de guillemets autour du titre
- PAS de markdown (pas de #, *, _, **, etc.)
- PAS d'emojis
- PAS de ponctuation spéciale
- Texte simple uniquement

Réponds UNIQUEMENT avec le titre, rien d'autre.

Question: {user_message[:500]}
Réponse: {assistant_response[:500]}

Titre:"""

        try:
            response = await client.chat.complete_async(
                model="ministral-3b-latest",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=30,
            )
            
            if response.choices and response.choices[0].message.content:
                title = response.choices[0].message.content.strip()
                # Clean up any quotes
                title = title.strip('"\'')
                # Truncate if too long
                if len(title) > 100:
                    title = title[:97] + "..."
                return title
        except Exception as exc:
            logger.error("Error generating session title", exc_info=exc)
        
        return "Nouvelle conversation"

    async def _update_session_title(self, session_id: int, title: str) -> bool:
        """Update the title of a chat session.
        
        Args:
            session_id: ID of the session to update
            title: New title for the session
            
        Returns:
            True if update was successful
        """
        session_obj = await self.get_session(session_id)
        if not session_obj:
            return False
        
        session_obj.title = title
        session_obj.updated_at = datetime.now(tz=UTC)
        await self.session.commit()
        return True

    async def get_session_history(self, session_id: int) -> list[ProjectChatMessage]:
        """Get messages for a specific session."""
        session_obj = await self.get_session(session_id)
        if not session_obj:
            return []
        result = await self.session.execute(
            select(ProjectChatMessage)
            .where(ProjectChatMessage.session_id == session_id)
            .order_by(ProjectChatMessage.created_at.asc())
        )
        return list(result.scalars().all())

    # ==================== CHAT ====================

    async def send_message(
        self,
        project_id: int,
        message: str,
        *,
        action: str | None = None,
        selected_text: str | None = None,
        source_ids: list[int] | None = None,
        session_id: int | None = None
    ) -> AsyncIterator[str]:
        """Send a message and stream the AI response."""
        project = await self.get_project(project_id)
        if not project:
            raise ValueError("Project not found or access denied")

        # Check API key availability (user's own or demo)
        from app.services.api_key_resolver import get_effective_api_key_sync
        if not get_effective_api_key_sync(self.user):
            raise ValueError("API key not configured and no active demo access")

        # Filter sources if source_ids provided
        sources = list(project.sources)
        if source_ids:
            sources = [s for s in sources if s.id in source_ids]

        # Save user message
        user_msg = ProjectChatMessage(
            project_id=project_id,
            session_id=session_id,
            role="user",
            content=message,
            message_metadata={
                "action": action,
                "selected_text": selected_text,
                "source_ids": source_ids
            } if action or selected_text or source_ids else None,
            created_at=datetime.now(tz=UTC)
        )
        self.session.add(user_msg)
        await self.session.flush()

        # Index sources for RAG
        if sources:
            embedding_svc = self._get_embedding_service()
            await embedding_svc.index_project_sources(project_id, sources)

        # Get recent history
        if session_id:
            history = await self.get_session_history(session_id)
        else:
            history = []
        history = [h for h in history if h.id != user_msg.id][-MAX_HISTORY_MESSAGES:]

        # Build messages for Mistral
        messages = self._build_messages(project, sources, history, message, action, selected_text)

        # === DEBUG LOGGING: START OF RAG FLOW ===
        print("\n" + "="*80)
        print("RAG FLOW DEBUG - START")
        print("="*80)
        print(f"\n1. USER QUESTION:")
        print("-"*40)
        print(message)
        print("-"*40)
        if action:
            print(f"   Action: {action}")
        if selected_text:
            print(f"   Selected text: {selected_text}")
        print(f"   Sources available: {len(sources)}")
        print()

        # Agentic loop - capture sources for saving (accumulate across all searches)
        full_response = ""
        all_sources_used: list[str] = []
        all_chunks_found: list[dict] = []
        
        async for chunk in self._agentic_loop(project_id, messages):
            if chunk.startswith("[EVENT:search_complete:"):
                try:
                    payload_str = chunk[23:-1]
                    payload = json.loads(payload_str)
                    new_sources = payload.get("sources", [])
                    new_chunks = payload.get("chunks", [])
                    
                    # Accumulate sources (deduplicate by name)
                    for src in new_sources:
                        if src not in all_sources_used:
                            all_sources_used.append(src)
                    
                    # Accumulate chunks (deduplicate by content prefix)
                    # Use 'content' field (new format) or fall back to 'preview' (old format)
                    existing_contents = {
                        c.get("content", c.get("preview", ""))[:100] 
                        for c in all_chunks_found
                    }
                    for chunk_data in new_chunks:
                        chunk_content = chunk_data.get("content", chunk_data.get("preview", ""))
                        if chunk_content[:100] not in existing_contents:
                            all_chunks_found.append(chunk_data)
                            existing_contents.add(chunk_content[:100])
                except Exception:
                    pass
            elif not chunk.startswith("[EVENT:"):
                full_response += chunk
            yield chunk

        clean_response = self.clean_response(full_response)

        # === DEBUG LOGGING: END OF RAG FLOW ===
        print(f"\n4. LLM RESPONSE:")
        print("-"*40)
        print(clean_response)
        print("-"*40)
        
        print(f"\n5. RAG CHUNKS FOUND ({len(all_chunks_found)} total):")
        print("-"*40)
        for i, chunk in enumerate(all_chunks_found):
            print(f"\n[CHUNK {i+1}] Source: {chunk.get('source', 'Unknown')}")
            print(f"           Query: {chunk.get('query', 'N/A')}")
            print(f"           Score: {chunk.get('score', 'N/A')}")
            print(f"           FULL CONTENT:")
            print(chunk.get('content', chunk.get('preview', 'NO CONTENT')))
        print("-"*40)
        
        print("\n" + "="*80)
        print("RAG FLOW DEBUG - END")
        print("="*80 + "\n")

        # Save assistant response
        assistant_metadata = None
        if all_sources_used or all_chunks_found:
            assistant_metadata = {
                "sources_used": all_sources_used,
                "chunks_found": all_chunks_found
            }
            logger.info("RAG metadata being saved", extra={
                "sources_count": len(all_sources_used),
                "chunks_count": len(all_chunks_found),
                "chunk_previews": [c.get("content", "")[:100] for c in all_chunks_found[:3]]
            })

        assistant_msg = ProjectChatMessage(
            project_id=project_id,
            session_id=session_id,
            role="assistant",
            content=clean_response.strip(),
            message_metadata=assistant_metadata,
            created_at=datetime.now(tz=UTC)
        )
        self.session.add(assistant_msg)
        await self.session.commit()

        # Generate title after first exchange (when history was empty before this message)
        if session_id and len(history) == 0 and clean_response.strip():
            try:
                new_title = await self._generate_session_title(message, clean_response)
                if new_title and new_title != "Nouvelle conversation":
                    await self._update_session_title(session_id, new_title)
                    yield f'[EVENT:title_generated:{json.dumps({"session_id": session_id, "title": new_title})}]'
            except Exception as exc:
                logger.error("Error in title generation", exc_info=exc)
                # Don't fail the message if title generation fails

    async def _search_sources(self, project_id: int, query: str) -> tuple[str, list[str], list[dict]]:
        """Execute search in project sources."""
        embedding_svc = self._get_embedding_service()
        
        try:
            results = await embedding_svc.search_project(project_id, query, top_k=3)
        except Exception as exc:
            logger.error("Error searching project sources", exc_info=exc)
            return "Erreur lors de la recherche dans les sources.", [], []

        return self.format_search_results(results, query)

    def _build_messages(
        self,
        project: Project,
        sources: list[Source],
        history: list[ProjectChatMessage],
        message: str,
        action: str | None,
        selected_text: str | None
    ) -> list[dict[str, Any]]:
        """Build message list for Mistral API."""
        
        source_summary = ", ".join([s.title for s in sources[:10]])
        if len(sources) > 10:
            source_summary += f" (et {len(sources) - 10} autres)"
        
        system_prompt = f"""Tu es un assistant pédagogique pour un étudiant consultant ses sources de projet.

PROJET: {project.title}
SOURCES DISPONIBLES: {source_summary}

RÈGLES IMPORTANTES:
1. Si l'utilisateur pose une QUESTION sur le contenu → UTILISE L'OUTIL search_sources
2. Si l'utilisateur dit "bonjour", "merci", ou fait la conversation → réponds normalement SANS utiliser l'outil
3. Quand tu utilises l'outil, base ta réponse sur les extraits retournés

STYLE DE RÉPONSE:
- Sois CONCIS: 1-3 paragraphes maximum
- Réponds en français
- NE CITE JAMAIS les sources dans ta réponse (affichées automatiquement par l'interface)
"""

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
