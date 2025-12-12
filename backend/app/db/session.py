from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.settings import settings


def create_engine() -> AsyncEngine:
    # Build connect_args for asyncpg SSL configuration
    connect_args = {}
    
    # Configure for PostgreSQL + asyncpg
    if "postgresql+asyncpg" in settings.database_url:
        # Disable SSL for internal/pooled connections
        connect_args["ssl"] = False
        # Disable prepared statement cache for Supabase Transaction Pooler (Supavisor)
        # Required because Supavisor in transaction mode doesn't support prepared statements
        connect_args["prepared_statement_cache_size"] = 0
    
    return create_async_engine(
        settings.database_url, 
        future=True, 
        echo=False,
        connect_args=connect_args
    )


engine = create_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session():
    async with AsyncSessionLocal() as session:
        yield session

