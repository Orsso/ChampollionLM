from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.settings import settings


def create_engine() -> AsyncEngine:
    # Build connect_args for asyncpg SSL configuration
    connect_args = {}
    
    # Disable SSL for Fly.io internal connections (private network)
    if "postgresql+asyncpg" in settings.database_url:
        connect_args["ssl"] = False
    
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

