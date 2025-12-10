"""
Legacy source tests - refactored to use correct field names.

Note: More comprehensive source tests are in tests/integration/test_source_management.py
"""
import pytest
from app.models import Source, SourceType
from app.utils.text_extraction import extract_text_from_source, TextExtractionError


def test_text_extraction():
    """Test text extraction from different source types."""
    # Create mock document source (using project_id, not course_id)
    doc_source = Source(
        id=1,
        project_id=1,
        type=SourceType.DOCUMENT,
        title="Test Document",
        content="# Test Content\n\nThis is test content.",
    )

    text = extract_text_from_source(doc_source)
    assert text == "# Test Content\n\nThis is test content."

    # Test audio source without transcript (should raise error)
    audio_source = Source(
        id=2,
        project_id=1,
        type=SourceType.AUDIO,
        title="Test Audio",
        file_path="/path/to/audio.mp3",
    )

    with pytest.raises(TextExtractionError):
        extract_text_from_source(audio_source)


def test_imports():
    """Test that all modules can be imported."""
    from app.models import Source, SourceType
    from app.schemas import SourceCreate, SourceRead, SourceDetail
    from app.services.sources import SourceService
    from app.utils.text_extraction import extract_text_from_source

    # Verify imports work
    assert Source is not None
    assert SourceType is not None
    assert SourceCreate is not None
    assert SourceRead is not None
    assert SourceDetail is not None
    assert SourceService is not None
    assert extract_text_from_source is not None


def test_document_request_schema():
    """Test DocumentRequest schema (formerly NotesRequest)."""
    from app.schemas import DocumentRequest

    # Test with source_ids
    req1 = DocumentRequest(provider="mistral", source_ids=[1, 2, 3])
    assert req1.source_ids == [1, 2, 3]
    assert req1.provider == "mistral"

    # Test with title
    req2 = DocumentRequest(provider="mistral", title="My Notes", type="cours")
    assert req2.title == "My Notes"
    assert req2.type == "cours"

    # Test with no source_ids (None by default)
    req3 = DocumentRequest(provider="mistral")
    assert req3.source_ids is None
