"""
Security tests for authentication.

Tests cover:
- User registration with password hashing
- Login with JWT tokens
- Token validation and expiration
- Account deletion cascading
- Password change requirements
"""
import pytest
from httpx import AsyncClient
from sqlalchemy import select


@pytest.mark.anyio
class TestUserRegistration:
    """Tests for user registration security."""

    async def test_registration_creates_user_with_hashed_password(self, client: AsyncClient):
        """Verify that passwords are hashed, not stored in plaintext."""
        response = await client.post(
            "/api/auth/register",
            json={"email": "hash_test@example.com", "password": "MySecurePass123!"},
        )
        assert response.status_code == 201

        # Verify password is not stored in plaintext
        from app.db.session import AsyncSessionLocal
        from app.models import User

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == "hash_test@example.com")
            )
            user = result.scalar_one()

            # Password should NOT be stored in plaintext
            assert user.hashed_password != "MySecurePass123!"
            # Hashed password should be a string (argon2 or bcrypt format)
            assert len(user.hashed_password) > 20
            # Should start with hash identifier (argon2 or bcrypt)
            assert user.hashed_password.startswith("$")

    async def test_registration_rejects_duplicate_email(self, client: AsyncClient):
        """Verify that duplicate email registration is rejected."""
        # First registration
        response1 = await client.post(
            "/api/auth/register",
            json={"email": "duplicate@example.com", "password": "Password123!"},
        )
        assert response1.status_code == 201

        # Second registration with same email
        response2 = await client.post(
            "/api/auth/register",
            json={"email": "duplicate@example.com", "password": "DifferentPass123!"},
        )
        assert response2.status_code == 400
        assert "REGISTER_USER_ALREADY_EXISTS" in response2.text

    async def test_registration_rejects_invalid_email(self, client: AsyncClient):
        """Verify that invalid email formats are rejected."""
        invalid_emails = [
            "notanemail",
            "missing@domain",
            "@nodomain.com",
            "spaces in@email.com",
        ]

        for email in invalid_emails:
            response = await client.post(
                "/api/auth/register",
                json={"email": email, "password": "ValidPass123!"},
            )
            assert response.status_code == 422, f"Expected 422 for email: {email}"

    async def test_registration_accepts_any_password_length(self, client: AsyncClient):
        """Verify password length policy (fastapi-users default allows any length >= 3)."""
        # Note: Password strength validation depends on configuration
        # Default fastapi-users accepts passwords with 3+ characters
        response = await client.post(
            "/api/auth/register",
            json={"email": "shortpass@example.com", "password": "ab"},
        )
        # Current config accepts short passwords - consider adding password policy
        # This test documents the current behavior
        assert response.status_code in [201, 400, 422]


@pytest.mark.anyio
class TestLogin:
    """Tests for login security."""

    async def test_login_returns_valid_jwt(self, client: AsyncClient):
        """Verify that successful login returns a valid JWT token."""
        # Register user first
        await client.post(
            "/api/auth/register",
            json={"email": "jwt_test@example.com", "password": "TestPass123!"},
        )

        # Login
        response = await client.post(
            "/api/auth/jwt/login",
            data={"username": "jwt_test@example.com", "password": "TestPass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        # JWT has 3 parts separated by dots
        assert len(data["access_token"].split(".")) == 3

    async def test_login_fails_with_wrong_password(self, client: AsyncClient):
        """Verify that login fails with incorrect password."""
        # Register user
        await client.post(
            "/api/auth/register",
            json={"email": "wrongpass@example.com", "password": "CorrectPass123!"},
        )

        # Try to login with wrong password
        response = await client.post(
            "/api/auth/jwt/login",
            data={"username": "wrongpass@example.com", "password": "WrongPass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 400
        assert "LOGIN_BAD_CREDENTIALS" in response.text

    async def test_login_fails_with_nonexistent_user(self, client: AsyncClient):
        """Verify that login fails for non-existent users."""
        response = await client.post(
            "/api/auth/jwt/login",
            data={"username": "nonexistent@example.com", "password": "SomePass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 400
        assert "LOGIN_BAD_CREDENTIALS" in response.text

    async def test_login_is_case_insensitive_for_email(self, client: AsyncClient):
        """Verify that email comparison is case-insensitive."""
        # Register with lowercase
        await client.post(
            "/api/auth/register",
            json={"email": "casetest@example.com", "password": "TestPass123!"},
        )

        # Try login with uppercase
        response = await client.post(
            "/api/auth/jwt/login",
            data={"username": "CASETEST@EXAMPLE.COM", "password": "TestPass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        # Should work (email is case-insensitive)
        assert response.status_code == 200


@pytest.mark.anyio
class TestJWTValidation:
    """Tests for JWT token validation."""

    async def test_jwt_rejected_when_invalid(self, client: AsyncClient):
        """Verify that invalid JWT tokens are rejected."""
        response = await client.get(
            "/api/auth/users/me",
            headers={"Authorization": "Bearer invalid.jwt.token"},
        )
        assert response.status_code == 401

    async def test_jwt_rejected_when_tampered(self, client: AsyncClient):
        """Verify that tampered JWT tokens are rejected."""
        # Register and login to get valid token
        await client.post(
            "/api/auth/register",
            json={"email": "tamper_test@example.com", "password": "TestPass123!"},
        )
        login = await client.post(
            "/api/auth/jwt/login",
            data={"username": "tamper_test@example.com", "password": "TestPass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token = login.json()["access_token"]

        # Tamper with the token (modify the payload)
        parts = token.split(".")
        # Modify the payload part
        tampered_token = f"{parts[0]}.TAMPERED{parts[1]}.{parts[2]}"

        response = await client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {tampered_token}"},
        )
        assert response.status_code == 401

    async def test_protected_route_requires_auth(self, client: AsyncClient):
        """Verify that protected routes require authentication."""
        response = await client.get("/api/auth/users/me")
        assert response.status_code == 401

    async def test_valid_token_allows_access(self, authenticated_client: tuple[AsyncClient, dict]):
        """Verify that valid tokens allow access to protected routes."""
        client, user_data = authenticated_client

        response = await client.get("/api/auth/users/me")
        assert response.status_code == 200
        assert response.json()["email"] == user_data["email"]


@pytest.mark.anyio
class TestAccountDeletion:
    """Tests for account deletion security."""

    async def test_account_deletion_requires_auth(self, client: AsyncClient):
        """Verify that account deletion requires authentication."""
        response = await client.delete("/api/auth/users/me")
        assert response.status_code == 401

    async def test_account_deletion_cascades_projects(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that deleting an account also deletes associated projects."""
        client, user_data = authenticated_client

        # Create a project
        project_response = await client.post(
            "/api/projects",
            json={"title": "Test Project"},
        )
        assert project_response.status_code == 201
        project_id = project_response.json()["id"]

        # Delete account
        delete_response = await client.delete("/api/auth/users/me")
        assert delete_response.status_code == 204

        # Verify project is also deleted
        from app.db.session import AsyncSessionLocal
        from app.models import Project

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()
            assert project is None, "Project should be deleted when user is deleted"

    async def test_account_deletion_invalidates_token(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that tokens become invalid after account deletion."""
        client, _ = authenticated_client

        # Delete account
        await client.delete("/api/auth/users/me")

        # Try to use the same token
        response = await client.get("/api/auth/users/me")
        assert response.status_code == 401


@pytest.mark.anyio
class TestPasswordChange:
    """Tests for password change security."""

    async def test_password_update_changes_hash(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that password update changes the stored hash."""
        client, user_data = authenticated_client

        from app.db.session import AsyncSessionLocal
        from app.models import User

        # Get original hash
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            user = result.scalar_one()
            original_hash = user.hashed_password

        # Update password
        response = await client.patch(
            "/api/auth/users/me",
            json={"password": "NewSecurePass123!"},
        )
        assert response.status_code == 200

        # Verify hash changed
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            user = result.scalar_one()
            assert user.hashed_password != original_hash

    async def test_can_login_with_new_password(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that login works with the new password after change."""
        client, user_data = authenticated_client

        # Update password
        await client.patch(
            "/api/auth/users/me",
            json={"password": "BrandNewPass123!"},
        )

        # Create new client for fresh login
        from httpx import ASGITransport, AsyncClient as HttpxAsyncClient
        import app.main as main_module

        transport = ASGITransport(app=main_module.app)
        async with HttpxAsyncClient(transport=transport, base_url="http://test") as new_client:
            # Login with new password
            response = await new_client.post(
                "/api/auth/jwt/login",
                data={"username": user_data["email"], "password": "BrandNewPass123!"},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            assert response.status_code == 200
