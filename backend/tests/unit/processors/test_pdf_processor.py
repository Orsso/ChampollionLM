"""
Unit tests for PDF processor using Mistral OCR.
"""
import base64
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import httpx

from app.processors.pdf import MistralPDFConfig, MistralPDFProcessor
from app.processors.registry import ProcessorRegistry
from app.services.transcription import STTProviderError


@pytest.fixture
def pdf_config():
    """Provide PDF processor configuration with test API key."""
    return MistralPDFConfig(api_key="test-api-key-12345")


@pytest.fixture
def sample_pdf_file(tmp_path: Path) -> Path:
    """Create a minimal valid PDF file for testing."""
    pdf_path = tmp_path / "test.pdf"
    
    # Minimal PDF header + object structure
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] >>\nendobj\n"
        b"xref\n0 4\n"
        b"0000000000 65535 f\n"
        b"0000000009 00000 n\n"
        b"0000000056 00000 n\n"
        b"0000000113 00000 n\n"
        b"trailer\n<< /Size 4 /Root 1 0 R >>\n"
        b"startxref\n200\n"
        b"%%EOF\n"
    )
    
    with open(pdf_path, "wb") as f:
        f.write(pdf_content)
    
    return pdf_path


def test_pdf_processor_registered():
    """Test that PDF processor is registered in ProcessorRegistry."""
    assert ProcessorRegistry.is_supported("application/pdf")
    processor_class = ProcessorRegistry.get_processor("application/pdf")
    assert processor_class is not None
    assert processor_class == MistralPDFProcessor


def test_pdf_processor_supported_formats():
    """Test that PDF processor reports correct supported formats."""
    assert MistralPDFProcessor.supported_formats() == ["application/pdf"]


def test_pdf_processor_metadata():
    """Test processor metadata (name, version)."""
    assert MistralPDFProcessor.processor_name() == "pdf_ocr_mistral"
    assert MistralPDFProcessor.processor_version() == "1.0.0"
    assert MistralPDFProcessor.config_class() == MistralPDFConfig


@pytest.mark.asyncio
async def test_validate_valid_pdf(pdf_config, sample_pdf_file):
    """Test validation of a valid PDF file."""
    processor = MistralPDFProcessor(pdf_config)
    is_valid, error = await processor.validate(file_path=sample_pdf_file)
    assert is_valid
    assert error is None


@pytest.mark.asyncio
async def test_validate_missing_file(pdf_config, tmp_path):
    """Test validation fails for non-existent file."""
    processor = MistralPDFProcessor(pdf_config)
    missing_file = tmp_path / "nonexistent.pdf"
    is_valid, error = await processor.validate(file_path=missing_file)
    assert not is_valid
    assert "File not found" in error


@pytest.mark.asyncio
async def test_validate_no_file_path(pdf_config):
    """Test validation fails without file path."""
    processor = MistralPDFProcessor(pdf_config)
    is_valid, error = await processor.validate()
    assert not is_valid
    assert "requires a file path" in error


@pytest.mark.asyncio
async def test_validate_wrong_extension(pdf_config, tmp_path):
    """Test validation fails for wrong file extension."""
    processor = MistralPDFProcessor(pdf_config)
    wrong_file = tmp_path / "test.txt"
    wrong_file.write_text("test content")
    is_valid, error = await processor.validate(file_path=wrong_file)
    assert not is_valid
    assert "Invalid file extension" in error


@pytest.mark.asyncio
async def test_validate_file_too_large(pdf_config, tmp_path):
    """Test validation fails for file exceeding size limit."""
    processor = MistralPDFProcessor(pdf_config)
    large_file = tmp_path / "large.pdf"
    
    # Create file larger than 50MB
    with open(large_file, "wb") as f:
        f.write(b"0" * (51 * 1024 * 1024))  # 51MB
    
    is_valid, error = await processor.validate(file_path=large_file)
    assert not is_valid
    assert "too large" in error


@pytest.mark.asyncio
async def test_process_success(pdf_config, sample_pdf_file):
    """Test successful PDF processing with mocked API."""
    processor = MistralPDFProcessor(pdf_config)
    
    mock_response = {
        "text": "# Extracted Title\n\nThis is the extracted content from the PDF."
    }
    
    with patch("httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_post = MagicMock()  # Regular Mock, not AsyncMock
        mock_post.json = MagicMock(return_value=mock_response)  # json() returns dict synchronously
        mock_post.raise_for_status = MagicMock()  # No-op
        mock_instance.post = AsyncMock(return_value=mock_post)  # post() is async
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance
        
        result = await processor.process(file_path=sample_pdf_file)
    
    assert result.success
    assert "Extracted Title" in result.processed_content
    assert result.metadata["provider"] == "mistral"
    assert result.metadata["model"] == "mistral-ocr-latest"


@pytest.mark.asyncio
async def test_process_empty_response(pdf_config, sample_pdf_file):
    """Test processing fails when OCR returns empty text."""
    processor = MistralPDFProcessor(pdf_config)
    
    mock_response = {"text": ""}
    
    with patch("httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_post = MagicMock()
        mock_post.json = MagicMock(return_value=mock_response)
        mock_post.raise_for_status = MagicMock()
        mock_instance.post = AsyncMock(return_value=mock_post)
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance
        
        with pytest.raises(STTProviderError, match="No text content in OCR response"):
            await processor.process(file_path=sample_pdf_file)


@pytest.mark.asyncio
async def test_process_api_error_401(pdf_config, sample_pdf_file):
    """Test processing handles 401 API error."""
    processor = MistralPDFProcessor(pdf_config)
    
    mock_response_obj = MagicMock()
    mock_response_obj.status_code = 401
    mock_status_error = httpx.HTTPStatusError(
        "401 Unauthorized",
        request=MagicMock(),
        response=mock_response_obj
    )
    
    with patch("httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.post = AsyncMock(side_effect=mock_status_error)
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance
        
        with pytest.raises(STTProviderError, match="Clé API Mistral invalide"):
            await processor.process(file_path=sample_pdf_file)


@pytest.mark.asyncio
async def test_process_no_file_path(pdf_config):
    """Test processing fails without file path."""
    processor = MistralPDFProcessor(pdf_config)
    result = await processor.process()
    assert not result.success
    assert "requires a file path" in result.error


def test_config_get_api_key_plain():
    """Test config returns plain API key when provided."""
    config = MistralPDFConfig(api_key="plain-key-123")
    assert config.get_api_key() == "plain-key-123"


def test_config_get_api_key_encrypted():
    """Test config decrypts encrypted API key."""
    from app.core.security import encrypt_api_key
    
    plain_key = "secret-key-456"
    encrypted_key = encrypt_api_key(plain_key)
    
    config = MistralPDFConfig(api_key_encrypted=encrypted_key)
    assert config.get_api_key() == plain_key


def test_config_get_api_key_none():
    """Test config raises error when no API key provided."""
    config = MistralPDFConfig()
    with pytest.raises(ValueError, match="No API key provided"):
        config.get_api_key()
