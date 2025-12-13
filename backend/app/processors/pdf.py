"""
PDF processor using Mistral AI OCR.

Extracts text from PDF documents using the Mistral OCR API,
preserving document structure (headers, paragraphs, tables, etc.).
"""
from __future__ import annotations

import base64
from dataclasses import dataclass
from pathlib import Path

import aiofiles
import httpx
import aiofiles

from app.core.security import decrypt_api_key
from app.processors.base import ProcessorResult, SourceProcessor
from app.services.transcription import STTProviderError

MISTRAL_OCR_MODEL = "mistral-ocr-latest"
MAX_PDF_SIZE_MB = 50  # Mistral API recommended limit


@dataclass
class MistralPDFConfig:
    """Configuration for Mistral PDF OCR processor.
    
    Accepts either:
    - api_key: Plain text API key (preferred, used by demo access)
    - api_key_encrypted: Encrypted API key (legacy, will be decrypted)
    """

    api_key: str | None = None
    api_key_encrypted: str | None = None

    def get_api_key(self) -> str:
        """Get the effective API key, decrypting if needed."""
        if self.api_key:
            return self.api_key
        if self.api_key_encrypted:
            return decrypt_api_key(self.api_key_encrypted)
        raise ValueError("No API key provided")


class MistralPDFProcessor(SourceProcessor):
    """
    PDF processor using Mistral AI OCR.

    Supports: PDF documents
    Features:
    - Structured text extraction (preserves headers, paragraphs, tables)
    - Markdown output format
    - Page-based cost estimation
    """

    def __init__(self, config: MistralPDFConfig):
        self.config = config
        self.api_key = config.get_api_key()

    @classmethod
    def supported_formats(cls) -> list[str]:
        return ["application/pdf"]

    @classmethod
    def processor_name(cls) -> str:
        return "pdf_ocr_mistral"

    @classmethod
    def processor_version(cls) -> str:
        return "1.0.0"

    @classmethod
    def config_class(cls) -> type:
        return MistralPDFConfig

    async def validate(
        self, file_path: Path | None = None, content: str | None = None
    ) -> tuple[bool, str | None]:
        """Validate PDF file exists and is within size limits."""
        if not file_path:
            return False, "PDF processor requires a file path"
        if not file_path.exists():
            return False, f"File not found: {file_path}"
        
        # Check file size
        size_bytes = file_path.stat().st_size
        size_mb = size_bytes / (1024 * 1024)
        if size_mb > MAX_PDF_SIZE_MB:
            return False, f"PDF file too large: {size_mb:.1f}MB (max {MAX_PDF_SIZE_MB}MB)"
        
        # Check file extension
        if file_path.suffix.lower() != '.pdf':
            return False, f"Invalid file extension: {file_path.suffix} (expected .pdf)"
        
        return True, None

    async def process(
        self,
        file_path: Path | None = None,
        content: str | None = None,
        **options,
    ) -> ProcessorResult:
        """
        Extract text from PDF using Mistral OCR.

        Args:
            file_path: Path to PDF file
            content: Not used for PDF processing
            **options: Reserved for future options

        Returns:
            ProcessorResult with extracted text in markdown format

        Raises:
            STTProviderError: If OCR processing fails
        """
        if not file_path:
            return ProcessorResult(
                success=False, error="PDF processor requires a file path"
            )

        try:
            # Read PDF file asynchronously and encode to base64
            async with aiofiles.open(file_path, "rb") as f:
                pdf_bytes = await f.read()
            
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

            # Call Mistral OCR API
            extracted_text = await self._process_ocr(pdf_base64)

            if not extracted_text or not extracted_text.strip():
                raise STTProviderError("OCR returned empty text")

            return ProcessorResult(
                success=True,
                processed_content=extracted_text.strip(),
                metadata={
                    "provider": "mistral",
                    "model": MISTRAL_OCR_MODEL,
                    "file_size_bytes": len(pdf_bytes),
                },
            )

        except STTProviderError:
            raise
        except Exception as exc:
            raise STTProviderError(f"PDF processing failed: {str(exc)}") from exc

    async def _process_ocr(self, pdf_base64: str) -> str:
        """Process PDF with Mistral OCR API.
        
        Args:
            pdf_base64: Base64 encoded PDF content
            
        Returns:
            Extracted text in markdown format
            
        Raises:
            STTProviderError: If API call fails
        """
        result = None
        try:
            async with httpx.AsyncClient(timeout=120.0) as http_client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }

                payload = {
                    "model": MISTRAL_OCR_MODEL,
                    "document": {
                        "type": "document_url",
                        "document_url": f"data:application/pdf;base64,{pdf_base64}"
                    }
                }

                response = await http_client.post(
                    "https://api.mistral.ai/v1/ocr",
                    json=payload,
                    headers=headers,
                )

                response.raise_for_status()
                result = response.json()

        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 401:
                raise STTProviderError(
                    "Clé API Mistral invalide ou expirée. Veuillez vérifier vos paramètres."
                ) from exc
            raise STTProviderError(f"OCR API error: {exc}") from exc
        except Exception as exc:  # pragma: no cover - network failures
            raise STTProviderError(f"OCR request failed: {exc}") from exc

        if result is None:
            raise STTProviderError("No response received from OCR API")

        # Extract text from response - Mistral OCR returns pages array
        pages = result.get("pages", [])
        if not pages:
            raise STTProviderError("No pages in OCR response")
        
        # Combine markdown from all pages
        extracted_text = "\n\n".join(
            page.get("markdown", "") for page in pages
        )
        
        if not extracted_text or not extracted_text.strip():
            raise STTProviderError("No text content in OCR response")

        return extracted_text
