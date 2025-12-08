"""
Source processors registry.

This module provides a registry pattern for all source processors,
allowing easy addition of new input formats.

To add a new processor:
1. Create a new file in this directory (e.g., video.py)
2. Implement a class extending SourceProcessor
3. Import and register it in this file
"""
from __future__ import annotations

from typing import Dict, Type

from app.processors.base import SourceProcessor, ProcessorResult

# Import implemented processors
from app.processors.audio import MistralAudioConfig, MistralAudioProcessor
from app.processors.youtube import YouTubeProcessor, YouTubeProcessorConfig


class ProcessorRegistry:
    """
    Central registry for all source processors.
    
    Automatically maps MIME types to their appropriate processor.
    """
    
    _processors: Dict[str, Type[SourceProcessor]] = {}
    
    @classmethod
    def register(cls, processor_class: Type[SourceProcessor]) -> None:
        """Register a processor for its supported formats."""
        for format_type in processor_class.supported_formats():
            cls._processors[format_type.lower()] = processor_class
    
    @classmethod
    def get_processor(cls, format_type: str) -> Type[SourceProcessor] | None:
        """Get the appropriate processor for a format."""
        return cls._processors.get(format_type.lower())
    
    @classmethod
    def list_supported_formats(cls) -> list[str]:
        """List all supported formats."""
        return list(cls._processors.keys())
    
    @classmethod
    def is_supported(cls, format_type: str) -> bool:
        """Check if a format is supported."""
        return format_type.lower() in cls._processors


class TranscriptionRegistry:
    """
    Registry for STT (Speech-to-Text) providers.
    
    Maps provider names (e.g., 'mistral') to processor classes.
    """
    
    _providers: Dict[str, Type[SourceProcessor]] = {}
    
    @classmethod
    def register(cls, name: str, processor_class: Type[SourceProcessor]) -> None:
        """Register a processor for a provider name."""
        cls._providers[name.lower()] = processor_class
    
    @classmethod
    def get_processor(cls, name: str) -> Type[SourceProcessor] | None:
        """Get the processor for a provider."""
        return cls._providers.get(name.lower())
    
    @classmethod
    def list_providers(cls) -> list[str]:
        """List all supported providers."""
        return list(cls._providers.keys())
    
    @classmethod
    def is_supported(cls, name: str) -> bool:
        """Check if a provider is supported."""
        return name.lower() in cls._providers


# Auto-register implemented processors
ProcessorRegistry.register(MistralAudioProcessor)
ProcessorRegistry.register(YouTubeProcessor)
TranscriptionRegistry.register("mistral", MistralAudioProcessor)


__all__ = [
    "SourceProcessor",
    "ProcessorResult",
    "ProcessorRegistry",
    "TranscriptionRegistry",
    "MistralAudioProcessor",
    "MistralAudioConfig",
    "YouTubeProcessor",
    "YouTubeProcessorConfig",
]
