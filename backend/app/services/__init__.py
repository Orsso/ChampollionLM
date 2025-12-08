"""Service layer package."""

from .projects import ProjectService
from .jobs import run_document_job, run_processing_job
from .transcription import AudioSegment, AudioSegmenter, SpeechToTextProvider, STTProviderError
from .chat import ChatService
from .embedding import EmbeddingService

__all__ = [
    "ProjectService",
    "run_processing_job",
    "run_document_job",
    "SpeechToTextProvider",
    "STTProviderError",
    "AudioSegment",
    "AudioSegmenter",
    "ChatService",
    "EmbeddingService",
]
