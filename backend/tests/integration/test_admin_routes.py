"""
Integration tests for Admin routes.

Tests cover:
- User listing (admin only)
- Demo access management
- Admin authorization requirements
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
class TestAdminUserListing:
    """Tests for admin user listing."""

    async def test_list_users_as_admin(self, admin_client: AsyncClient):
        """Verify that admins can list all users."""
        response = await admin_client.get("/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        # At least the admin user should exist
        assert len(users) >= 1

    async def test_list_users_as_regular_user_forbidden(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that regular users cannot list all users."""
        client, _ = authenticated_client

        response = await client.get("/api/admin/users")
        assert response.status_code == 403

    async def test_list_users_unauthenticated_forbidden(self, client: AsyncClient):
        """Verify that unauthenticated requests cannot list users."""
        response = await client.get("/api/admin/users")
        assert response.status_code == 401


@pytest.mark.anyio
class TestDemoAccessManagement:
    """Tests for demo access grant/revoke."""

    async def test_list_demo_access_as_admin(self, admin_client: AsyncClient):
        """Verify that admins can list demo access records."""
        response = await admin_client.get("/api/admin/demo-access")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_grant_demo_access(self, admin_client: AsyncClient, client: AsyncClient):
        """Verify that admins can grant demo access to users."""
        # First create a regular user
        await client.post(
            "/api/auth/register",
            json={"email": "demo_user@example.com", "password": "DemoPass123!"},
        )

        # Grant demo access as admin
        response = await admin_client.post(
            "/api/admin/demo-access",
            json={
                "email": "demo_user@example.com",
                "duration_days": 30,
                "notes": "Test demo access grant",
            },
        )
        assert response.status_code in [200, 201]

    async def test_grant_demo_access_nonexistent_user(self, admin_client: AsyncClient):
        """Verify that granting demo access to non-existent user fails."""
        response = await admin_client.post(
            "/api/admin/demo-access",
            json={
                "email": "nonexistent@example.com",
                "duration_days": 30,
            },
        )
        assert response.status_code == 404

    async def test_grant_demo_access_as_regular_user_forbidden(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that regular users cannot grant demo access."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/admin/demo-access",
            json={"email": "someone@example.com", "duration_days": 30},
        )
        assert response.status_code == 403

    async def test_revoke_demo_access(self, admin_client: AsyncClient, client: AsyncClient):
        """Verify that admins can revoke demo access."""
        # Create user and grant demo access
        await client.post(
            "/api/auth/register",
            json={"email": "revoke_test@example.com", "password": "Pass123!"},
        )

        # Get user ID
        users_response = await admin_client.get("/api/admin/users")
        users = users_response.json()
        user = next((u for u in users if u["email"] == "revoke_test@example.com"), None)
        assert user is not None
        user_id = user["id"]

        # Grant demo access
        await admin_client.post(
            "/api/admin/demo-access",
            json={"email": "revoke_test@example.com", "duration_days": 30},
        )

        # Revoke demo access
        response = await admin_client.delete(f"/api/admin/demo-access/{user_id}")
        assert response.status_code in [200, 204]


@pytest.mark.anyio
class TestDemoAccessEffect:
    """Tests for demo access functionality effects."""

    async def test_demo_user_flag_set_after_grant(
        self, admin_client: AsyncClient, client: AsyncClient
    ):
        """Verify that demo user flag is set correctly after grant."""
        # Create user
        await client.post(
            "/api/auth/register",
            json={"email": "demo_flag@example.com", "password": "Pass123!"},
        )

        # Login as this user
        login_response = await client.post(
            "/api/auth/jwt/login",
            data={"username": "demo_flag@example.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token = login_response.json()["access_token"]

        # Check user profile before demo access
        me_response1 = await client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        user_data1 = me_response1.json()
        # Should not be a demo user initially
        assert user_data1.get("is_demo_user", False) is False

        # Grant demo access
        await admin_client.post(
            "/api/admin/demo-access",
            json={"email": "demo_flag@example.com", "duration_days": 30},
        )

        # Check user profile after demo access
        me_response2 = await client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        user_data2 = me_response2.json()
        # Should now be a demo user
        assert user_data2.get("is_demo_user", False) is True
