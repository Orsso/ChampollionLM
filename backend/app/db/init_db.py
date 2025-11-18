from app.core.settings import settings
from app.db.base import metadata
from app.db.session import engine


async def init_db() -> None:
    """Initialize database.
    
    In development: create all tables directly.
    In production: use Alembic migrations instead (run scripts/migrate.sh before starting app).
    """
    if settings.environment == "dev":
        async with engine.begin() as conn:
            await conn.run_sync(metadata.create_all)
    # In prod, tables should be created via: alembic upgrade head

