"""
YouTube transcript processor.

Handles extraction of transcripts from YouTube videos using youtube-transcript-api.
No API key required - uses public transcript data.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from app.processors.base import ProcessorResult, SourceProcessor
from app.core.settings import settings


@dataclass
class YouTubeProcessorConfig:
    """Configuration for YouTube transcript processor."""

    preferred_languages: list[str] | None = None  # e.g., ['fr', 'en']


class YouTubeProcessor(SourceProcessor):
    """
    YouTube transcript processor using youtube-transcript-api.

    Extracts transcripts from YouTube videos without requiring an API key.
    Supports automatic and manual captions, with language preference.
    """

    # Common YouTube URL patterns
    YOUTUBE_URL_PATTERNS = [
        r"(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})",
        r"(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})",
        r"(?:https?://)?(?:www\.)?youtube\.com/v/([a-zA-Z0-9_-]{11})",
        r"(?:https?://)?youtu\.be/([a-zA-Z0-9_-]{11})",
        r"(?:https?://)?(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})",
        r"(?:https?://)?m\.youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})",
    ]

    def __init__(self, config: YouTubeProcessorConfig | None = None):
        self.config = config or YouTubeProcessorConfig()

    @classmethod
    def supported_formats(cls) -> list[str]:
        return ["youtube/video"]

    @classmethod
    def processor_name(cls) -> str:
        return "youtube_transcript"

    @classmethod
    def processor_version(cls) -> str:
        return "1.0.0"

    @classmethod
    def config_class(cls) -> type:
        return YouTubeProcessorConfig

    @classmethod
    def extract_video_id(cls, url_or_id: str) -> str | None:
        """
        Extract YouTube video ID from various URL formats or raw ID.

        Args:
            url_or_id: YouTube URL or video ID

        Returns:
            Video ID if found, None otherwise
        """
        url_or_id = url_or_id.strip()

        # Check if it's already a valid video ID (11 chars, alphanumeric + _ -)
        if re.match(r"^[a-zA-Z0-9_-]{11}$", url_or_id):
            return url_or_id

        # Try to extract from URL patterns
        for pattern in cls.YOUTUBE_URL_PATTERNS:
            match = re.search(pattern, url_or_id)
            if match:
                return match.group(1)

        return None

    async def validate(
        self, file_path: Path | None = None, content: str | None = None
    ) -> tuple[bool, str | None]:
        """
        Validate that the content is a valid YouTube URL or video ID.

        Args:
            file_path: Not used for YouTube processing
            content: YouTube URL or video ID

        Returns:
            (is_valid, error_message)
        """
        if not content:
            return False, "YouTube processor requires a URL or video ID"

        video_id = self.extract_video_id(content)
        if not video_id:
            return False, f"Invalid YouTube URL or video ID: {content}"

        return True, None

    async def process(
        self,
        file_path: Path | None = None,
        content: str | None = None,
        **options,
    ) -> ProcessorResult:
        """
        Extract transcript from YouTube video.

        Args:
            file_path: Not used for YouTube processing
            content: YouTube URL or video ID
            **options: preferred_languages (list[str]) - ISO language codes

        Returns:
            ProcessorResult with extracted transcript text
        """
        if not content:
            return ProcessorResult(
                success=False, error="YouTube processor requires a URL or video ID"
            )

        video_id = self.extract_video_id(content)
        if not video_id:
            return ProcessorResult(
                success=False, error=f"Invalid YouTube URL or video ID: {content}"
            )

        # Get preferred languages from options or config
        preferred_languages = options.get(
            "preferred_languages", self.config.preferred_languages
        ) or ["fr", "en"]

        try:
            # Import here to avoid import errors if package not installed
            from youtube_transcript_api import YouTubeTranscriptApi
            from youtube_transcript_api.proxies import GenericProxyConfig
            from youtube_transcript_api._errors import (
                NoTranscriptFound,
                TranscriptsDisabled,
                VideoUnavailable,
            )

            try:
                # Configure proxy if available
                proxy_config = None
                if settings.youtube_proxy_url:
                    proxy_config = GenericProxyConfig(
                        http_url=settings.youtube_proxy_url,
                        https_url=settings.youtube_proxy_url
                    )

                # Create API instance (v1.x API)
                ytt_api = YouTubeTranscriptApi(proxy_config=proxy_config)
                
                # List available transcripts
                transcript_list = ytt_api.list(video_id)

                # Try to find a transcript in preferred languages
                transcript = None
                transcript_info = None

                # First, try manually created transcripts
                try:
                    transcript = transcript_list.find_manually_created_transcript(
                        preferred_languages
                    )
                    transcript_info = {
                        "type": "manual",
                        "language": transcript.language_code,
                    }
                except NoTranscriptFound:
                    pass

                # Fall back to auto-generated
                if not transcript:
                    try:
                        transcript = transcript_list.find_generated_transcript(
                            preferred_languages
                        )
                        transcript_info = {
                            "type": "auto-generated",
                            "language": transcript.language_code,
                        }
                    except NoTranscriptFound:
                        pass

                # Last resort: get any available transcript
                if not transcript:
                    for t in transcript_list:
                        transcript = t
                        transcript_info = {
                            "type": "manual" if not t.is_generated else "auto-generated",
                            "language": t.language_code,
                        }
                        break

                if not transcript:
                    return ProcessorResult(
                        success=False,
                        error="No transcript available for this video",
                    )

                # Fetch the transcript content (returns FetchedTranscript in v1.x)
                fetched_transcript = transcript.fetch()

                # FetchedTranscript is iterable with FetchedTranscriptSnippet objects
                # Each snippet has .text, .start, .duration attributes
                full_text = " ".join(
                    snippet.text for snippet in fetched_transcript
                ).strip()

                if not full_text:
                    return ProcessorResult(
                        success=False,
                        error="Transcript is empty",
                    )

                return ProcessorResult(
                    success=True,
                    processed_content=full_text,
                    metadata={
                        "video_id": video_id,
                        "language": transcript_info["language"] if transcript_info else None,
                        "transcript_type": transcript_info["type"] if transcript_info else None,
                        "segment_count": len(fetched_transcript),
                    },
                )

            except TranscriptsDisabled:
                return ProcessorResult(
                    success=False,
                    error="Transcripts are disabled for this video",
                )
            except VideoUnavailable:
                return ProcessorResult(
                    success=False,
                    error="Video is unavailable (private, deleted, or age-restricted)",
                )
            except NoTranscriptFound:
                return ProcessorResult(
                    success=False,
                    error="No transcript found for this video",
                )

        except ImportError:
            return ProcessorResult(
                success=False,
                error="youtube-transcript-api package is not installed. Run: pip install youtube-transcript-api",
            )
        except Exception as exc:
            return ProcessorResult(
                success=False,
                error=f"Failed to extract transcript: {str(exc)}",
            )

