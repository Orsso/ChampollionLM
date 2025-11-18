"""
Document exporters registry.

This module provides a registry pattern for all document exporters,
allowing easy addition of new output formats.

To add a new exporter:
1. Create a new file in this directory (e.g., epub.py)
2. Implement a class extending DocumentExporter
3. Import and register it in this file
"""
from __future__ import annotations

from typing import Dict, Type

from app.exporters.base import DocumentExporter, ExportResult

# Import all exporters
from app.exporters.markdown import MarkdownExporter
from app.exporters.pdf import PDFExporter
from app.exporters.docx import DocxExporter


class ExporterRegistry:
    """
    Central registry for all document exporters.
    
    Automatically maps format identifiers to their appropriate exporter.
    """
    
    _exporters: Dict[str, Type[DocumentExporter]] = {}
    
    @classmethod
    def register(cls, exporter_class: Type[DocumentExporter]) -> None:
        """Register an exporter for its target format."""
        cls._exporters[exporter_class.target_format().lower()] = exporter_class
    
    @classmethod
    def get_exporter(cls, format_type: str) -> Type[DocumentExporter] | None:
        """Get the appropriate exporter for a format."""
        return cls._exporters.get(format_type.lower())
    
    @classmethod
    def list_supported_formats(cls) -> list[str]:
        """List all supported export formats."""
        return list(cls._exporters.keys())
    
    @classmethod
    def is_supported(cls, format_type: str) -> bool:
        """Check if a format is supported."""
        return format_type.lower() in cls._exporters


# Auto-register all exporters
ExporterRegistry.register(MarkdownExporter)
ExporterRegistry.register(PDFExporter)
ExporterRegistry.register(DocxExporter)


__all__ = [
    "DocumentExporter",
    "ExportResult",
    "ExporterRegistry",
    "MarkdownExporter",
    "PDFExporter",
    "DocxExporter",
]

