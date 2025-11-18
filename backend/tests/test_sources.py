"""Test script for source implementation."""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.models import Source, SourceType
from app.utils.text_extraction import extract_text_from_source, TextExtractionError


def test_text_extraction():
    """Test text extraction from different source types."""
    print("Testing text extraction...")
    
    # Create mock document source
    doc_source = Source(
        id=1,
        course_id=1,
        type=SourceType.DOCUMENT,
        title="Test Document",
        content="# Test Content\n\nThis is test content.",
    )
    
    try:
        text = extract_text_from_source(doc_source)
        assert text == "# Test Content\n\nThis is test content."
        print("✅ Document source extraction: PASSED")
    except Exception as e:
        print(f"❌ Document source extraction: FAILED - {e}")
        return False
    
    # Test audio source without transcript (should raise error)
    audio_source = Source(
        id=2,
        course_id=1,
        type=SourceType.AUDIO,
        title="Test Audio",
        file_path="/path/to/audio.mp3",
    )
    
    try:
        text = extract_text_from_source(audio_source)
        print(f"❌ Audio source without transcript should fail: FAILED - Got text: {text}")
        return False
    except TextExtractionError:
        print("✅ Audio source without transcript correctly raises error: PASSED")
    
    return True


def test_imports():
    """Test that all new modules can be imported."""
    print("\nTesting imports...")
    
    try:
        from app.models import Source, SourceType
        print("✅ Source model import: PASSED")
    except Exception as e:
        print(f"❌ Source model import: FAILED - {e}")
        return False
    
    try:
        from app.schemas import SourceCreate, SourceRead, SourceDetail
        print("✅ Source schemas import: PASSED")
    except Exception as e:
        print(f"❌ Source schemas import: FAILED - {e}")
        return False
    
    try:
        from app.services.sources import SourceService
        print("✅ SourceService import: PASSED")
    except Exception as e:
        print(f"❌ SourceService import: FAILED - {e}")
        return False
    
    try:
        from app.utils.text_extraction import extract_text_from_source
        print("✅ Text extraction utility import: PASSED")
    except Exception as e:
        print(f"❌ Text extraction utility import: FAILED - {e}")
        return False
    
    return True


def test_schema_compatibility():
    """Test NotesRequest backward compatibility."""
    print("\nTesting schema compatibility...")
    
    try:
        from app.schemas import NotesRequest
        
        # Test with source_ids
        req1 = NotesRequest(provider="mistral", source_ids=[1, 2, 3])
        assert req1.get_source_ids() == [1, 2, 3]
        print("✅ NotesRequest with source_ids: PASSED")
        
        # Test with recording_ids (backward compatibility)
        req2 = NotesRequest(provider="mistral", recording_ids=[4, 5, 6])
        assert req2.get_source_ids() == [4, 5, 6]
        print("✅ NotesRequest with recording_ids (backward compat): PASSED")
        
        # Test with both (source_ids takes precedence)
        req3 = NotesRequest(provider="mistral", source_ids=[1, 2], recording_ids=[3, 4])
        assert req3.get_source_ids() == [1, 2]
        print("✅ NotesRequest precedence (source_ids over recording_ids): PASSED")
        
        return True
    except Exception as e:
        print(f"❌ Schema compatibility: FAILED - {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Source Implementation Tests")
    print("=" * 60)
    
    all_passed = True
    
    all_passed &= test_imports()
    all_passed &= test_text_extraction()
    all_passed &= test_schema_compatibility()
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All tests PASSED")
        return 0
    else:
        print("❌ Some tests FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
