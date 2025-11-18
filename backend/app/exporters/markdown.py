"""
Markdown exporter (passthrough).

Simply saves the markdown content as-is.
"""
from __future__ import annotations

from pathlib import Path

from app.exporters.base import DocumentExporter, ExportResult


class MarkdownExporter(DocumentExporter):
    """
    Markdown exporter (passthrough).
    
    Saves the canonical markdown content without modification.
    """
    
    @classmethod
    def target_format(cls) -> str:
        return "text/markdown"
    
    @classmethod
    def exporter_name(cls) -> str:
        return "markdown_passthrough"
    
    @classmethod
    def exporter_version(cls) -> str:
        return "1.0.0"
    
    async def export(
        self,
        markdown_content: str,
        output_path: Path,
        metadata: dict | None = None,
        **options,
    ) -> ExportResult:
        """Save markdown content to file."""
        # TODO: Implement markdown export
        return ExportResult(
            success=False,
            error="MarkdownExporter not yet implemented"
        )

