"""Text extraction utilities for different source types."""

from app.models import Source, SourceType


class TextExtractionError(Exception):
    """Raised when text cannot be extracted from a source."""
    pass


def extract_text_from_source(source: Source) -> str:
    """
    Extract text content from any source type.
    
    This function prioritizes processed_content (which contains the result of 
    audio transcription, PDF extraction, etc.) over raw content.
    
    Args:
        source: Source model instance
        
    Returns:
        Extracted text content
        
    Raises:
        TextExtractionError: If text cannot be extracted
    """
    # Prefer processed_content (transcription, OCR, etc.)
    if source.processed_content:
        return source.processed_content
    
    # Fallback to raw content for document sources
    if source.type == SourceType.DOCUMENT and source.content:
        return source.content
    
    # No text available
    raise TextExtractionError(
        f"Source '{source.title}' (ID: {source.id}) has no processed content or raw text"
    )
