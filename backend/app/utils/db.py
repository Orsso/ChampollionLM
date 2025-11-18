"""Database operation utilities."""
from sqlalchemy.ext.asyncio import AsyncSession


async def save_and_refresh(session: AsyncSession, entity):
    """
    Add entity to session, commit, and refresh.

    This utility consolidates the common pattern of adding an entity,
    committing the transaction, and refreshing to load any DB-generated
    values (like auto-increment IDs, timestamps, etc.).

    Args:
        session: Database session
        entity: SQLAlchemy model instance to persist

    Returns:
        The refreshed entity with all DB-generated values populated
    """
    session.add(entity)
    await session.commit()
    await session.refresh(entity)
    return entity
