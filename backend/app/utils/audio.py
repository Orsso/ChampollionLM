from __future__ import annotations

import subprocess
from datetime import UTC, datetime
from pathlib import Path
from typing import BinaryIO

from mutagen import File as MutagenFile

from app.core.settings import settings


SUPPORTED_AUDIO_MIME_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
}

SUPPORTED_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a"}


def ensure_within_limits(size_bytes: int) -> None:
    if size_bytes > settings.max_audio_bytes:
        raise ValueError("Audio file exceeds maximum allowed size")


def ensure_supported_extension(filename: str) -> None:
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError("Unsupported audio file extension")


def sanitize_filename(name: str) -> str:
    return "".join(ch if ch.isalnum() or ch in {"-", "_", "."} else "_" for ch in name)


def generate_upload_filename(original_name: str, *, prefix: str = "upload") -> str:
    timestamp = datetime.now(tz=UTC).strftime("%Y%m%d-%H%M%S")
    sanitized = sanitize_filename(original_name) or "audio"
    return f"{prefix}-{timestamp}-{sanitized}"


def compute_duration_seconds(path: Path) -> int:
    """Compute audio duration using mutagen (works for MP3, WAV, M4A)."""
    try:
        audio = MutagenFile(str(path))
        if audio is None or not audio.info or not hasattr(audio.info, 'length'):
            raise ValueError("Unable to determine audio duration")
        return int(audio.info.length)
    except Exception as exc:
        raise ValueError(f"Invalid audio file: {str(exc)}") from exc


def convert_webm_to_mp3(input_path: Path, output_path: Path) -> None:
    """Convert WebM audio to MP3 using ffmpeg."""
    result = subprocess.run(
        [
            "ffmpeg",
            "-i", str(input_path),
            "-vn",  # No video
            "-ar", "44100",  # Sample rate
            "-ac", "2",  # Stereo
            "-b:a", "192k",  # Bitrate
            "-y",  # Overwrite output file
            str(output_path)
        ],
        capture_output=True,
        timeout=60
    )
    
    if result.returncode != 0:
        raise ValueError(f"Failed to convert WebM to MP3: {result.stderr.decode()}")


def user_project_storage_path(user_id: int, project_id: int) -> Path:
    return settings.audio_storage_root / str(user_id) / str(project_id)


def build_recording_path(user_id: int, project_id: int, filename: str) -> Path:
    return user_project_storage_path(user_id, project_id) / filename


def validate_audio_duration(duration_seconds: int) -> None:
    if duration_seconds > settings.max_audio_duration_seconds:
        raise ValueError("Audio duration exceeds maximum allowed length")

