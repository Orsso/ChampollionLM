"""
LLM generators registry.

This module provides a registry pattern for all LLM generators,
allowing easy addition of new AI providers.

To add a new generator:
1. Create a new file in this directory (e.g., anthropic.py)
2. Implement a class extending GenerationStrategy
3. Import and register it in this file
"""
from __future__ import annotations

from typing import Dict, Type

from app.generators.base import GenerationStrategy, GenerationResult

# Import implemented generators
from app.generators.mistral import MistralGenerator, MistralGeneratorConfig

# Note: OpenAI generator is scaffold only - not yet implemented


class GeneratorRegistry:
    """
    Central registry for all LLM generators.
    
    Automatically maps provider names to their implementation.
    """
    
    _generators: Dict[str, Type[GenerationStrategy]] = {}
    
    @classmethod
    def register(cls, generator_class: Type[GenerationStrategy]) -> None:
        """Register a generator for its provider."""
        cls._generators[generator_class.provider_name().lower()] = generator_class
    
    @classmethod
    def get_generator(cls, provider: str) -> Type[GenerationStrategy] | None:
        """Get the appropriate generator for a provider."""
        return cls._generators.get(provider.lower())
    
    @classmethod
    def list_providers(cls) -> list[str]:
        """List all supported providers."""
        return list(cls._generators.keys())
    
    @classmethod
    def is_supported(cls, provider: str) -> bool:
        """Check if a provider is supported."""
        return provider.lower() in cls._generators


# Auto-register implemented generators
GeneratorRegistry.register(MistralGenerator)


__all__ = [
    "GenerationStrategy",
    "GenerationResult",
    "GeneratorRegistry",
    "MistralGenerator",
    "MistralGeneratorConfig",
]

