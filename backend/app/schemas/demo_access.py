"""Demo access schemas for API requests/responses."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DemoAccessCreate(BaseModel):
    """Schema for granting demo access."""
    email: EmailStr
    duration_days: int = Field(default=30, ge=1, le=365)
    notes: str | None = None


class DemoAccessRead(BaseModel):
    """Schema for reading demo access data."""
    id: int
    user_id: int
    user_email: str
    granted_at: datetime
    expires_at: datetime
    revoked_at: datetime | None
    granted_by: str
    notes: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UserAdminRead(BaseModel):
    """Schema for admin view of users."""
    id: int
    email: str
    is_active: bool
    is_superuser: bool
    is_verified: bool
    has_api_key: bool
    created_at: datetime
    demo_access: DemoAccessRead | None = None

    model_config = ConfigDict(from_attributes=True)
