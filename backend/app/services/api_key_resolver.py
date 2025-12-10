"""API key resolver for determining which API key to use for a user."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decrypt_api_key
from app.core.settings import settings
from app.models import User
from app.services.demo_access import DemoAccessService


logger = logging.getLogger(__name__)


async def get_effective_api_key(user: User, session: AsyncSession) -> str | None:
    """Get the effective API key for a user.
    
    Resolution order:
    1. User's own encrypted API key (highest priority)
    2. Demo shared API key (if user has active demo access)
    3. None (no API key available)
    
    Args:
        user: The user to get API key for
        session: Database session for checking demo access
        
    Returns:
        Decrypted API key string, or None if no key available
    """
    # Priority 1: User's own API key
    if user.api_key_encrypted:
        try:
            return decrypt_api_key(user.api_key_encrypted)
        except ValueError:
            logger.warning(f"Failed to decrypt API key for user {user.id}")
    
    # Priority 2: Demo shared API key
    if settings.demo_mistral_api_key:
        demo_service = DemoAccessService(session)
        if await demo_service.is_demo_active(user.id):
            logger.debug(f"Using demo API key for user {user.id}")
            return settings.demo_mistral_api_key.get_secret_value()
    
    return None


def get_effective_api_key_sync(user: User, has_active_demo: bool) -> str | None:
    """Synchronous version for contexts where async is not available.
    
    Use this when you've already checked demo access status.
    
    Args:
        user: The user to get API key for
        has_active_demo: Whether user has active demo access
        
    Returns:
        Decrypted API key string, or None if no key available
    """
    # Priority 1: User's own API key
    if user.api_key_encrypted:
        try:
            return decrypt_api_key(user.api_key_encrypted)
        except ValueError:
            logger.warning(f"Failed to decrypt API key for user {user.id}")
    
    # Priority 2: Demo shared API key
    if has_active_demo and settings.demo_mistral_api_key:
        return settings.demo_mistral_api_key.get_secret_value()
    
    return None
