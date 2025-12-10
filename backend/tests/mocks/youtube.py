"""
Mock implementations for YouTube Transcript API.

These mocks simulate YouTube transcript API responses for testing.
"""
from dataclasses import dataclass, field
from typing import Optional
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)


@dataclass
class MockTranscriptSegment:
    """Mock transcript segment."""
    text: str
    start: float
    duration: float


@dataclass
class MockTranscript:
    """Mock transcript object."""
    video_id: str
    language: str
    language_code: str
    is_generated: bool
    is_translatable: bool
    _segments: list = field(default_factory=list)

    def fetch(self) -> list[dict]:
        """Fetch transcript segments."""
        if not self._segments:
            return [
                {"text": "Hello, this is a test transcript.", "start": 0.0, "duration": 2.5},
                {"text": "It contains multiple segments.", "start": 2.5, "duration": 2.0},
                {"text": "This is the end of the transcript.", "start": 4.5, "duration": 2.0},
            ]
        return [{"text": s.text, "start": s.start, "duration": s.duration} for s in self._segments]


class MockTranscriptList:
    """Mock transcript list returned by YouTubeTranscriptApi.list_transcripts()."""

    def __init__(
        self,
        video_id: str = "test_video_id",
        manual_languages: Optional[list[str]] = None,
        generated_languages: Optional[list[str]] = None,
        disabled: bool = False,
        unavailable: bool = False,
    ):
        self.video_id = video_id
        self._manual_languages = manual_languages or ["en"]
        self._generated_languages = generated_languages or ["en"]
        self._disabled = disabled
        self._unavailable = unavailable
        self._custom_segments: Optional[list[MockTranscriptSegment]] = None

    def set_segments(self, segments: list[MockTranscriptSegment]):
        """Set custom transcript segments."""
        self._custom_segments = segments

    def find_transcript(self, language_codes: list[str]) -> MockTranscript:
        """Find a transcript for the given language codes."""
        if self._disabled:
            raise TranscriptsDisabled(self.video_id)
        if self._unavailable:
            raise VideoUnavailable(self.video_id)

        # Check manual transcripts first
        for lang in language_codes:
            if lang in self._manual_languages:
                return MockTranscript(
                    video_id=self.video_id,
                    language=lang,
                    language_code=lang,
                    is_generated=False,
                    is_translatable=True,
                    _segments=self._custom_segments or [],
                )

        # Then check generated transcripts
        for lang in language_codes:
            if lang in self._generated_languages:
                return MockTranscript(
                    video_id=self.video_id,
                    language=lang,
                    language_code=lang,
                    is_generated=True,
                    is_translatable=True,
                    _segments=self._custom_segments or [],
                )

        raise NoTranscriptFound(self.video_id, language_codes, None)

    def find_manually_created_transcript(self, language_codes: list[str]) -> MockTranscript:
        """Find a manually created transcript."""
        if self._disabled:
            raise TranscriptsDisabled(self.video_id)

        for lang in language_codes:
            if lang in self._manual_languages:
                return MockTranscript(
                    video_id=self.video_id,
                    language=lang,
                    language_code=lang,
                    is_generated=False,
                    is_translatable=True,
                    _segments=self._custom_segments or [],
                )

        raise NoTranscriptFound(self.video_id, language_codes, None)

    def find_generated_transcript(self, language_codes: list[str]) -> MockTranscript:
        """Find an auto-generated transcript."""
        if self._disabled:
            raise TranscriptsDisabled(self.video_id)

        for lang in language_codes:
            if lang in self._generated_languages:
                return MockTranscript(
                    video_id=self.video_id,
                    language=lang,
                    language_code=lang,
                    is_generated=True,
                    is_translatable=True,
                    _segments=self._custom_segments or [],
                )

        raise NoTranscriptFound(self.video_id, language_codes, None)


class MockYouTubeTranscriptApi:
    """
    Mock for YouTubeTranscriptApi class.

    Usage:
        mock_api = MockYouTubeTranscriptApi()
        mock_api.set_transcript("video_id", ["en"], ["fr"])
        # Use mock_api in place of real API
    """

    def __init__(self):
        self._transcripts: dict[str, MockTranscriptList] = {}
        self._disabled_videos: set[str] = set()
        self._unavailable_videos: set[str] = set()

    def set_transcript(
        self,
        video_id: str,
        manual_languages: Optional[list[str]] = None,
        generated_languages: Optional[list[str]] = None,
    ):
        """Configure available transcripts for a video."""
        self._transcripts[video_id] = MockTranscriptList(
            video_id=video_id,
            manual_languages=manual_languages,
            generated_languages=generated_languages,
        )

    def set_disabled(self, video_id: str):
        """Mark a video as having transcripts disabled."""
        self._disabled_videos.add(video_id)

    def set_unavailable(self, video_id: str):
        """Mark a video as unavailable."""
        self._unavailable_videos.add(video_id)

    @staticmethod
    def list_transcripts(video_id: str) -> MockTranscriptList:
        """
        Static method to list transcripts (matches real API signature).

        Note: This is a static method in the real API, so we need special handling.
        """
        # This will be replaced by monkeypatch
        raise NotImplementedError("Use create_mock_youtube_api() to set up mocking")


def create_mock_youtube_api(monkeypatch) -> MockYouTubeTranscriptApi:
    """
    Pytest fixture helper to create and install a mock YouTube Transcript API.

    Usage:
        def test_youtube_import(monkeypatch):
            mock_api = create_mock_youtube_api(monkeypatch)
            mock_api.set_transcript("abc123", manual_languages=["en", "fr"])
            # Your test code here
    """
    mock_api = MockYouTubeTranscriptApi()
    # Set default transcript for any video
    mock_api.set_transcript("default", manual_languages=["en"], generated_languages=["en"])

    _transcripts = mock_api._transcripts
    _disabled = mock_api._disabled_videos
    _unavailable = mock_api._unavailable_videos

    def mock_list_transcripts(video_id: str) -> MockTranscriptList:
        if video_id in _disabled:
            raise TranscriptsDisabled(video_id)
        if video_id in _unavailable:
            raise VideoUnavailable(video_id)
        if video_id in _transcripts:
            return _transcripts[video_id]
        # Return default transcript list for unknown videos
        return MockTranscriptList(video_id=video_id)

    # Patch the API
    monkeypatch.setattr(
        "youtube_transcript_api.YouTubeTranscriptApi.list_transcripts",
        staticmethod(mock_list_transcripts)
    )

    return mock_api
