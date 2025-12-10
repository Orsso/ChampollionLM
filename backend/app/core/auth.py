from datetime import timedelta

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, IntegerIDMixin, schemas as fs_schemas
from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_user_db
from app.core.security import encrypt_api_key
from app.core.settings import settings
from app.models import User
from app.schemas.user import UserCreate, UserRead, UserUpdate


RESET_PASSWORD_TOKEN_SECRET = "reset-password-token"
VERIFICATION_TOKEN_SECRET = "verification-token"


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.jwt_secret.get_secret_value(),
        lifetime_seconds=settings.jwt_lifetime_seconds,
    )


bearer_transport = BearerTransport(tokenUrl="/auth/jwt/login")

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = settings.jwt_secret.get_secret_value()
    verification_token_secret = settings.jwt_secret.get_secret_value()

    def __init__(self, user_db: SQLAlchemyUserDatabase[User, int]):
        super().__init__(user_db)

    async def create(
        self,
        user_create: UserCreate,
        safe: bool = False,
        request: Request | None = None,
    ) -> User:
        return await super().create(user_create, safe=safe, request=request)

    async def update(
        self,
        user_update: UserUpdate,
        user: User,
        safe: bool = False,
        request: Request | None = None,
    ) -> User:
        payload = user_update.model_dump(exclude_unset=True)
        api_key = payload.pop("api_key", None)
        if api_key is not None:
            user.api_key_encrypted = encrypt_api_key(api_key)
        sanitized_update = fs_schemas.BaseUserUpdate(**payload)
        return await super().update(sanitized_update, user, safe=safe, request=request)


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase[User, int] = Depends(get_user_db),
) -> UserManager:
    yield UserManager(user_db)


fastapi_users = FastAPIUsers[User, int](
    get_user_manager,
    [auth_backend],
)


current_active_user = fastapi_users.current_user(active=True)


async def current_user_with_demo(
    user: User = Depends(current_active_user),
    session: "AsyncSession" = Depends(get_db_session),
) -> User:
    """Get current user with demo_access relationship eagerly loaded.
    
    Use this dependency instead of current_active_user when you need
    to check demo access status (e.g., for API key resolution).
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await session.execute(
        select(User)
        .options(selectinload(User.demo_access))
        .where(User.id == user.id)
    )
    return result.scalar_one()

