"""
Audio processor for speech-to-text transcription.

Handles audio files (MP3, WAV, WebM, M4A) using Mistral AI's STT API.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import httpx

from app.core.security import decrypt_api_key
from app.processors.base import ProcessorResult, SourceProcessor
from app.processors.ffmpeg import FFMPEGSegmenter
from app.services.transcription import AudioSegment, STTProviderError

MISTRAL_STT_MODEL = "voxtral-mini-latest"
# Reduced from 30min to 8min due to undocumented API output limits
# API was observed truncating at ~4min mark, so 8min provides safety margin
MAX_MISTRAL_AUDIO_SECONDS = 8 * 60


@dataclass
class MistralAudioConfig:
    """Configuration for Mistral audio processor."""

    api_key_encrypted: str
    language: str | None = None


class MistralAudioProcessor(SourceProcessor):
    """
    Audio processor using Mistral AI STT (voxtral-mini).

    Supports: MP3, WAV, WebM, M4A
    Features:
    - Automatic segmentation for long files
    - WAV conversion for compatibility
    - Language detection or explicit language setting
    """

    def __init__(self, config: MistralAudioConfig):
        self.config = config
        self.api_key = decrypt_api_key(config.api_key_encrypted)

    @classmethod
    def supported_formats(cls) -> list[str]:
        return ["audio/mpeg", "audio/wav", "audio/webm", "audio/mp4"]

    @classmethod
    def processor_name(cls) -> str:
        return "audio_transcription_mistral"

    @classmethod
    def processor_version(cls) -> str:
        return "1.0.0"

    @classmethod
    def config_class(cls) -> type:
        return MistralAudioConfig

    async def validate(
        self, file_path: Path | None = None, content: str | None = None
    ) -> tuple[bool, str | None]:
        """Validate audio file exists and is accessible."""
        if not file_path:
            return False, "Audio processor requires a file path"
        if not file_path.exists():
            return False, f"File not found: {file_path}"
        return True, None

    async def process(
        self,
        file_path: Path | None = None,
        content: str | None = None,
        **options,
    ) -> ProcessorResult:
        """
        Transcribe audio file to text.

        Args:
            file_path: Path to audio file
            content: Not used for audio processing
            **options: language (str | None) - ISO language code

        Returns:
            ProcessorResult with transcribed text

        Raises:
            STTProviderError: If transcription fails
        """
        if not file_path:
            return ProcessorResult(
                success=False, error="Audio processor requires a file path"
            )

        language = options.get("language", self.config.language)

        try:
            # Prepare segments (split if too long)
            segments = await self._prepare_segments(file_path)

            # Transcribe each segment
            texts: list[str] = []
            try:
                for segment in sorted(segments, key=lambda s: s.order):
                    texts.append(await self._transcribe_single(segment.path, language=language))
            finally:
                self._cleanup_segments(segments)

            # Combine transcriptions
            full_text = "\n".join(filter(None, texts)).strip()
            if not full_text:
                raise STTProviderError("Transcription returned empty text")

            return ProcessorResult(
                success=True,
                processed_content=full_text,
                metadata={
                    "provider": "mistral",
                    "model": MISTRAL_STT_MODEL,
                    "language": language or "auto",
                    "segments_count": len(segments),
                },
            )

        except STTProviderError:
            raise
        except Exception as exc:
            raise STTProviderError(f"Audio processing failed: {str(exc)}") from exc

    async def _prepare_segments(self, path: Path) -> list[AudioSegment]:
        """Split audio into segments if needed."""
        temp_dir = Path.cwd() / "tmp" / "mistral"
        temp_dir.mkdir(parents=True, exist_ok=True)
        segmenter = FFMPEGSegmenter(temp_dir=temp_dir)
        segments = await segmenter.split(path, max_duration_seconds=MAX_MISTRAL_AUDIO_SECONDS)
        if not segments:
            raise STTProviderError("No audio segments generated")
        return segments

    async def _transcribe_single(self, audio_path: Path, *, language: str | None) -> str:
        """Transcribe a single audio segment."""
        # Convert to WAV (audio-only) to avoid provider MIME/content rejection
        temp_dir = Path.cwd() / "tmp" / "mistral"
        temp_dir.mkdir(parents=True, exist_ok=True)
        segmenter = FFMPEGSegmenter(temp_dir=temp_dir)
        temp_wav = await segmenter.convert_to_wav(audio_path)

        try:
            try:
                # Send multipart/form-data directly to Mistral API
                async with httpx.AsyncClient(timeout=600.0) as http_client:
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        # Do NOT set Content-Type here; httpx will set correct multipart boundary
                    }

                    data = {
                        "model": MISTRAL_STT_MODEL,
                        "timestamp_granularities": "segment",
                    }
                    if language:
                        data["language"] = language

                    with temp_wav.open("rb") as f:
                        files = {
                            "file": (temp_wav.name, f, "audio/wav"),
                        }
                        response = await http_client.post(
                            "https://api.mistral.ai/v1/audio/transcriptions",
                            data=data,
                            files=files,
                            headers=headers,
                        )

                    response.raise_for_status()
                    transcription = response.json()

            except Exception as exc:  # pragma: no cover - network failures mapped
                raise STTProviderError(str(exc)) from exc
        finally:
            try:
                if temp_wav.exists():
                    temp_wav.unlink()
            except OSError:
                pass

        # Use segments if available, otherwise fall back to text field
        segments = transcription.get("segments", [])
        if segments:
            # Concatenate all segment texts for complete transcription
            text = " ".join(seg.get("text", "") for seg in segments).strip()
        else:
            # Fallback to top-level text field
            text = transcription.get("text", "").strip()

        if not text:
            raise STTProviderError("Transcription returned empty text")
        return text

    def _cleanup_segments(self, segments: list[AudioSegment]) -> None:
        """Clean up temporary segment files."""
        for segment in segments:
            if segment.cleanup_dir and segment.path.exists():
                try:
                    segment.path.unlink()
                except OSError:
                    pass
