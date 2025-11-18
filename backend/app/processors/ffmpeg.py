"""
FFMPEG audio utilities for segmentation and conversion.

Used by audio processors to handle long audio files.
"""
from __future__ import annotations

import asyncio
import math
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from app.services.transcription import AudioSegment, STTProviderError
from app.utils.audio import compute_duration_seconds


@dataclass
class FFMPEGConfig:
    """Configuration for FFMPEG operations."""

    temp_dir: Path
    max_segment_seconds: int = 480  # 8 minutes default


class FFMPEGSegmenter:
    """
    Audio segmenter using FFMPEG.

    Splits long audio files into smaller segments for processing.
    Implements the AudioSegmenter protocol from services/transcription.py
    """

    def __init__(self, temp_dir: Path):
        self.temp_dir = temp_dir
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    async def split(self, source: Path, *, max_duration_seconds: int) -> list[AudioSegment]:
        """
        Split audio file into segments not exceeding max duration.

        Args:
            source: Source audio file path
            max_duration_seconds: Maximum duration per segment

        Returns:
            List of audio segments in order

        Raises:
            STTProviderError: If segmentation fails
        """
        # Try to read duration; if unavailable, assume a single segment
        try:
            duration = compute_duration_seconds(source)
        except Exception:
            duration = max_duration_seconds - 1

        if duration <= max_duration_seconds:
            return [AudioSegment(path=source, order=0)]

        segments: list[AudioSegment] = []
        total_segments = math.ceil(duration / max_duration_seconds)

        for index in range(total_segments):
            offset = index * max_duration_seconds
            output_path = self.temp_dir / f"segment-{uuid4()}-{index}{source.suffix}"
            command = [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(source),
                "-ss",
                str(offset),
                "-t",
                str(max_duration_seconds),
                str(output_path),
            ]
            await self._run_command(command)
            if not output_path.exists():
                raise STTProviderError("Failed to segment audio with ffmpeg")
            segments.append(
                AudioSegment(path=output_path, order=index, cleanup_dir=self.temp_dir)
            )

        return segments

    async def convert_to_wav(self, source: Path) -> Path:
        """
        Convert audio file to WAV format (16kHz mono PCM).

        Args:
            source: Source audio file

        Returns:
            Path to converted WAV file

        Raises:
            STTProviderError: If conversion fails
        """
        output = self.temp_dir / f"conv-{uuid4()}.wav"

        # Force audio-only WAV at 16k mono for robust STT
        command = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-acodec",
            "pcm_s16le",
            str(output),
        ]

        await self._run_command(command)

        if not output.exists():
            raise STTProviderError("ffmpeg conversion failed - output file not created")

        return output

    async def _run_command(self, command: list[str]) -> None:
        """Run FFMPEG command asynchronously."""
        proc = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise STTProviderError(stderr.decode().strip() or "ffmpeg command failed")
