"""Integration tests for PDF upload and processing."""
import pytest
from pathlib import Path
from unittest.mock import patch, AsyncMock, MagicMock

from app.models import SourceType, SourceStatus


@pytest.mark.asyncio
async def test_upload_pdf_source(authenticated_client, tmp_path):
    """Test PDF upload via API endpoint."""
    client, user = authenticated_client
    
    # Create a project first
    project_resp = await client.post("/api/projects", json={"title": "PDF Test Project"})
    assert project_resp.status_code == 201
    project = project_resp.json()
    project_id = project["id"]
    
    # Create a minimal PDF file
    pdf_path = tmp_path / "test.pdf"
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
    
    # Upload PDF
    with open(pdf_path, "rb") as f:
        upload_resp = await client.post(
            f"/api/projects/{project_id}/sources/pdf",
            files={"file": ("test.pdf", f, "application/pdf")}
        )
    
    assert upload_resp.status_code == 201
    source = upload_resp.json()
    
    # Verify response - check only guaranteedSourceRead fields
    assert source["type"] == "pdf"
    assert source["title"] == "test.pdf"
    assert source["status"] == "uploaded"
    assert source["id"] is not None
    assert "created_at" in source


@pytest.mark.asyncio
async def test_upload_pdf_invalid_extension(authenticated_client, tmp_path):
    """Test PDF upload rejects non-PDF files."""
    client, user = authenticated_client
    
    # Create a project
    project_resp = await client.post("/api/projects", json={"title": "PDF Test"})
    project = project_resp.json()
    project_id = project["id"]
    
    # Try to upload a .txt file
    txt_file = tmp_path / "test.txt"
    txt_file.write_text("This is not a PDF")
    
    with open(txt_file, "rb") as f:
        upload_resp = await client.post(
            f"/api/projects/{project_id}/sources/pdf",
            files={"file": ("test.txt", f, "text/plain")}
        )
    
    assert upload_resp.status_code == 400
    assert "extension" in upload_resp.text.lower()


@pytest.mark.asyncio
async def test_upload_pdf_too_large(authenticated_client, tmp_path):
    """Test PDF upload rejects files exceeding size limit."""
    client, user = authenticated_client
    
    # Create a project
    project_resp = await client.post("/api/projects", json={"title": "PDF Test"})
    project = project_resp.json()
    project_id = project["id"]
    
    # Create a file larger than 50MB (simulated with large content)
    large_pdf = tmp_path / "large.pdf"
    with open(large_pdf, "wb") as f:
        # Write 51MB of data
        f.write(b"0" * (51 * 1024 * 1024))
    
    with open(large_pdf, "rb") as f:
        upload_resp = await client.post(
            f"/api/projects/{project_id}/sources/pdf",
            files={"file": ("large.pdf", f, "application/pdf")}
        )
    
    assert upload_resp.status_code == 413
    assert "too large" in upload_resp.text.lower()
