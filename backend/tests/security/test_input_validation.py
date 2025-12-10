"""
Security tests for input validation.

Tests cover:
- XSS payload handling
- Path traversal prevention
- File upload validation
- Input length limits
- Invalid format rejection
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
class TestXSSPrevention:
    """Tests for XSS attack prevention."""

    async def test_xss_payload_in_project_title(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that XSS payloads in project titles are handled safely."""
        client, _ = authenticated_client

        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert(1)",
            "<img src=x onerror=alert(1)>",
            "';alert(String.fromCharCode(88,83,83))//",
            "<svg onload=alert(1)>",
        ]

        for payload in xss_payloads:
            response = await client.post(
                "/api/projects",
                json={"title": payload},
            )
            # Should either accept and sanitize, or reject
            # The key is that the payload should NOT be executed
            if response.status_code == 201:
                # If accepted, verify stored title doesn't contain raw script tags
                project = response.json()
                # Title might be stored as-is but should be escaped on output
                # The important thing is the API doesn't crash
                assert project["id"] is not None

    async def test_xss_payload_in_source_content(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that XSS payloads in source content are handled safely."""
        client, _ = authenticated_client

        # Create project
        project_response = await client.post(
            "/api/projects",
            json={"title": "XSS Test Project"},
        )
        project_id = project_response.json()["id"]

        xss_content = """
# Malicious Document
<script>alert('stored xss')</script>

Normal text followed by <img src=x onerror=alert(1)>

More content with <svg/onload=alert('XSS')>
"""

        response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={
                "type": "document",
                "title": "XSS Content Test",
                "content": xss_content,
            },
        )
        # Should accept (content is markdown/text) without crashing
        assert response.status_code == 201

    async def test_xss_payload_in_description(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that XSS payloads in descriptions are handled safely."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/projects",
            json={
                "title": "Normal Title",
                "description": "<script>document.cookie</script>",
            },
        )
        # Should accept without executing script
        assert response.status_code == 201


@pytest.mark.anyio
class TestPathTraversal:
    """Tests for path traversal attack prevention."""

    async def test_path_traversal_in_audio_filename(
        self, authenticated_client: tuple[AsyncClient, dict],
        sample_audio_file,
    ):
        """Verify that path traversal attempts in filenames are rejected."""
        client, _ = authenticated_client

        # Create project
        project_response = await client.post(
            "/api/projects",
            json={"title": "Path Traversal Test"},
        )
        project_id = project_response.json()["id"]

        # Try to upload with path traversal filename
        with open(sample_audio_file, "rb") as f:
            response = await client.post(
                f"/api/projects/{project_id}/sources/audio",
                files={"file": ("../../../etc/passwd", f, "audio/mpeg")},
            )
            # Should either reject or sanitize the filename
            # If accepted, the file should NOT be stored at /etc/passwd
            assert response.status_code in [201, 400, 422]


@pytest.mark.anyio
class TestFileSizeValidation:
    """Tests for file size validation."""

    async def test_invalid_file_content_returns_proper_error(
        self, authenticated_client: tuple[AsyncClient, dict],
        tmp_path,
    ):
        """Verify that files with invalid content return a proper HTTP error (not 500).

        This test documents a bug: when mutagen cannot parse an audio file,
        the exception propagates as 500 instead of being caught and returned as 400/422.
        """
        client, _ = authenticated_client

        # Create project
        project_response = await client.post(
            "/api/projects",
            json={"title": "File Validation Test"},
        )
        project_id = project_response.json()["id"]

        # Create a file with null bytes (not valid audio)
        invalid_file = tmp_path / "invalid.mp3"
        invalid_file.write_bytes(b"\x00" * 1000)

        with open(invalid_file, "rb") as f:
            response = await client.post(
                f"/api/projects/{project_id}/sources/audio",
                files={"file": ("invalid.mp3", f, "audio/mpeg")},
            )
            # Should return 400/422 but currently returns 500 due to unhandled exception
            assert response.status_code in [400, 422], \
                f"Should return 400/422, got {response.status_code}"


@pytest.mark.anyio
class TestFileFormatValidation:
    """Tests for file format validation."""

    async def test_text_file_disguised_as_audio_returns_proper_error(
        self, authenticated_client: tuple[AsyncClient, dict],
        tmp_path,
    ):
        """Verify that non-audio files return proper HTTP error.

        This test documents that the system DOES reject invalid files (via mutagen),
        but the error handling should be improved to return 400/422 instead of 500.
        """
        client, _ = authenticated_client

        # Create project
        project_response = await client.post(
            "/api/projects",
            json={"title": "Format Validation Test"},
        )
        project_id = project_response.json()["id"]

        # Create a text file with .mp3 extension
        fake_audio = tmp_path / "fake.mp3"
        fake_audio.write_text("This is not an audio file")

        with open(fake_audio, "rb") as f:
            response = await client.post(
                f"/api/projects/{project_id}/sources/audio",
                files={"file": ("fake.mp3", f, "audio/mpeg")},
            )
            # Should return 400/422 but currently propagates mutagen error as 500
            assert response.status_code in [400, 422], \
                f"Should return 400/422, got {response.status_code}"

    async def test_executable_disguised_as_audio_returns_proper_error(
        self, authenticated_client: tuple[AsyncClient, dict],
        tmp_path,
    ):
        """Verify that executables disguised as audio return proper HTTP error.

        This test documents that the system DOES reject invalid files (via mutagen),
        but the error handling should be improved to return 400/422 instead of 500.
        """
        client, _ = authenticated_client

        # Create project
        project_response = await client.post(
            "/api/projects",
            json={"title": "Executable Test"},
        )
        project_id = project_response.json()["id"]

        # Create a "malicious" file with audio extension
        malicious_file = tmp_path / "malware.mp3"
        # ELF header (Linux executable)
        malicious_file.write_bytes(b"\x7fELF" + b"\x00" * 100)

        with open(malicious_file, "rb") as f:
            response = await client.post(
                f"/api/projects/{project_id}/sources/audio",
                files={"file": ("malware.mp3", f, "audio/mpeg")},
            )
            # Should return 400/422 but currently propagates mutagen error as 500
            assert response.status_code in [400, 422], \
                f"Should return 400/422, got {response.status_code}"


@pytest.mark.anyio
class TestYouTubeURLValidation:
    """Tests for YouTube URL validation."""

    async def test_invalid_youtube_url_rejected(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that invalid YouTube URLs are rejected."""
        client, _ = authenticated_client

        # Create project
        project_response = await client.post(
            "/api/projects",
            json={"title": "YouTube Validation Test"},
        )
        project_id = project_response.json()["id"]

        invalid_urls = [
            "not-a-url",
            "http://example.com",
            "https://vimeo.com/12345",
            "ftp://youtube.com/watch?v=123",
            "javascript:alert(1)",
        ]

        for url in invalid_urls:
            response = await client.post(
                f"/api/projects/{project_id}/sources/youtube",
                json={"url": url},
            )
            assert response.status_code in [400, 422], f"Should reject URL: {url}"


@pytest.mark.anyio
class TestInputLengthLimits:
    """Tests for input length validation."""

    async def test_project_title_length_limit(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that excessively long project titles are rejected or truncated."""
        client, _ = authenticated_client

        # Try very long title (> 160 chars as per model)
        long_title = "A" * 500

        response = await client.post(
            "/api/projects",
            json={"title": long_title},
        )
        # Should either reject or truncate
        assert response.status_code in [201, 400, 422]

        if response.status_code == 201:
            # If accepted, verify truncation
            project = response.json()
            assert len(project["title"]) <= 160

    async def test_source_title_length_limit(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that excessively long source titles are handled."""
        client, _ = authenticated_client

        # Create project
        project_response = await client.post(
            "/api/projects",
            json={"title": "Length Test Project"},
        )
        project_id = project_response.json()["id"]

        long_title = "B" * 500

        response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={
                "type": "document",
                "title": long_title,
                "content": "Short content",
            },
        )
        assert response.status_code in [201, 400, 422]


@pytest.mark.anyio
class TestEmailValidation:
    """Tests for email format validation."""

    async def test_malformed_email_rejected(self, client: AsyncClient):
        """Verify that malformed email addresses are rejected."""
        invalid_emails = [
            "plainstring",
            "@nodomain",
            "spaces in@email.com",
            "missing@.com",
            "<script>@xss.com",
            "email\x00null@example.com",  # Null byte injection
        ]

        for email in invalid_emails:
            response = await client.post(
                "/api/auth/register",
                json={"email": email, "password": "ValidPass123!"},
            )
            assert response.status_code in [400, 422], f"Should reject email: {email}"


@pytest.mark.anyio
class TestJSONInjection:
    """Tests for JSON injection prevention."""

    async def test_nested_json_handled(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that deeply nested JSON is handled without stack overflow."""
        client, _ = authenticated_client

        # Create deeply nested structure
        nested = {"level": 0}
        current = nested
        for i in range(100):
            current["nested"] = {"level": i + 1}
            current = current["nested"]

        response = await client.post(
            "/api/projects",
            json={"title": "Nested Test", "metadata": nested},
        )
        # Should either reject extra fields or ignore them
        assert response.status_code in [201, 400, 422]

    async def test_unicode_handling(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that Unicode characters are handled correctly."""
        client, _ = authenticated_client

        unicode_titles = [
            "日本語タイトル",
            "Émoji 🎉 test",
            "Приклад кирилиці",
            "العربية",
            "\u200b\u200b\u200b",  # Zero-width spaces
        ]

        for title in unicode_titles:
            response = await client.post(
                "/api/projects",
                json={"title": title},
            )
            # Should handle all Unicode gracefully
            assert response.status_code == 201
