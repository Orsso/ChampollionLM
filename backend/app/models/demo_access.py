"""Demo access model for tracking temporary API key sharing."""

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class DemoAccess(Base):
    """Tracks demo access grants for users.
    
    Allows administrators to grant temporary access to the shared Mistral API key.
    """
    __tablename__ = "demo_access"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("user.id", ondelete="CASCADE"), 
        unique=True, 
        nullable=False,
        index=True
    )
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.now(tz=UTC)
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    granted_by: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="demo_access")

    @property
    def is_active(self) -> bool:
        """Check if demo access is currently active."""
        now = datetime.now(tz=UTC)
        # Ensure expires_at is timezone-aware (SQLite may return naive datetime)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        return self.revoked_at is None and expires > now
