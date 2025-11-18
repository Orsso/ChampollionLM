"""
Enumerations for source formats, document types, and other constants.

These enums provide a centralized definition of supported formats and types
that can be used across the application.
"""
from enum import Enum


class SourceFormat(str, Enum):
    """
    Format of source files/content.
    
    These map to MIME types where applicable for easy validation.
    """
    # Audio formats
    AUDIO_MP3 = "audio/mp3"
    AUDIO_MPEG = "audio/mpeg"
    AUDIO_WAV = "audio/wav"
    AUDIO_M4A = "audio/m4a"
    AUDIO_WEBM = "audio/webm"
    
    # Document formats (future)
    PDF = "application/pdf"
    
    # Text formats
    TEXT_PLAIN = "text/plain"
    TEXT_MARKDOWN = "text/markdown"
    TEXT_HTML = "text/html"
    
    # Future formats
    IMAGE_PNG = "image/png"
    IMAGE_JPEG = "image/jpeg"
    VIDEO_MP4 = "video/mp4"


class SourceStatus(str, Enum):
    """
    Processing status of a source.
    
    Tracks the lifecycle of source processing from upload to completion.
    """
    UPLOADED = "uploaded"         # File uploaded, not yet processed
    PROCESSING = "processing"      # Currently being processed (transcription, OCR, etc.)
    PROCESSED = "processed"        # Successfully processed, content available
    FAILED = "failed"             # Processing failed
    READY = "ready"               # Alias for processed (backward compat)


class DocumentFormat(str, Enum):
    """
    Export format for generated documents.
    
    The canonical format is always markdown; these are export targets.
    """
    MARKDOWN = "text/markdown"
    PDF = "application/pdf"
    DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    HTML = "text/html"
    EPUB = "application/epub+zip"
    LATEX = "text/x-tex"


class DocumentType(str, Enum):
    """
    Type of document to generate.
    
    Different types use different prompts and structuring approaches.
    """
    NOTES = "notes"               # Structured notes
    SUMMARY = "summary"           # Condensed summary
    ARTICLE = "article"           # Blog-style article
    REPORT = "report"             # Formal report
    FLASHCARDS = "flashcards"     # Study flashcards
    QUIZ = "quiz"                 # Quiz questions
    MINDMAP = "mindmap"           # Mind map structure (Markdown/JSON)


class ProcessingJobType(str, Enum):
    """
    Type of processing job.
    
    Each type represents a different transformation applied to source content.
    """
    TRANSCRIPTION = "transcription"     # Audio → Text
    OCR = "ocr"                         # Image/PDF → Text
    EXTRACTION = "extraction"           # PDF → Text (direct)
    TRANSLATION = "translation"         # Text → Text (different language)
    SUMMARIZATION = "summarization"     # Text → Text (condensed)


class JobStatus(str, Enum):
    """
    Status of background jobs (processing, generation).
    
    Used by ProcessingJob and GenerationJob.
    """
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class ProjectStatus(str, Enum):
    """
    Overall status of a project.
    
    Indicates the current state of the project's workflow.
    """
    DRAFT = "draft"           # Project created, no processing started
    PROCESSING = "processing"  # Processing in progress (transcription, OCR, etc.)
    READY = "ready"           # Processing complete, ready for document generation

