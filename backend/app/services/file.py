from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import BinaryIO

from app.models.metadata import AudioMetadata
from app.utils.audio import (
    build_recording_path,
    compute_duration_seconds,
    convert_webm_to_mp3,
    ensure_supported_extension,
    ensure_within_limits,
    generate_upload_filename,
    user_project_storage_path,
    validate_audio_duration,
)


class FileService:
    """Handle all file I/O operations (audio uploads, conversions, metadata extraction)."""

    async def save_audio_recording(
        self,
        file_content: BinaryIO,
        filename: str,
        user_id: int,
        project_id: int,
    ) -> tuple[str, AudioMetadata]:
        """
        Save audio recording, converting to MP3 if needed.

        Args:
            file_content: Binary file stream from UploadFile
            filename: Original filename from client
            user_id: ID of user uploading the file
            project_id: ID of project the audio belongs to

        Returns:
            Tuple of (file_path, audio_metadata) where:
                - file_path: Absolute path to saved file
                - audio_metadata: AudioMetadata object with file info

        Raises:
            ValueError: If file validation fails (unsupported format, size, duration, etc.)
        """
        # Validate filename extension
        ensure_supported_extension(filename)

        # Determine if WebM conversion needed
        is_webm = filename.lower().endswith(".webm")

        # Generate filenames
        if is_webm:
            temp_filename = generate_upload_filename(filename)
            final_filename = temp_filename.replace(".webm", ".mp3")
        else:
            final_filename = generate_upload_filename(filename)

        # Build file paths
        destination = build_recording_path(user_id, project_id, final_filename)
        temp_destination = destination.with_suffix(".webm") if is_webm else destination

        # Write uploaded file
        size_bytes = self._write_file(temp_destination, file_content)
        ensure_within_limits(size_bytes)

        # Convert WebM to MP3 if needed
        if is_webm:
            convert_webm_to_mp3(temp_destination, destination)
            temp_destination.unlink()  # Remove temporary WebM
            size_bytes = destination.stat().st_size  # Update size for final MP3

        # Extract audio duration (reliable with MP3/WAV/M4A)
        duration_seconds = compute_duration_seconds(destination)
        validate_audio_duration(duration_seconds)

        # Determine audio format from file extension
        audio_format = destination.suffix.lstrip('.').lower()  # e.g., 'mp3', 'wav', 'm4a'

        # Return file path and typed metadata
        metadata = AudioMetadata(
            duration_seconds=duration_seconds,
            size_bytes=size_bytes,
            format=audio_format,
            # Note: sample_rate and channels could be extracted with pydub if needed
            # For now, keeping them as None (optional fields)
        )

        return str(destination.resolve()), metadata

    def delete_project_storage(self, user_id: int, project_id: int) -> None:
        """
        Delete all project files from disk.

        Called when project is deleted. Errors are silently ignored
        (files may not exist for new projects).

        Args:
            user_id: ID of user who owns the project
            project_id: ID of project to delete
        """
        storage_dir = user_project_storage_path(user_id, project_id)
        shutil.rmtree(storage_dir, ignore_errors=True)

    def delete_file(self, file_path: str) -> bool:
        """
        Delete a single file from disk.

        Args:
            file_path: Absolute path to file to delete

        Returns:
            True if file was deleted, False if it didn't exist
        """
        path = Path(file_path)
        if path.exists():
            path.unlink()
            return True
        return False

    # Private helper methods
    @staticmethod
    def _write_file(destination: Path, file_stream: BinaryIO) -> int:
        """
        Write binary file stream to disk.

        Args:
            destination: Path where file should be written
            file_stream: Binary stream to read from

        Returns:
            Number of bytes written
        """
        destination.parent.mkdir(parents=True, exist_ok=True)
        total = 0
        with destination.open("wb") as out_file:
            for chunk in iter(lambda: file_stream.read(8192), b""):
                if not chunk:
                    break
                out_file.write(chunk)
                total += len(chunk)
        return total
