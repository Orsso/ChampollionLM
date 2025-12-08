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
        """
        Save markdown content to file.
        
        Args:
            markdown_content: The markdown text to save
            output_path: Destination file path
            metadata: Optional metadata (unused for markdown)
            **options: Additional options (unused)
            
        Returns:
            ExportResult with success status and output path
        """
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(markdown_content, encoding="utf-8")
            return ExportResult(
                success=True,
                file_path=output_path,
            )
        except Exception as e:
            return ExportResult(
                success=False,
                error=f"Failed to write markdown: {e}"
            )
