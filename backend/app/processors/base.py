"""
Base classes for source processors.

Processors handle conversion of different input formats (audio, PDF, text, etc.)
into a common text representation suitable for LLM processing.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ProcessorResult:
    """Result of processing a source."""

    success: bool
    processed_content: str | None = None
    metadata: dict | None = None
    error: str | None = None


class SourceProcessor(ABC):
    """
    Abstract base class for all source processors.
    
    Each processor handles one or more source formats and converts them
    to text that can be used by LLM generators.
    
    To add a new format:
    1. Create a new processor class extending SourceProcessor
    2. Implement all abstract methods
    3. Register it in processors/__init__.py
    """
    
    @classmethod
    @abstractmethod
    def supported_formats(cls) -> list[str]:
        """
        List of MIME types or format identifiers supported by this processor.
        
        Examples: ["audio/mp3", "audio/wav"], ["application/pdf"]
        """
        pass
    
    @classmethod
    @abstractmethod
    def processor_name(cls) -> str:
        """Unique name identifier for this processor."""
        pass
    
    @classmethod
    @abstractmethod
    def processor_version(cls) -> str:
        """Version string for tracking processor changes."""
        pass

    @classmethod
    @abstractmethod
    def config_class(cls) -> type:
        """Configuration class for this processor."""
        pass
    
    @abstractmethod
    async def validate(self, file_path: Path | None = None, content: str | None = None) -> tuple[bool, str | None]:
        """
        Validate that the input can be processed.

        Args:
            file_path: Path to file (for binary formats)
            content: Direct content (for text formats)

        Returns:
            (is_valid, error_message)
        """
        pass

    @abstractmethod
    async def process(
        self,
        file_path: Path | None = None,
        content: str | None = None,
        **options,
    ) -> ProcessorResult:
        """
        Process the source and extract text content.
        
        Args:
            file_path: Path to file (for binary formats)
            content: Direct content (for text formats)
            **options: Processor-specific options
            
        Returns:
            ProcessorResult with extracted text and metadata
        """
        pass

