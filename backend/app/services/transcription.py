from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Protocol


class SpeechToTextProvider(Protocol):
    async def transcribe(self, audio_path: str, *, language: str | None = None) -> str:  # pragma: no cover
        """Return full transcript text from an audio file."""


class STTProviderError(Exception):
    """Raised when the speech-to-text provider fails."""


@dataclass(slots=True)
class TranscriptionResult:
    text: str
    provider: str


@dataclass(slots=True)
class AudioSegment:
    path: Path
    order: int
    cleanup_dir: Path | None = None


class AudioSegmenter(Protocol):
    async def split(self, source: Path, *, max_duration_seconds: int) -> list[AudioSegment]:
        """Return ordered audio segments not exceeding max duration."""

