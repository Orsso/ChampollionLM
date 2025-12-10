"""
Integration tests for Project CRUD operations.

Tests cover:
- Project creation
- Project listing with pagination
- Project detail retrieval
- Project update
- Project deletion with cascade
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
class TestProjectCreation:
    """Tests for project creation."""

    async def test_create_project_success(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that authenticated users can create projects."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/projects",
            json={"title": "My New Project", "description": "A test project"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "My New Project"
        assert data["description"] == "A test project"
        assert "id" in data
        assert "created_at" in data

    async def test_create_project_minimal(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that projects can be created with only required fields."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/projects",
            json={"title": "Minimal Project"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Minimal Project"

    async def test_create_project_missing_title_fails(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that projects require a title."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/projects",
            json={"description": "No title project"},
        )

        assert response.status_code == 422

    async def test_create_project_empty_title_fails(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that empty titles are rejected."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/projects",
            json={"title": ""},
        )

        # Should reject empty title
        assert response.status_code in [400, 422]

    async def test_create_multiple_projects(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that users can create multiple projects."""
        client, _ = authenticated_client

        for i in range(5):
            response = await client.post(
                "/api/projects",
                json={"title": f"Project {i}"},
            )
            assert response.status_code == 201

        # List all projects
        list_response = await client.get("/api/projects")
        assert list_response.status_code == 200
        projects = list_response.json()
        assert len(projects) == 5


@pytest.mark.anyio
class TestProjectListing:
    """Tests for project listing."""

    async def test_list_projects_empty(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that empty project list returns empty array."""
        client, _ = authenticated_client

        response = await client.get("/api/projects")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_projects_returns_user_projects(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that listing returns only user's projects."""
        client, _ = authenticated_client

        # Create projects
        await client.post("/api/projects", json={"title": "Project A"})
        await client.post("/api/projects", json={"title": "Project B"})

        response = await client.get("/api/projects")
        assert response.status_code == 200
        projects = response.json()
        assert len(projects) == 2
        titles = [p["title"] for p in projects]
        assert "Project A" in titles
        assert "Project B" in titles

    async def test_list_projects_pagination(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify paginated project listing works correctly."""
        client, _ = authenticated_client

        # Create 15 projects
        for i in range(15):
            await client.post("/api/projects", json={"title": f"Project {i}"})

        # Get paginated list (API uses limit/offset, not page/size)
        response = await client.get("/api/projects/paginated?limit=5&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) == 5
        assert data["total"] == 15
        assert data["has_more"] is True

        # Get second page
        response2 = await client.get("/api/projects/paginated?limit=5&offset=5")
        assert response2.status_code == 200
        data2 = response2.json()
        assert len(data2["items"]) == 5

    async def test_list_projects_includes_counts(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that project listing includes source and document counts."""
        client, _ = authenticated_client

        # Create project
        project_response = await client.post(
            "/api/projects", json={"title": "Project With Sources"}
        )
        project_id = project_response.json()["id"]

        # Add sources
        await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "title": "Source 1", "content": "Test"},
        )
        await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "title": "Source 2", "content": "Test"},
        )

        # List projects
        response = await client.get("/api/projects")
        assert response.status_code == 200
        projects = response.json()
        assert len(projects) == 1
        assert projects[0]["sources_count"] == 2


@pytest.mark.anyio
class TestProjectDetail:
    """Tests for project detail retrieval."""

    async def test_get_project_detail(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that project details can be retrieved."""
        client, _ = authenticated_client

        # Create project
        create_response = await client.post(
            "/api/projects",
            json={"title": "Detail Test", "description": "Test description"},
        )
        project_id = create_response.json()["id"]

        # Get detail
        response = await client.get(f"/api/projects/{project_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Detail Test"
        assert data["description"] == "Test description"
        assert data["id"] == project_id

    async def test_get_nonexistent_project_returns_404(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that non-existent projects return 404."""
        client, _ = authenticated_client

        response = await client.get("/api/projects/99999")
        assert response.status_code == 404

    async def test_project_detail_includes_sources(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that project detail includes sources."""
        client, _ = authenticated_client

        # Create project with source
        project_response = await client.post(
            "/api/projects", json={"title": "Project With Sources"}
        )
        project_id = project_response.json()["id"]

        await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "title": "Test Source", "content": "Content"},
        )

        # Get detail
        response = await client.get(f"/api/projects/{project_id}")
        assert response.status_code == 200
        data = response.json()
        assert "sources" in data
        assert len(data["sources"]) == 1
        assert data["sources"][0]["title"] == "Test Source"


@pytest.mark.anyio
class TestProjectUpdate:
    """Tests for project update."""

    async def test_update_project_title(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that project title can be updated."""
        client, _ = authenticated_client

        # Create project
        create_response = await client.post(
            "/api/projects", json={"title": "Original Title"}
        )
        project_id = create_response.json()["id"]

        # Update title
        response = await client.patch(
            f"/api/projects/{project_id}",
            json={"title": "Updated Title"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

        # Verify persisted
        get_response = await client.get(f"/api/projects/{project_id}")
        assert get_response.json()["title"] == "Updated Title"

    async def test_update_project_description(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that project description can be updated."""
        client, _ = authenticated_client

        # Create project
        create_response = await client.post(
            "/api/projects",
            json={"title": "Test", "description": "Original description"},
        )
        project_id = create_response.json()["id"]

        # Update description
        response = await client.patch(
            f"/api/projects/{project_id}",
            json={"description": "New description"},
        )
        assert response.status_code == 200
        assert response.json()["description"] == "New description"

    async def test_update_nonexistent_project_returns_404(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that updating non-existent projects returns 404."""
        client, _ = authenticated_client

        response = await client.patch(
            "/api/projects/99999",
            json={"title": "New Title"},
        )
        assert response.status_code == 404


@pytest.mark.anyio
class TestProjectDeletion:
    """Tests for project deletion."""

    async def test_delete_project_success(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that projects can be deleted."""
        client, _ = authenticated_client

        # Create project
        create_response = await client.post(
            "/api/projects", json={"title": "To Delete"}
        )
        project_id = create_response.json()["id"]

        # Delete
        response = await client.delete(f"/api/projects/{project_id}")
        assert response.status_code == 204

        # Verify deleted
        get_response = await client.get(f"/api/projects/{project_id}")
        assert get_response.status_code == 404

    async def test_delete_project_cascades_sources(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that deleting project also deletes its sources."""
        client, _ = authenticated_client

        # Create project with source
        project_response = await client.post(
            "/api/projects", json={"title": "Project With Source"}
        )
        project_id = project_response.json()["id"]

        source_response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "title": "Source", "content": "Test"},
        )
        source_id = source_response.json()["id"]

        # Delete project
        await client.delete(f"/api/projects/{project_id}")

        # Source should be inaccessible (project doesn't exist)
        get_response = await client.get(
            f"/api/projects/{project_id}/sources/{source_id}"
        )
        assert get_response.status_code == 404

    async def test_delete_nonexistent_project_returns_404(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that deleting non-existent projects returns 404."""
        client, _ = authenticated_client

        response = await client.delete("/api/projects/99999")
        assert response.status_code == 404

    async def test_delete_project_multiple_times_fails(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that deleting same project twice fails."""
        client, _ = authenticated_client

        # Create and delete
        create_response = await client.post(
            "/api/projects", json={"title": "Double Delete"}
        )
        project_id = create_response.json()["id"]
        await client.delete(f"/api/projects/{project_id}")

        # Try to delete again
        response = await client.delete(f"/api/projects/{project_id}")
        assert response.status_code == 404
