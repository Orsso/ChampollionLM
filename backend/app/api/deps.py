from typing import AsyncGenerator

from fastapi import Depends
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models import User
from app.services.file import FileService
from app.services.processing_job import ProcessingJobService
from app.services.generation_job import GenerationJobService
from app.services.projects import ProjectService


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


async def get_user_db(
    session: AsyncSession = Depends(get_db_session),
) -> AsyncGenerator[SQLAlchemyUserDatabase[User, int], None]:
    yield SQLAlchemyUserDatabase(session, User)


def get_processing_job_service(
    session: AsyncSession = Depends(get_db_session),
) -> ProcessingJobService:
    """Dependency for ProcessingJobService."""
    return ProcessingJobService(session)


def get_generation_job_service(
    session: AsyncSession = Depends(get_db_session),
) -> GenerationJobService:
    """Dependency for GenerationJobService."""
    return GenerationJobService(session)


def get_file_service() -> FileService:
    """Dependency for FileService (file I/O operations)."""
    return FileService()

