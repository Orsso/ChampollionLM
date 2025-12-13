"""Embedding service for RAG-based source search.

Provides semantic search capabilities using Mistral embeddings and ChromaDB.
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING

import chromadb
from mistralai import Mistral

from mistralai.models.sdkerror import SDKError
from app.core.security import decrypt_api_key

if TYPE_CHECKING:
    from app.models import Source, User

logger = logging.getLogger(__name__)

# Constants
EMBEDDING_MODEL = "mistral-embed"
CHUNK_SIZE = 150  # ~150 words per chunk for focused semantic signal
CHUNK_OVERLAP = 30  # 30% overlap between chunks


@dataclass
class ChunkResult:
    """Result from semantic search."""
    
    source_id: int
    source_title: str
    content: str
    score: float


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks.
    
    Args:
        text: Text to split
        chunk_size: Target size per chunk (in words as proxy for tokens)
        overlap: Number of words to overlap between chunks
        
    Returns:
        List of text chunks
    """
    words = text.split()
    if len(words) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap
        
    return chunks


def _source_hash(sources: list["Source"]) -> str:
    """Generate hash for a set of sources (for cache invalidation)."""
    ids = sorted([s.id for s in sources])
    return hashlib.md5(str(ids).encode()).hexdigest()[:12]


class EmbeddingService:
    """Service for embedding sources and performing semantic search.
    
    Uses ChromaDB in-memory for vector storage and Mistral for embeddings.
    Embeddings are computed on-demand and cached per document session.
    """
    
    def __init__(self, user: "User"):
        """Initialize EmbeddingService.
        
        Args:
            user: Current user (for API key access)
        """
        self.user = user
        self._client = chromadb.Client()  # In-memory
        self._collections: dict[str, chromadb.Collection] = {}
        self._mistral: Mistral | None = None
    
    def _get_mistral(self) -> Mistral:
        """Lazy-load Mistral client."""
        if self._mistral is None:
            from app.services.api_key_resolver import get_effective_api_key_sync
            api_key = get_effective_api_key_sync(self.user)
            if not api_key:
                raise ValueError("API key not configured and no active demo access")
            self._mistral = Mistral(api_key=api_key)
        return self._mistral
    
    async def _embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Get embeddings for texts using Mistral.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
            
        client = self._get_mistral()
        
        try:
            response = await client.embeddings.create_async(
                model=EMBEDDING_MODEL,
                inputs=texts
            )
            return [item.embedding for item in response.data]
        except SDKError as e:
            if e.status_code == 401:
                logger.warning(f"Mistral API unauthorized (401) for user {self.user.id}")
                raise ValueError("Clé API Mistral invalide ou expirée. Veuillez vérifier vos paramètres.")
            logger.error(f"Mistral SDK Error: {e}")
            raise
        except Exception as exc:
            logger.error("Error getting embeddings", exc_info=exc)
            raise
    
    async def index_sources(self, document_id: int, sources: list["Source"]) -> str:
        """Index sources for a document.
        
        Creates or updates the ChromaDB collection for this document's sources.
        
        Args:
            document_id: ID of the document
            sources: List of sources to index
            
        Returns:
            Collection name
        """
        collection_name = f"doc_{document_id}"
        
        # Check if already indexed with same sources
        source_hash = _source_hash(sources)
        if collection_name in self._collections:
            existing = self._collections[collection_name]
            if existing.metadata and existing.metadata.get("source_hash") == source_hash:
                logger.debug("Sources already indexed", extra={"document_id": document_id})
                return collection_name
        
        # Create new collection
        try:
            self._client.delete_collection(collection_name)
        except Exception:
            pass  # Collection doesn't exist
            
        collection = self._client.create_collection(
            name=collection_name,
            metadata={"source_hash": source_hash}
        )

        
        # Prepare chunks from all sources
        all_chunks: list[str] = []
        all_ids: list[str] = []
        all_metadatas: list[dict] = []
        
        for source in sources:
            content = source.processed_content or source.content
            if not content:
                continue
                
            chunks = _chunk_text(content)
            for i, chunk in enumerate(chunks):
                all_chunks.append(chunk)
                all_ids.append(f"{source.id}_{i}")
                all_metadatas.append({
                    "source_id": source.id,
                    "source_title": source.title,
                    "chunk_index": i
                })
        
        if not all_chunks:
            logger.warning("No content to index", extra={"document_id": document_id})
            self._collections[collection_name] = collection
            return collection_name
        
        # Get embeddings
        embeddings = await self._embed_texts(all_chunks)
        
        # Add to collection
        collection.add(
            ids=all_ids,
            embeddings=embeddings,
            documents=all_chunks,
            metadatas=all_metadatas
        )
        
        self._collections[collection_name] = collection
        logger.info("Indexed sources", extra={
            "document_id": document_id,
            "chunk_count": len(all_chunks),
            "source_count": len(sources)
        })
        
        return collection_name
    
    async def search(
        self,
        document_id: int,
        query: str,
        top_k: int = 5
    ) -> list[ChunkResult]:
        """Search for relevant chunks in indexed sources.
        
        Uses semantic search first, then adds keyword matches for better recall.
        
        Args:
            document_id: ID of the document
            query: Search query
            top_k: Number of results to return
            
        Returns:
            List of relevant chunks with scores
        """
        collection_name = f"doc_{document_id}"
        
        if collection_name not in self._collections:
            logger.warning("Collection not found", extra={"document_id": document_id})
            return []
        
        collection = self._collections[collection_name]
        
        # Get all chunks for keyword search
        all_data = collection.get(include=["documents", "metadatas"])
        
        logger.info("RAG Search starting", extra={
            "query": query,
            "collection": collection_name,
            "total_chunks": len(all_data["documents"]) if all_data["documents"] else 0
        })
        
        # Keyword search: find chunks containing the query (case insensitive)
        query_lower = query.lower()
        keyword_matches: list[ChunkResult] = []
        
        if all_data["documents"]:
            for i, doc in enumerate(all_data["documents"]):
                if query_lower in doc.lower():
                    metadata = all_data["metadatas"][i] if all_data["metadatas"] else {}
                    keyword_matches.append(ChunkResult(
                        source_id=metadata.get("source_id", 0),
                        source_title=metadata.get("source_title", "Unknown"),
                        content=doc,
                        score=1.0  # Perfect match
                    ))
                    logger.info("KEYWORD MATCH FOUND", extra={
                        "query": query,
                        "chunk_preview": doc[:200]
                    })
        
        # If we found keyword matches, return them prioritized
        if keyword_matches:
            logger.info("Returning keyword matches", extra={"count": len(keyword_matches), "query": query})
            return keyword_matches[:top_k]
        
        logger.info("No keyword matches, falling back to semantic search", extra={"query": query})
        
        # Fall back to semantic search
        query_embedding = await self._embed_texts([query])
        if not query_embedding:
            return []
        
        # Search
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        # Format results
        chunks: list[ChunkResult] = []
        
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 0
                
                # Filter out low relevance chunks (score < 0.5)
                if (1 - distance) >= 0.5:
                    chunks.append(ChunkResult(
                        source_id=metadata.get("source_id", 0),
                        source_title=metadata.get("source_title", "Unknown"),
                        content=doc,
                        score=1 - distance  # Convert distance to similarity
                    ))
        
        return chunks

    async def index_project_sources(self, project_id: int, sources: list["Source"]) -> str:
        """Index sources for a project (for project-level chat).
        
        Similar to index_sources but uses project_id for collection naming.
        
        Args:
            project_id: ID of the project
            sources: List of sources to index
            
        Returns:
            Collection name
        """
        collection_name = f"project_{project_id}"
        
        # Check if already indexed with same sources
        source_hash = _source_hash(sources)
        if collection_name in self._collections:
            existing = self._collections[collection_name]
            if existing.metadata and existing.metadata.get("source_hash") == source_hash:
                logger.debug("Project sources already indexed", extra={"project_id": project_id})
                return collection_name
        
        # Create new collection
        try:
            self._client.delete_collection(collection_name)
        except Exception:
            pass  # Collection doesn't exist
            
        collection = self._client.create_collection(
            name=collection_name,
            metadata={"source_hash": source_hash}
        )
        
        # Prepare chunks from all sources
        all_chunks: list[str] = []
        all_ids: list[str] = []
        all_metadatas: list[dict] = []
        
        for source in sources:
            content = source.processed_content or source.content
            if not content:
                continue
                
            chunks = _chunk_text(content)
            for i, chunk in enumerate(chunks):
                all_chunks.append(chunk)
                all_ids.append(f"{source.id}_{i}")
                all_metadatas.append({
                    "source_id": source.id,
                    "source_title": source.title,
                    "chunk_index": i
                })
        
        if not all_chunks:
            logger.warning("No content to index for project", extra={"project_id": project_id})
            self._collections[collection_name] = collection
            return collection_name
        
        # Get embeddings
        embeddings = await self._embed_texts(all_chunks)
        
        # Add to collection
        collection.add(
            ids=all_ids,
            embeddings=embeddings,
            documents=all_chunks,
            metadatas=all_metadatas
        )
        
        self._collections[collection_name] = collection
        logger.info("Indexed project sources", extra={
            "project_id": project_id,
            "chunk_count": len(all_chunks),
            "source_count": len(sources)
        })
        
        return collection_name

    async def search_project(
        self,
        project_id: int,
        query: str,
        top_k: int = 5
    ) -> list[ChunkResult]:
        """Search for relevant chunks in project sources.
        
        Args:
            project_id: ID of the project
            query: Search query
            top_k: Number of results to return
            
        Returns:
            List of relevant chunks with scores
        """
        collection_name = f"project_{project_id}"
        
        if collection_name not in self._collections:
            logger.warning("Project collection not found", extra={"project_id": project_id})
            return []
        
        collection = self._collections[collection_name]
        
        # Get all chunks for keyword search
        all_data = collection.get(include=["documents", "metadatas"])
        
        logger.info("Project RAG Search starting", extra={
            "query": query,
            "collection": collection_name,
            "total_chunks": len(all_data["documents"]) if all_data["documents"] else 0
        })
        
        # Keyword search: find chunks containing the query (case insensitive)
        query_lower = query.lower()
        keyword_matches: list[ChunkResult] = []
        
        if all_data["documents"]:
            for i, doc in enumerate(all_data["documents"]):
                if query_lower in doc.lower():
                    metadata = all_data["metadatas"][i] if all_data["metadatas"] else {}
                    keyword_matches.append(ChunkResult(
                        source_id=metadata.get("source_id", 0),
                        source_title=metadata.get("source_title", "Unknown"),
                        content=doc,
                        score=1.0  # Perfect match
                    ))
        
        # If we found keyword matches, return them prioritized
        if keyword_matches:
            logger.info("Returning keyword matches for project", extra={
                "count": len(keyword_matches), 
                "query": query,
                "chunk_previews": [m.content[:150] for m in keyword_matches[:3]]
            })
            return keyword_matches[:top_k]
        
        logger.info("No keyword matches for project, falling back to semantic search", extra={"query": query})
        
        # Fall back to semantic search
        query_embedding = await self._embed_texts([query])
        if not query_embedding:
            return []
        
        # Search
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        # Format results
        chunks: list[ChunkResult] = []
        
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 0
                score = 1 - distance
                
                # Filter out low relevance chunks (score < 0.5)
                if score >= 0.5:
                    chunks.append(ChunkResult(
                        source_id=metadata.get("source_id", 0),
                        source_title=metadata.get("source_title", "Unknown"),
                        content=doc,
                        score=score
                    ))
        
        return chunks

