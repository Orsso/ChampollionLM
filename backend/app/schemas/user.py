from datetime import datetime

from fastapi_users import schemas
from pydantic import ConfigDict, EmailStr, Field, computed_field


class UserRead(schemas.BaseUser[int]):
    created_at: datetime
    api_key_encrypted: str | None = Field(default=None, exclude=True)
    
    # Demo access fields - populated from relationship
    is_demo_user: bool = False
    demo_expires_at: datetime | None = None

    @computed_field
    @property
    def has_api_key(self) -> bool:
        return self.api_key_encrypted is not None and self.api_key_encrypted != ""

    model_config = ConfigDict(from_attributes=True)


class UserCreate(schemas.BaseUserCreate):
    email: EmailStr
    password: str

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(schemas.BaseUserUpdate):
    email: EmailStr | None = None
    password: str | None = None
    api_key: str | None = Field(default=None, min_length=1)

    model_config = ConfigDict(from_attributes=True)

