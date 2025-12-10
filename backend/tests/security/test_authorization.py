"""
Security tests for authorization (resource access control).

Tests cover:
- Users can only access their own resources
- Cross-user access is denied
- Admin routes require superuser privileges
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
class TestProjectAuthorization:
    """Tests for project access authorization."""

    async def test_user_can_access_own_project(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that users can access their own projects."""
        client, _ = authenticated_client

        # Create a project
        create_response = await client.post(
            "/api/projects",
            json={"title": "My Project"},
        )
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]

        # Access the project
        get_response = await client.get(f"/api/projects/{project_id}")
        assert get_response.status_code == 200
        assert get_response.json()["title"] == "My Project"

    async def test_user_cannot_access_other_user_project(self, client: AsyncClient):
        """Verify that users cannot access projects owned by other users."""
        # Register first user and create project
        await client.post(
            "/api/auth/register",
            json={"email": "owner@example.com", "password": "OwnerPass123!"},
        )
        login1 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "owner@example.com", "password": "OwnerPass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token1 = login1.json()["access_token"]

        # Create project as first user
        create_response = await client.post(
            "/api/projects",
            json={"title": "Owner's Project"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        project_id = create_response.json()["id"]

        # Register second user
        await client.post(
            "/api/auth/register",
            json={"email": "intruder@example.com", "password": "IntruderPass123!"},
        )
        login2 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "intruder@example.com", "password": "IntruderPass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token2 = login2.json()["access_token"]

        # Try to access project as second user
        get_response = await client.get(
            f"/api/projects/{project_id}",
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert get_response.status_code == 404, "Should not find other user's project"

    async def test_user_cannot_modify_other_user_project(self, client: AsyncClient):
        """Verify that users cannot modify projects owned by other users."""
        # Setup: Create two users with projects
        await client.post(
            "/api/auth/register",
            json={"email": "modifier_owner@example.com", "password": "Pass123!"},
        )
        login1 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "modifier_owner@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token1 = login1.json()["access_token"]

        create_response = await client.post(
            "/api/projects",
            json={"title": "Original Title"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        project_id = create_response.json()["id"]

        # Second user
        await client.post(
            "/api/auth/register",
            json={"email": "modifier_intruder@example.com", "password": "Pass123!"},
        )
        login2 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "modifier_intruder@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token2 = login2.json()["access_token"]

        # Try to modify as second user
        patch_response = await client.patch(
            f"/api/projects/{project_id}",
            json={"title": "Hacked Title"},
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert patch_response.status_code == 404

    async def test_user_cannot_delete_other_user_project(self, client: AsyncClient):
        """Verify that users cannot delete projects owned by other users."""
        # Setup
        await client.post(
            "/api/auth/register",
            json={"email": "delete_owner@example.com", "password": "Pass123!"},
        )
        login1 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "delete_owner@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token1 = login1.json()["access_token"]

        create_response = await client.post(
            "/api/projects",
            json={"title": "Delete Me"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        project_id = create_response.json()["id"]

        # Second user
        await client.post(
            "/api/auth/register",
            json={"email": "delete_intruder@example.com", "password": "Pass123!"},
        )
        login2 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "delete_intruder@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token2 = login2.json()["access_token"]

        # Try to delete as second user
        delete_response = await client.delete(
            f"/api/projects/{project_id}",
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert delete_response.status_code == 404

        # Verify project still exists
        get_response = await client.get(
            f"/api/projects/{project_id}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        assert get_response.status_code == 200

    async def test_project_list_only_shows_own_projects(self, client: AsyncClient):
        """Verify that project list only returns user's own projects."""
        # First user creates projects
        await client.post(
            "/api/auth/register",
            json={"email": "list_user1@example.com", "password": "Pass123!"},
        )
        login1 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "list_user1@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token1 = login1.json()["access_token"]

        await client.post(
            "/api/projects",
            json={"title": "User1 Project A"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        await client.post(
            "/api/projects",
            json={"title": "User1 Project B"},
            headers={"Authorization": f"Bearer {token1}"},
        )

        # Second user creates projects
        await client.post(
            "/api/auth/register",
            json={"email": "list_user2@example.com", "password": "Pass123!"},
        )
        login2 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "list_user2@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token2 = login2.json()["access_token"]

        await client.post(
            "/api/projects",
            json={"title": "User2 Project"},
            headers={"Authorization": f"Bearer {token2}"},
        )

        # User2 lists projects - should only see their own
        list_response = await client.get(
            "/api/projects",
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert list_response.status_code == 200
        projects = list_response.json()
        assert len(projects) == 1
        assert projects[0]["title"] == "User2 Project"


@pytest.mark.anyio
class TestSourceAuthorization:
    """Tests for source access authorization."""

    async def test_user_cannot_access_sources_of_other_project(self, client: AsyncClient):
        """Verify that users cannot access sources in other users' projects."""
        # First user creates project with source
        await client.post(
            "/api/auth/register",
            json={"email": "source_owner@example.com", "password": "Pass123!"},
        )
        login1 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "source_owner@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token1 = login1.json()["access_token"]

        project_response = await client.post(
            "/api/projects",
            json={"title": "Project With Source"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        project_id = project_response.json()["id"]

        source_response = await client.post(
            f"/api/projects/{project_id}/sources",
            json={"type": "document", "title": "Secret Doc", "content": "Secret content"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        source_id = source_response.json()["id"]

        # Second user
        await client.post(
            "/api/auth/register",
            json={"email": "source_intruder@example.com", "password": "Pass123!"},
        )
        login2 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "source_intruder@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token2 = login2.json()["access_token"]

        # Try to access source
        get_response = await client.get(
            f"/api/projects/{project_id}/sources/{source_id}",
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert get_response.status_code == 404


@pytest.mark.anyio
class TestDocumentAuthorization:
    """Tests for document access authorization."""

    async def test_user_cannot_access_documents_of_other_project(self, client: AsyncClient):
        """Verify that users cannot access documents in other users' projects."""
        # This test depends on document generation which requires API key
        # For now, we test that listing documents in another user's project fails

        # First user creates project
        await client.post(
            "/api/auth/register",
            json={"email": "doc_owner@example.com", "password": "Pass123!"},
        )
        login1 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "doc_owner@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token1 = login1.json()["access_token"]

        project_response = await client.post(
            "/api/projects",
            json={"title": "Project With Docs"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        project_id = project_response.json()["id"]

        # Second user
        await client.post(
            "/api/auth/register",
            json={"email": "doc_intruder@example.com", "password": "Pass123!"},
        )
        login2 = await client.post(
            "/api/auth/jwt/login",
            data={"username": "doc_intruder@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token2 = login2.json()["access_token"]

        # Try to list documents
        get_response = await client.get(
            f"/api/projects/{project_id}/documents",
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert get_response.status_code == 404


@pytest.mark.anyio
class TestAdminAuthorization:
    """Tests for admin route authorization."""

    async def test_admin_routes_require_superuser(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that admin routes are not accessible to regular users."""
        client, _ = authenticated_client

        # Try to access admin users list
        response = await client.get("/api/admin/users")
        assert response.status_code == 403 or response.status_code == 401

    async def test_admin_routes_accessible_by_superuser(self, admin_client: AsyncClient):
        """Verify that superusers can access admin routes."""
        response = await admin_client.get("/api/admin/users")
        assert response.status_code == 200

    async def test_demo_access_management_requires_admin(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that demo access management requires admin privileges."""
        client, _ = authenticated_client

        # Try to grant demo access
        response = await client.post(
            "/api/admin/demo-access",
            json={"email": "demo@example.com", "duration_days": 30},
        )
        assert response.status_code == 403 or response.status_code == 401

    async def test_admin_can_list_demo_access(self, admin_client: AsyncClient):
        """Verify that admins can list demo access records."""
        response = await admin_client.get("/api/admin/demo-access")
        assert response.status_code == 200


@pytest.mark.anyio
class TestUnauthenticatedAccess:
    """Tests for unauthenticated access protection."""

    async def test_projects_require_auth(self, client: AsyncClient):
        """Verify that project endpoints require authentication."""
        # List projects
        response = await client.get("/api/projects")
        assert response.status_code == 401

        # Create project
        response = await client.post(
            "/api/projects",
            json={"title": "Test"},
        )
        assert response.status_code == 401

    async def test_sources_require_auth(self, client: AsyncClient):
        """Verify that source endpoints require authentication."""
        response = await client.get("/api/projects/1/sources")
        assert response.status_code == 401

    async def test_documents_require_auth(self, client: AsyncClient):
        """Verify that document endpoints require authentication."""
        response = await client.get("/api/projects/1/documents")
        assert response.status_code == 401
