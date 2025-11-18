"""
OpenAI LLM generator (future).

Placeholder for OpenAI GPT integration.
"""
from __future__ import annotations

from app.generators.base import GenerationResult, GenerationStrategy


class OpenAIGenerator(GenerationStrategy):
    """
    Document generator using OpenAI GPT models.

    Future implementation for multi-provider support.
    """

    @classmethod
    def provider_name(cls) -> str:
        return "openai"

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "gpt-3.5-turbo",
            "gpt-4",
            "gpt-4-turbo",
        ]

    @classmethod
    def default_model(cls) -> str:
        return "gpt-4-turbo"

    async def generate(
        self,
        source_texts: list[str],
        document_type: str = "notes",
        model: str | None = None,
        **options,
    ) -> GenerationResult:
        """Generate document using OpenAI."""
        # TODO: Implement OpenAI integration
        return GenerationResult(
            success=False,
            error="OpenAI generator not yet implemented"
        )

    async def estimate_cost(
        self,
        source_texts: list[str],
        model: str | None = None,
    ) -> dict:
        """Estimate token usage and cost for OpenAI."""
        # TODO: Implement cost estimation
        return {
            "estimated_tokens": 0,
            "estimated_cost_usd": 0.0,
            "error": "Cost estimation not yet implemented"
        }

