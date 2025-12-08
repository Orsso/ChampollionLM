"""
DOCX exporter.

Converts markdown to Microsoft Word format (.docx) using pandoc.
"""
from __future__ import annotations

import asyncio
import tempfile
from pathlib import Path

from app.exporters.base import DocumentExporter, ExportResult


class DocxExporter(DocumentExporter):
    """
    DOCX exporter using Pandoc.
    
    Converts markdown to Microsoft Word format.
    Requires pandoc to be installed on the system.
    """
    
    @classmethod
    def target_format(cls) -> str:
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    
    @classmethod
    def exporter_name(cls) -> str:
        return "docx_export"
    
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
        Export markdown to DOCX format using pandoc.
        
        Args:
            markdown_content: Source markdown content
            output_path: Destination file path (.docx)
            metadata: Document metadata (title, author extracted if present)
            **options: Additional pandoc options
            
        Returns:
            ExportResult with success status and file path
        """
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write markdown to temp file for pandoc
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".md", delete=False, encoding="utf-8"
            ) as tmp:
                tmp.write(markdown_content)
                tmp_path = Path(tmp.name)
            
            try:
                # Build pandoc command
                cmd = [
                    "pandoc",
                    str(tmp_path),
                    "-o", str(output_path),
                    "--from=markdown",
                    "--to=docx",
                ]
                
                # Add metadata if provided
                if metadata:
                    if title := metadata.get("title"):
                        cmd.extend(["--metadata", f"title={title}"])
                    if author := metadata.get("author"):
                        cmd.extend(["--metadata", f"author={author}"])
                
                # Run pandoc
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                _, stderr = await proc.communicate()
                
                if proc.returncode != 0:
                    return ExportResult(
                        success=False,
                        error=f"Pandoc failed: {stderr.decode().strip()}"
                    )
                
                return ExportResult(
                    success=True,
                    file_path=output_path,
                )
            finally:
                # Clean up temp file
                tmp_path.unlink(missing_ok=True)
                
        except FileNotFoundError:
            return ExportResult(
                success=False,
                error="Pandoc not found. Please install pandoc."
            )
        except Exception as e:
            return ExportResult(
                success=False,
                error=f"Failed to export DOCX: {e}"
            )
