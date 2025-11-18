"""
Base classes for LLM document generators.

Generators handle the creation of documents from processed source content
using various LLM providers.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


class DocumentProviderError(Exception):
    """Raised when document generation fails."""


@dataclass
class GenerationResult:
    """Result of document generation."""

    success: bool
    markdown_content: str | None = None
    metadata: dict | None = None
    error: str | None = None


class GenerationStrategy(ABC):
    """
    Abstract base class for LLM-based document generators.
    
    Each generator implements a specific LLM provider (Mistral, OpenAI, etc.)
    and converts source texts into structured documents.
    
    To add a new LLM provider:
    1. Create a new generator class extending GenerationStrategy
    2. Implement all abstract methods
    3. Register it in generators/__init__.py
    """
    
    @classmethod
    @abstractmethod
    def provider_name(cls) -> str:
        """
        Provider identifier.
        
        Examples: "mistral", "openai", "anthropic"
        """
        pass
    
    @classmethod
    @abstractmethod
    def supported_models(cls) -> list[str]:
        """
        List of supported models for this provider.
        
        Examples: ["mistral-medium", "mistral-large"]
        """
        pass
    
    @classmethod
    @abstractmethod
    def default_model(cls) -> str:
        """Default model to use if none specified."""
        pass

    @classmethod
    @abstractmethod
    def config_class(cls) -> type:
        """Configuration class for this generator."""
        pass
    
    @abstractmethod
    async def generate(
        self,
        source_texts: list[str],
        document_type: str = "notes",
        model: str | None = None,
        **options,
    ) -> GenerationResult:
        """
        Generate a document from source texts.

        Args:
            source_texts: List of processed source texts
            document_type: Type of document to generate (notes, summary, article, etc.)
            model: Specific model to use (defaults to provider's default)
            **options: Provider-specific options (temperature, max_tokens, etc.)

        Returns:
            GenerationResult with markdown content and metadata
        """
        pass

    @abstractmethod
    async def estimate_cost(
        self,
        source_texts: list[str],
        model: str | None = None,
    ) -> dict:
        """
        Estimate cost and token usage for generation.
        
        Args:
            source_texts: List of source texts to process
            model: Model to use for estimation
            
        Returns:
            Dictionary with token counts, estimated cost, etc.
        """
        pass

