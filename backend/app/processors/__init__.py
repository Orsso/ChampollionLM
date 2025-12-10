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

from app.processors.base import SourceProcessor, ProcessorResult
from app.processors.registry import ProcessorRegistry, TranscriptionRegistry

# Import implemented processors
from app.processors.audio import MistralAudioConfig, MistralAudioProcessor
from app.processors.youtube import YouTubeProcessor, YouTubeProcessorConfig


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
