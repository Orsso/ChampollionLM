import pytest
from httpx import AsyncClient
from sqlalchemy import select


@pytest.mark.anyio
async def test_register_and_login(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "strongpassword"},
    )
    assert response.status_code == 201

    login_response = await client.post(
        "/auth/jwt/login",
        data={"username": "user@example.com", "password": "strongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200
    payload = login_response.json()
    assert "access_token" in payload
    assert payload["token_type"] == "bearer"

    token = payload["access_token"]
    me_response = await client.get(
        "/auth/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    user_data = me_response.json()
    assert user_data["email"] == "user@example.com"


@pytest.mark.anyio
async def test_update_api_key_encrypted(client: AsyncClient):
    register = await client.post(
        "/auth/register",
        json={"email": "api@example.com", "password": "strongpassword"},
    )
    assert register.status_code == 201

    login = await client.post(
        "/auth/jwt/login",
        data={"username": "api@example.com", "password": "strongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = login.json()["access_token"]

    update_response = await client.patch(
        "/auth/users/me",
        json={"api_key": "test-key"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert update_response.status_code == 200

    me_response = await client.get(
        "/auth/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "api@example.com"

    from app.models import User
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "api@example.com"))
        user = result.scalar_one()
        assert user.api_key_encrypted is not None
        assert "test-key" not in user.api_key_encrypted


