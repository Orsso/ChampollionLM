"""
Pytest configuration and fixtures for Champollion backend tests.

This module provides reusable fixtures for:
- Database setup with isolated test databases
- Authenticated and admin client fixtures
- Factory setup for test data generation
"""
import importlib
import os
import sys
from pathlib import Path
from typing import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

# Ensure required secrets exist before application modules load
os.environ.setdefault("FERNET_SECRET_KEY", "lI3d9a4d8KX-WA3N8JxKKG2bPZbYQPbQaA-jqvOB0Bo=")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-testing-only")
os.environ.setdefault("DEMO_MISTRAL_API_KEY", "")  # Empty for tests


def cleanup_mock_modules():
    """Remove any mock modules injected by other tests (e.g., test_youtube_processor)."""
    mock_module_keys = [k for k in sys.modules.keys() if 'base_processor' in k or 'youtube_processor' in k]
    for key in mock_module_keys:
        del sys.modules[key]


def reload_app_modules():
    """Reload all application modules to pick up test settings."""
    # First, clean up any mock modules from other tests
    cleanup_mock_modules()

    from app.core import settings as settings_module
    settings_module.get_settings.cache_clear()
    settings_module.settings = settings_module.get_settings()

    import app.db.session as db_session
    importlib.reload(db_session)

    import app.db.base as base_module
    importlib.reload(base_module)

    import app.db.init_db as init_db_module
    importlib.reload(init_db_module)

    import app.api.deps as deps_module
    importlib.reload(deps_module)

    import app.core.auth as auth_module
    importlib.reload(auth_module)

    import app.api.routes.auth as auth_routes_module
    importlib.reload(auth_routes_module)

    import app.main as main_module
    importlib.reload(main_module)

    return init_db_module, main_module


@pytest.fixture
async def client(tmp_path) -> AsyncGenerator[AsyncClient, None]:
    """
    Provide an async HTTP client for testing API endpoints.

    Creates an isolated test database and reloads the app with test settings.
    """
    db_path = tmp_path / "test.db"
    storage_root = tmp_path / "audio"
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path}"
    os.environ["AUDIO_STORAGE_ROOT"] = str(storage_root)

    storage_root.mkdir(parents=True, exist_ok=True)

    init_db_module, main_module = reload_app_modules()
    await init_db_module.init_db()

    transport = ASGITransport(app=main_module.app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client
    
    # Teardown: ensure database connections are closed
    from app.db.session import engine
    await engine.dispose()


@pytest.fixture
async def authenticated_client(client: AsyncClient) -> AsyncGenerator[tuple[AsyncClient, dict], None]:
    """
    Provide an authenticated client with a registered user.

    Returns:
        Tuple of (client with auth header, user data dict)
    """
    # Register user
    register_response = await client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "TestPassword123!"},
    )
    assert register_response.status_code == 201, f"Registration failed: {register_response.text}"

    # Login to get token
    login_response = await client.post(
        "/api/auth/jwt/login",
        data={"username": "test@example.com", "password": "TestPassword123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"

    token_data = login_response.json()
    token = token_data["access_token"]

    # Set auth header on client
    client.headers["Authorization"] = f"Bearer {token}"

    # Get user data
    me_response = await client.get("/api/auth/users/me")
    user_data = me_response.json()

    yield client, user_data


@pytest.fixture
async def admin_client(client: AsyncClient) -> AsyncGenerator[AsyncClient, None]:
    """
    Provide an authenticated client with superuser privileges.

    Creates a superuser directly in the database for admin route testing.
    """
    from app.db.session import AsyncSessionLocal
    from app.models import User
    from passlib.hash import argon2

    # Create superuser directly in database
    async with AsyncSessionLocal() as session:
        admin_user = User(
            email="admin@example.com",
            hashed_password=argon2.hash("AdminPassword123!"),
            is_active=True,
            is_superuser=True,
            is_verified=True,
        )
        session.add(admin_user)
        await session.commit()

    # Login as admin
    login_response = await client.post(
        "/api/auth/jwt/login",
        data={"username": "admin@example.com", "password": "AdminPassword123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"

    token = login_response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"

    yield client


@pytest.fixture
async def project_with_source(authenticated_client: tuple[AsyncClient, dict]) -> AsyncGenerator[tuple[AsyncClient, dict, dict], None]:
    """
    Provide an authenticated client with a project containing a document source.

    Returns:
        Tuple of (authenticated client, user data, project data with source)
    """
    client, user_data = authenticated_client

    # Create project
    project_response = await client.post(
        "/api/projects",
        json={"title": "Test Project", "description": "A test project"},
    )
    assert project_response.status_code == 201, f"Project creation failed: {project_response.text}"
    project_data = project_response.json()

    # Add document source
    source_response = await client.post(
        f"/api/projects/{project_data['id']}/sources",
        json={
            "type": "document",
            "title": "Test Document",
            "content": "# Test Content\n\nThis is test content for document generation.",
        },
    )
    assert source_response.status_code == 201, f"Source creation failed: {source_response.text}"

    project_data["source"] = source_response.json()

    yield client, user_data, project_data


@pytest.fixture
def anyio_backend() -> str:
    """Configure anyio backend for async tests."""
    return "asyncio"


@pytest.fixture
def sample_audio_file(tmp_path) -> Path:
    """
    Create a minimal valid MP3 file for testing audio uploads.

    Returns:
        Path to the test MP3 file
    """
    import struct

    mp3_path = tmp_path / "test_audio.mp3"

    # Create minimal MP3 with ID3v2 header and silent MP3 frame
    with open(mp3_path, "wb") as f:
        # ID3v2 header (10 bytes)
        f.write(b"ID3")  # ID3 identifier
        f.write(struct.pack(">BBB", 4, 0, 0))  # Version 2.4.0, flags
        f.write(struct.pack(">I", 0))  # Size (0 for empty tag)

        # Minimal MP3 frame header (MPEG Audio Layer 3)
        # Frame sync (11 bits = 1), version (00 = MPEG 2.5), layer (01 = Layer 3)
        # CRC (1 = no CRC), bitrate (1001 = 64kbps for MPEG2.5 L3)
        # Sample rate (00 = 11025 Hz for MPEG2.5), padding, private, channel mode, etc.
        f.write(bytes([0xFF, 0xE3, 0x18, 0x00]))  # Simplified valid frame header

        # Add some padding to make it a reasonable file size
        f.write(b'\x00' * 1000)

    return mp3_path


@pytest.fixture
def sample_webm_file(tmp_path) -> Path:
    """
    Create a minimal WebM file for testing format conversion.

    Returns:
        Path to the test WebM file
    """
    webm_path = tmp_path / "test_audio.webm"

    # Create a minimal WebM/EBML header
    # This is just enough to be recognized as WebM but won't play
    with open(webm_path, "wb") as f:
        # EBML header
        f.write(bytes([0x1A, 0x45, 0xDF, 0xA3]))  # EBML element ID
        f.write(bytes([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F]))  # Size
        f.write(bytes([0x42, 0x86, 0x81, 0x01]))  # EBMLVersion = 1
        f.write(bytes([0x42, 0xF7, 0x81, 0x01]))  # EBMLReadVersion = 1
        f.write(bytes([0x42, 0xF2, 0x81, 0x04]))  # EBMLMaxIDLength = 4
        f.write(bytes([0x42, 0xF3, 0x81, 0x08]))  # EBMLMaxSizeLength = 8
        f.write(bytes([0x42, 0x82, 0x84]))  # DocType
        f.write(b"webm")  # DocType value
        f.write(bytes([0x42, 0x87, 0x81, 0x02]))  # DocTypeVersion = 2
        f.write(bytes([0x42, 0x85, 0x81, 0x02]))  # DocTypeReadVersion = 2

        # Add padding
        f.write(b'\x00' * 500)

    return webm_path
