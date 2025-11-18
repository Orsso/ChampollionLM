"""
Text processor for plain text and markdown.

Handles text-based formats that don't require processing (passthrough).
"""
from __future__ import annotations

from pathlib import Path

from app.processors.base import ProcessorResult, SourceProcessor


class TextProcessor(SourceProcessor):
    """
    Processor for text formats (passthrough).
    
    Supports: plain text, markdown, HTML (with cleanup)
    """
    
    @classmethod
    def supported_formats(cls) -> list[str]:
        return [
            "text/plain",
            "text/markdown",
            "text/html",
        ]
    
    @classmethod
    def processor_name(cls) -> str:
        return "text_passthrough"
    
    @classmethod
    def processor_version(cls) -> str:
        return "1.0.0"
    
    async def validate(self, file_path: Path | None = None, content: str | None = None) -> tuple[bool, str | None]:
        """Validate text input."""
        if not file_path and not content:
            return False, "Text processor requires either file_path or content"

        return True, None

    async def process(
        self,
        file_path: Path | None = None,
        content: str | None = None,
        **options,
    ) -> ProcessorResult:
        """
        Process text content (mostly passthrough).
        
        For HTML, extracts clean text.
        For plain text and markdown, returns as-is.
        """
        # TODO: Implement text processing
        # - HTML cleanup with BeautifulSoup
        # - Character encoding detection
        return ProcessorResult(
            success=False,
            error="TextProcessor not yet implemented"
        )

