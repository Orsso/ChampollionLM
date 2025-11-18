"""
Base classes for document exporters.

Exporters handle conversion of the canonical markdown format
to various output formats (PDF, DOCX, HTML, etc.).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


class DocumentProviderError(Exception):
    """Base exception for document export errors."""


@dataclass
class ExportResult:
    """Result of exporting a document."""

    success: bool
    file_path: Path | None = None
    metadata: dict | None = None
    error: str | None = None


class DocumentExporter(ABC):
    """
    Abstract base class for all document exporters.
    
    Exporters convert the canonical markdown format to various output formats.
    All documents are stored as markdown, and exports are generated on-demand.
    
    To add a new export format:
    1. Create a new exporter class extending DocumentExporter
    2. Implement all abstract methods
    3. Register it in exporters/__init__.py
    """
    
    @classmethod
    @abstractmethod
    def target_format(cls) -> str:
        """
        Target format identifier (MIME type or extension).
        
        Examples: "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        """
        pass
    
    @classmethod
    @abstractmethod
    def exporter_name(cls) -> str:
        """Unique name identifier for this exporter."""
        pass
    
    @classmethod
    @abstractmethod
    def exporter_version(cls) -> str:
        """Version string for tracking exporter changes."""
        pass
    
    @abstractmethod
    async def export(
        self,
        markdown_content: str,
        output_path: Path,
        metadata: dict | None = None,
        **options,
    ) -> ExportResult:
        """
        Export markdown content to target format.
        
        Args:
            markdown_content: Source markdown content
            output_path: Destination file path
            metadata: Document metadata (title, author, etc.)
            **options: Exporter-specific options
            
        Returns:
            ExportResult with file path and metadata
        """
        pass

