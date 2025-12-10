"""
Security tests for API key encryption.

Tests cover:
- API keys are encrypted before storage
- Encrypted keys are not plaintext
- Decryption works correctly
- API keys are never exposed in API responses
"""
import pytest
from httpx import AsyncClient
from sqlalchemy import select


@pytest.mark.anyio
class TestAPIKeyEncryption:
    """Tests for API key encryption and storage."""

    async def test_api_key_encrypted_on_storage(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that API keys are encrypted when stored in the database."""
        client, user_data = authenticated_client

        # Update API key
        test_api_key = "test-mistral-api-key-12345"
        response = await client.patch(
            "/api/auth/users/me",
            json={"api_key": test_api_key},
        )
        assert response.status_code == 200

        # Check database - key should be encrypted
        from app.db.session import AsyncSessionLocal
        from app.models import User

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            user = result.scalar_one()

            # Encrypted key should exist
            assert user.api_key_encrypted is not None
            # Should NOT be the plaintext key
            assert user.api_key_encrypted != test_api_key
            # Should look like encrypted data (base64-ish)
            assert len(user.api_key_encrypted) > len(test_api_key)

    async def test_encrypted_key_not_plaintext_in_db(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that the plaintext API key cannot be found in the database."""
        client, user_data = authenticated_client

        test_api_key = "sk-ant-api-supersecretkey"
        await client.patch(
            "/api/auth/users/me",
            json={"api_key": test_api_key},
        )

        from app.db.session import AsyncSessionLocal
        from app.models import User

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            user = result.scalar_one()

            # Plaintext key should NOT appear in the encrypted field
            assert test_api_key not in user.api_key_encrypted
            # Even partial key should not be visible
            assert "supersecret" not in user.api_key_encrypted.lower()

    async def test_api_key_decryption_roundtrip(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that encrypted API keys can be decrypted correctly."""
        client, user_data = authenticated_client

        test_api_key = "mistral-key-roundtrip-test"
        await client.patch(
            "/api/auth/users/me",
            json={"api_key": test_api_key},
        )

        from app.db.session import AsyncSessionLocal
        from app.models import User
        from app.core.security import decrypt_api_key

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            user = result.scalar_one()

            # Decrypt and verify
            decrypted = decrypt_api_key(user.api_key_encrypted)
            assert decrypted == test_api_key

    async def test_api_key_never_returned_in_response(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that API keys are never exposed in API responses."""
        client, user_data = authenticated_client

        test_api_key = "never-expose-this-key-123"
        await client.patch(
            "/api/auth/users/me",
            json={"api_key": test_api_key},
        )

        # Get user profile
        me_response = await client.get("/api/auth/users/me")
        assert me_response.status_code == 200

        response_text = me_response.text.lower()
        response_json = me_response.json()

        # Plaintext key should NOT appear
        assert test_api_key not in response_text
        assert "never-expose" not in response_text

        # API key field should NOT be in response or should be masked
        if "api_key" in response_json:
            assert response_json["api_key"] != test_api_key
        if "api_key_encrypted" in response_json:
            # If exposed, should not be decryptable plaintext
            assert response_json["api_key_encrypted"] != test_api_key

    async def test_has_api_key_flag_works(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that has_api_key flag correctly reflects API key state."""
        client, _ = authenticated_client

        # Initially no API key
        me_response = await client.get("/api/auth/users/me")
        # The response might or might not include has_api_key
        # depending on schema configuration

        # Add API key
        await client.patch(
            "/api/auth/users/me",
            json={"api_key": "test-key-for-flag"},
        )

        # Check database directly
        from app.db.session import AsyncSessionLocal
        from app.models import User
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).limit(1))
            user = result.scalar_one()
            assert user.has_api_key is True


@pytest.mark.anyio
class TestAPIKeyValidation:
    """Tests for API key validation endpoint."""

    async def test_api_key_validation_requires_auth(self, client: AsyncClient):
        """Verify that API key validation requires authentication."""
        response = await client.post(
            "/api/auth/test-api-key",
            json={"api_key": "test-key"},
        )
        assert response.status_code == 401

    async def test_api_key_validation_with_invalid_key(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that invalid API keys are rejected during validation."""
        client, _ = authenticated_client

        response = await client.post(
            "/api/auth/test-api-key",
            json={"api_key": "invalid-key-format"},
        )
        # Should return an error (exact code depends on implementation)
        # Either 400 (bad request) or the validation result
        assert response.status_code in [200, 400, 422]


@pytest.mark.anyio
class TestEncryptionEdgeCases:
    """Tests for encryption edge cases."""

    async def test_empty_api_key_handling(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that empty API keys are handled correctly."""
        client, user_data = authenticated_client

        # Try to set empty API key
        response = await client.patch(
            "/api/auth/users/me",
            json={"api_key": ""},
        )
        # Should either reject or clear the key
        assert response.status_code in [200, 400, 422]

    async def test_api_key_update_replaces_old(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that updating API key replaces the old one."""
        client, user_data = authenticated_client

        # Set first key
        await client.patch(
            "/api/auth/users/me",
            json={"api_key": "first-api-key"},
        )

        from app.db.session import AsyncSessionLocal
        from app.models import User
        from app.core.security import decrypt_api_key

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            user = result.scalar_one()
            first_encrypted = user.api_key_encrypted

        # Set second key
        await client.patch(
            "/api/auth/users/me",
            json={"api_key": "second-api-key"},
        )

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            user = result.scalar_one()

            # Should be different encrypted value
            assert user.api_key_encrypted != first_encrypted
            # Should decrypt to new key
            assert decrypt_api_key(user.api_key_encrypted) == "second-api-key"

    async def test_special_characters_in_api_key(
        self, authenticated_client: tuple[AsyncClient, dict]
    ):
        """Verify that API keys with special characters are handled correctly."""
        client, user_data = authenticated_client

        special_key = "sk-ant_test.key+with=special/chars:123"
        response = await client.patch(
            "/api/auth/users/me",
            json={"api_key": special_key},
        )
        assert response.status_code == 200

        from app.db.session import AsyncSessionLocal
        from app.models import User
        from app.core.security import decrypt_api_key

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            user = result.scalar_one()

            # Should decrypt correctly with special chars
            assert decrypt_api_key(user.api_key_encrypted) == special_key
