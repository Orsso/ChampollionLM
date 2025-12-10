"""
Mistral AI document generator.

Generates structured documents from source texts using Mistral's LLM API.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from mistralai import Mistral

from app.core.security import decrypt_api_key
from app.generators.base import DocumentProviderError, GenerationResult, GenerationStrategy

MISTRAL_NOTES_MODEL = "mistral-large-latest"


@dataclass
class MistralGeneratorConfig:
    """Configuration for Mistral document generator.
    
    Accepts either:
    - api_key: Plain text API key (preferred, used by demo access)
    - api_key_encrypted: Encrypted API key (legacy, will be decrypted)
    """

    api_key: str | None = None
    api_key_encrypted: str | None = None
    temperature: float = 0.4

    def get_api_key(self) -> str:
        """Get the effective API key, decrypting if needed."""
        if self.api_key:
            return self.api_key
        if self.api_key_encrypted:
            return decrypt_api_key(self.api_key_encrypted)
        raise ValueError("No API key provided")


class MistralGenerator(GenerationStrategy):
    """
    Document generator using Mistral AI LLM.

    Generates structured markdown documents optimized for educational content.
    """

    def __init__(self, config: MistralGeneratorConfig):
        self.config = config
        self.api_key = config.get_api_key()

    @classmethod
    def provider_name(cls) -> str:
        return "mistral"

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "mistral-small-latest",
            "mistral-medium-latest",
            "mistral-large-latest",
        ]

    @classmethod
    def default_model(cls) -> str:
        return MISTRAL_NOTES_MODEL

    @classmethod
    def config_class(cls) -> type:
        return MistralGeneratorConfig

    async def generate(
        self,
        source_texts: list[str],
        document_type: str = "notes",
        model: str | None = None,
        **options,
    ) -> GenerationResult:
        """
        Generate structured markdown document from source texts.

        Args:
            source_texts: List of processed texts from sources
            document_type: Type of document (currently only "notes" supported)
            model: Model to use (defaults to mistral-medium-latest)
            **options: metadata (dict) - Document metadata

        Returns:
            GenerationResult with markdown content
        """
        if not source_texts:
            return GenerationResult(success=False, error="No source texts provided")

        # Combine all source texts
        combined_text = "\n\n".join(source_texts)

        if not combined_text.strip():
            return GenerationResult(success=False, error="All source texts are empty")

        try:
            markdown = await self._generate_markdown(
                combined_text,
                model=model or self.default_model(),
                metadata=options.get("metadata"),
            )

            return GenerationResult(
                success=True,
                markdown_content=markdown,
                metadata={
                    "provider": "mistral",
                    "model": model or self.default_model(),
                    "document_type": document_type,
                    "source_count": len(source_texts),
                },
            )

        except DocumentProviderError:
            raise
        except Exception as exc:
            raise DocumentProviderError(f"Document generation failed: {str(exc)}") from exc

    async def estimate_cost(
        self,
        source_texts: list[str],
        model: str | None = None,
    ) -> dict:
        """
        Estimate token usage and cost.

        Note: Actual implementation would require token counting.
        This is a placeholder for future enhancement.
        """
        combined_text = "\n\n".join(source_texts)
        # Rough estimation: ~4 chars per token
        estimated_input_tokens = len(combined_text) // 4
        estimated_output_tokens = 2000  # Typical document length

        return {
            "estimated_input_tokens": estimated_input_tokens,
            "estimated_output_tokens": estimated_output_tokens,
            "estimated_total_tokens": estimated_input_tokens + estimated_output_tokens,
            "model": model or self.default_model(),
        }

    async def _generate_markdown(
        self,
        content: str,
        *,
        model: str,
        metadata: dict[str, str] | None = None,
    ) -> str:
        """Generate markdown document from content using Mistral LLM."""
        if not content:
            raise DocumentProviderError("Content is empty")

        system_prompt = (
            "Tu es un assistant pédagogique. Génère UNIQUEMENT un cours en Markdown structuré. "
            "Ne fournis AUCUN commentaire, introduction ou conclusion avant ou après le Markdown. "
            "Le document doit commencer directement par le titre (# Titre) et finir par le contenu. "
            "Structure requise: # Titre, ## Résumé, ## Concepts clés, ## Déroulé du cours, ## Points à retenir."
        )

        user_content = content
        if metadata:
            meta_str = "\n".join(f"{key}: {value}" for key, value in metadata.items())
            user_content = f"Metadata:\n{meta_str}\n\nContent:\n{content}"

        try:
            client = Mistral(api_key=self.api_key)
            response = await client.chat.complete_async(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=self.config.temperature,
            )
        except Exception as exc:  # pragma: no cover - network failures
            raise DocumentProviderError(str(exc)) from exc

        choices = getattr(response, "choices", None)
        if not choices:
            raise DocumentProviderError("Empty response from Mistral LLM")

        message: Any = choices[0].message
        markdown = getattr(message, "content", None)
        if not markdown:
            raise DocumentProviderError("Missing content in LLM response")

        # Clean markdown fences added by LLM
        markdown = self._clean_markdown_fences(markdown)

        return markdown

    def _clean_markdown_fences(self, text: str) -> str:
        """Remove ```markdown fences from LLM response."""
        text = text.strip()

        # Remove ```markdown at start
        if text.startswith("```markdown"):
            text = text[len("```markdown") :].lstrip()
        elif text.startswith("```"):
            text = text[3:].lstrip()

        # Remove ``` at end
        if text.endswith("```"):
            text = text[:-3].rstrip()

        return text.strip()
