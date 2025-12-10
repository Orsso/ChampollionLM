"""Demo access service for managing demo API key grants."""

from datetime import UTC, datetime, timedelta
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import DemoAccess, User


logger = logging.getLogger(__name__)


class DemoAccessService:
    """Service for managing demo access grants."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def grant_access(
        self,
        user_id: int,
        duration_days: int,
        granted_by: str,
        notes: str | None = None,
    ) -> DemoAccess:
        """Grant demo access to a user.
        
        If user already has demo access, update it (un-revoke and extend).
        
        Args:
            user_id: ID of the user to grant access to
            duration_days: Number of days the access is valid
            granted_by: Email of the admin granting access
            notes: Optional notes about this grant
            
        Returns:
            The created or updated DemoAccess record
        """
        now = datetime.now(tz=UTC)
        expires_at = now + timedelta(days=duration_days)

        # Check if user already has demo access
        existing = await self.get_demo_access_by_user_id(user_id)
        
        if existing:
            # Update existing record
            existing.granted_at = now
            existing.expires_at = expires_at
            existing.revoked_at = None
            existing.granted_by = granted_by
            existing.notes = notes
            await self.session.commit()
            await self.session.refresh(existing)
            logger.info(f"Updated demo access for user {user_id}, expires {expires_at}")
            return existing
        
        # Create new record
        demo_access = DemoAccess(
            user_id=user_id,
            granted_at=now,
            expires_at=expires_at,
            granted_by=granted_by,
            notes=notes,
        )
        self.session.add(demo_access)
        await self.session.commit()
        await self.session.refresh(demo_access)
        logger.info(f"Granted demo access to user {user_id}, expires {expires_at}")
        return demo_access

    async def revoke_access(self, user_id: int) -> bool:
        """Revoke demo access for a user.
        
        Args:
            user_id: ID of the user to revoke access from
            
        Returns:
            True if access was revoked, False if no active access found
        """
        demo_access = await self.get_demo_access_by_user_id(user_id)
        
        if not demo_access or demo_access.revoked_at is not None:
            return False
        
        demo_access.revoked_at = datetime.now(tz=UTC)
        await self.session.commit()
        logger.info(f"Revoked demo access for user {user_id}")
        return True

    async def get_demo_access_by_user_id(self, user_id: int) -> DemoAccess | None:
        """Get demo access record for a user."""
        result = await self.session.execute(
            select(DemoAccess).where(DemoAccess.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_active_demo_access(self, user_id: int) -> DemoAccess | None:
        """Get active demo access for a user.
        
        Returns None if user has no demo access or if it's expired/revoked.
        """
        demo_access = await self.get_demo_access_by_user_id(user_id)
        
        if demo_access and demo_access.is_active:
            return demo_access
        return None

    async def is_demo_active(self, user_id: int) -> bool:
        """Check if user has active demo access."""
        demo_access = await self.get_active_demo_access(user_id)
        return demo_access is not None

    async def list_all_demo_access(self) -> list[DemoAccess]:
        """List all demo access records with user info."""
        result = await self.session.execute(
            select(DemoAccess)
            .options(joinedload(DemoAccess.user))
            .order_by(DemoAccess.granted_at.desc())
        )
        return list(result.scalars().all())

    async def get_user_by_email(self, email: str) -> User | None:
        """Get user by email (helper for admin operations)."""
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def list_all_users(self) -> list[User]:
        """List all users with their demo access info."""
        result = await self.session.execute(
            select(User)
            .options(joinedload(User.demo_access))
            .order_by(User.created_at.desc())
        )
        return list(result.unique().scalars().all())
