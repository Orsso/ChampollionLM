import importlib
import os
from pathlib import Path

import pytest
from httpx import AsyncClient

# Ensure required secrets exist before application modules load
os.environ.setdefault("FERNET_SECRET_KEY", "lI3d9a4d8KX-WA3N8JxKKG2bPZbYQPbQaA-jqvOB0Bo=")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")


@pytest.fixture
async def client(tmp_path) -> AsyncClient:
    db_path = tmp_path / "test.db"
    storage_root = tmp_path / "audio"
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path}"  # FastAPI Users requires persistent DB
    os.environ["AUDIO_STORAGE_ROOT"] = str(storage_root)

    from app.core import settings as settings_module

    settings_module.get_settings.cache_clear()
    settings_module.settings = settings_module.get_settings()

    storage_root.mkdir(parents=True, exist_ok=True)

    # Reload DB session to pick up updated settings
    import app.db.session as db_session
    importlib.reload(db_session)

    import app.db.base as base_module
    importlib.reload(base_module)

    import app.db.init_db as init_db_module
    importlib.reload(init_db_module)
    await init_db_module.init_db()

    import app.api.deps as deps_module
    importlib.reload(deps_module)

    import app.core.auth as auth_module
    importlib.reload(auth_module)

    import app.api.routes.auth as auth_routes_module
    importlib.reload(auth_routes_module)

    import app.main as main_module
    importlib.reload(main_module)

    async with AsyncClient(app=main_module.app, base_url="http://test") as async_client:
        yield async_client


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
