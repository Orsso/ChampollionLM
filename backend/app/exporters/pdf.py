"""PDF exporter via Pandoc."""
from __future__ import annotations

import re
import subprocess
import tempfile
from pathlib import Path

from app.exporters.base import DocumentExporter, ExportResult


class PDFExportError(Exception):
    """Error during PDF export."""


class PDFExporter(DocumentExporter):
    """
    PDF exporter using Pandoc with XeLaTeX engine.

    Requires: pandoc, xelatex (texlive)
    """

    @classmethod
    def target_format(cls) -> str:
        return "application/pdf"

    @classmethod
    def exporter_name(cls) -> str:
        return "pandoc_pdf"

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
        Export markdown to PDF via Pandoc.

        Args:
            markdown_content: Source markdown content
            output_path: Target PDF file path
            metadata: Optional metadata (title, etc.)
            **options: Additional export options

        Returns:
            ExportResult with success status and file path
        """
        try:
            # Check Pandoc availability
            if not self._check_pandoc():
                raise PDFExportError(
                    "Pandoc not installed. Install with: "
                    "sudo pacman -S pandoc texlive-xetex (Arch), "
                    "sudo apt-get install pandoc texlive-xetex (Ubuntu/Debian), or "
                    "brew install pandoc basictex (macOS)"
                )

            # Normalize markdown
            normalized_markdown = self._normalize_markdown(markdown_content)

            # Extract title from metadata
            title = metadata.get("title") if metadata else None

            # Convert to PDF
            self._markdown_to_pdf(normalized_markdown, output_path, title=title)

            return ExportResult(
                success=True,
                file_path=output_path,
                metadata={"format": "PDF", "engine": "pandoc+xelatex"},
            )

        except PDFExportError as exc:
            return ExportResult(
                success=False,
                error=str(exc),
            )
        except Exception as exc:
            return ExportResult(
                success=False,
                error=f"Unexpected error: {str(exc)}",
            )

    def _check_pandoc(self) -> bool:
        """Check if Pandoc is installed."""
        try:
            result = subprocess.run(
                ["pandoc", "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            return False

    def _normalize_markdown(self, markdown_content: str) -> str:
        """Normalize markdown for PDF conversion (delegates to module function)."""
        return normalize_markdown(markdown_content)

    def _markdown_to_pdf(
        self,
        markdown_content: str,
        output_path: Path,
        *,
        title: str | None = None,
    ) -> None:
        """
        Convert markdown to PDF via Pandoc.

        Args:
            markdown_content: Markdown content to convert
            output_path: Output PDF file path
            title: Optional document title

        Raises:
            PDFExportError: If conversion fails
        """
        # Create temporary markdown file
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".md",
            delete=False,
            encoding="utf-8",
        ) as md_file:
            md_file.write(markdown_content)
            md_path = Path(md_file.name)

        try:
            # Build Pandoc command
            cmd = [
                "pandoc",
                str(md_path),
                "-o",
                str(output_path),
                "--pdf-engine=xelatex",
                # Margins
                "-V",
                "geometry:margin=2.5cm",
                # Font size
                "-V",
                "fontsize=11pt",
                # Line spacing
                "-V",
                "linestretch=1.3",
                # Syntax highlighting
                "--highlight-style=tango",
            ]

            # Add title if provided
            if title:
                cmd.extend(["-V", f"title={title}"])

            # Execute Pandoc
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,
            )

            if result.returncode != 0:
                error_msg = result.stderr or "Unknown conversion error"
                raise PDFExportError(f"PDF conversion failed: {error_msg}")

            # Verify file was created
            if not output_path.exists():
                raise PDFExportError("PDF file was not generated")

        except subprocess.TimeoutExpired:
            raise PDFExportError("PDF conversion timeout (> 60s)")
        except Exception as exc:
            if isinstance(exc, PDFExportError):
                raise
            raise PDFExportError(f"Unexpected error: {str(exc)}") from exc
        finally:
            # Clean up temporary file
            try:
                md_path.unlink()
            except OSError:
                pass


def normalize_markdown(markdown_content: str) -> str:
    """
    Normalize Markdown for correct PDF conversion.

    - Ensures blank line after headings
    - Ensures blank line before lists
    - Ensures blank line before code blocks
    - Ensures blank line after paragraphs

    Args:
        markdown_content: Raw Markdown content

    Returns:
        Normalized Markdown
    """
    # Strip trailing whitespace from lines
    lines = [line.rstrip() for line in markdown_content.split("\n")]

    normalized = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Add current line
        normalized.append(line)

        # If line is not empty, check what follows
        if line.strip():
            # Look at next line if it exists
            if i + 1 < len(lines):
                next_line = lines[i + 1]

                # If current line is a heading (#, ##, etc.)
                if re.match(r"^#{1,6}\s", line):
                    # Ensure blank line after
                    if next_line.strip():
                        normalized.append("")

                # If next line starts a list
                elif re.match(r"^\s*[\*\-\+]\s", next_line) or re.match(
                    r"^\s*\d+\.\s", next_line
                ):
                    # Ensure blank line before list
                    if line.strip() and not re.match(
                        r"^\s*[\*\-\+]\s", line
                    ) and not re.match(r"^\s*\d+\.\s", line):
                        normalized.append("")

                # If next line starts a code block
                elif next_line.strip().startswith("```"):
                    # Ensure blank line before code block
                    normalized.append("")

        i += 1

    # Join and clean multiple consecutive blank lines
    result = "\n".join(normalized)

    # Reduce multiple blank lines to maximum 2
    result = re.sub(r"\n{3,}", "\n\n", result)

    return result.strip() + "\n"
