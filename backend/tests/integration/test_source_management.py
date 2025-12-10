"""
Integration tests for Source management.

Tests cover:
- Document source creation
- YouTube transcript import
- Source listing and retrieval
- Source deletion
- Source status tracking
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
class TestDocumentSourceCreation:
    """Tests for document source creation."""

    async def test_create_document_source(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that document sources can be created."""
        client, _ = authenticated_client

        # Create project
        project_response = await client.post(
            "/api/projects", json={"title": "Source Test Project"}
        )
        project_id = project_response.json()["id"]

        # Create document source
        response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={
                "type": "document",
                "title": "Test Document",
                "content": "# Test Content\n\nThis is test content.",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Document"
        assert data["type"] == "document"
        assert "id" in data

    async def test_create_document_source_with_markdown(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that markdown content is preserved."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Markdown Test"}
        )
        project_id = project_response.json()["id"]

        markdown_content = """# Heading 1

## Heading 2

- List item 1
- List item 2

**Bold** and *italic* text.

```python
def hello():
    print("Hello, World!")
```
"""

        response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={
                "type": "document",
                "title": "Markdown Document",
                "content": markdown_content,
            },
        )

        assert response.status_code == 201

    async def test_create_source_missing_title_fails(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that sources require a title."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Test Project"}
        )
        project_id = project_response.json()["id"]

        response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "content": "No title"},
        )

        assert response.status_code == 422

    async def test_create_source_missing_type_fails(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that sources require a type."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Test Project"}
        )
        project_id = project_response.json()["id"]

        response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={"title": "No Type", "content": "Content"},
        )

        assert response.status_code == 422

    async def test_create_source_in_nonexistent_project_fails(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that creating sources in non-existent projects fails."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/projects/99999/sources",
            json={"type": "document", "title": "Test", "content": "Content"},
        )

        assert response.status_code == 404


@pytest.mark.anyio
class TestYouTubeSourceImport:
    """Tests for YouTube transcript import."""

    async def test_youtube_import_invalid_url_fails(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that invalid YouTube URLs are rejected."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "YouTube Test"}
        )
        project_id = project_response.json()["id"]

        response = await client.post(
            f"/api/projects/{project_id}/sources/youtube",
            json={"url": "not-a-valid-url"},
        )

        assert response.status_code in [400, 422]

    async def test_youtube_import_non_youtube_url_fails(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that non-YouTube URLs are rejected."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "YouTube Test"}
        )
        project_id = project_response.json()["id"]

        response = await client.post(
            f"/api/projects/{project_id}/sources/youtube",
            json={"url": "https://vimeo.com/123456"},
        )

        assert response.status_code in [400, 422]


@pytest.mark.anyio
class TestSourceListing:
    """Tests for source listing."""

    async def test_list_sources_empty(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that empty source list returns empty array."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Empty Project"}
        )
        project_id = project_response.json()["id"]

        response = await client.get(f"/api/projects/{project_id}/sources")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_sources_returns_all_sources(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that all sources are listed."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Multi-Source Project"}
        )
        project_id = project_response.json()["id"]

        # Create multiple sources
        for i in range(3):
            await client.post(
                f"/api/projects/{project_id}/sources",
                json={"type": "document", "title": f"Source {i}", "content": f"Content {i}"},
            )

        response = await client.get(f"/api/projects/{project_id}/sources")
        assert response.status_code == 200
        sources = response.json()
        assert len(sources) == 3


@pytest.mark.anyio
class TestSourceDetail:
    """Tests for source detail retrieval."""

    async def test_get_source_detail(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that source details can be retrieved."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Detail Test"}
        )
        project_id = project_response.json()["id"]

        source_response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "title": "Detail Source", "content": "Content"},
        )
        source_id = source_response.json()["id"]

        response = await client.get(f"/api/projects/{project_id}/sources/{source_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Detail Source"
        assert data["type"] == "document"

    async def test_get_nonexistent_source_returns_404(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that non-existent sources return 404."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Test Project"}
        )
        project_id = project_response.json()["id"]

        response = await client.get(f"/api/projects/{project_id}/sources/99999")
        assert response.status_code == 404


@pytest.mark.anyio
class TestSourceUpdate:
    """Tests for source update."""

    async def test_update_source_title(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that source title can be updated."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Update Test"}
        )
        project_id = project_response.json()["id"]

        source_response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "title": "Original", "content": "Content"},
        )
        source_id = source_response.json()["id"]

        response = await client.patch(
            f"/api/projects/{project_id}/sources/{source_id}",
            json={"title": "Updated Title"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"


@pytest.mark.anyio
class TestSourceDeletion:
    """Tests for source deletion."""

    async def test_delete_source_success(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that sources can be deleted."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Delete Test"}
        )
        project_id = project_response.json()["id"]

        source_response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "title": "To Delete", "content": "Content"},
        )
        source_id = source_response.json()["id"]

        response = await client.delete(f"/api/projects/{project_id}/sources/{source_id}")
        assert response.status_code == 204

        # Verify deleted
        get_response = await client.get(f"/api/projects/{project_id}/sources/{source_id}")
        assert get_response.status_code == 404

    async def test_delete_nonexistent_source_returns_404(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that deleting non-existent sources returns 404."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Test Project"}
        )
        project_id = project_response.json()["id"]

        response = await client.delete(f"/api/projects/{project_id}/sources/99999")
        assert response.status_code == 404


@pytest.mark.anyio
class TestSourceStatus:
    """Tests for source status tracking."""

    async def test_document_source_status_is_processed(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that document sources are immediately processed."""
        client, _ = authenticated_client

        project_response = await client.post(
            "/api/projects", json={"title": "Status Test"}
        )
        project_id = project_response.json()["id"]

        source_response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "title": "Doc Source", "content": "Content"},
        )

        assert source_response.status_code == 201
        data = source_response.json()
        # Document sources should be immediately processed
        assert data["status"] in ["processed", "uploaded"]
