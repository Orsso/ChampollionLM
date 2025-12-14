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


def get_effective_api_key_sync(user: User) -> str | None:
    """Synchronous version that checks user.demo_access relationship.

    NOTE: Requires user.demo_access to be loaded (eager or lazy).
    When used with current_user_with_demo dependency, this is safe.

    Args:
        user: The user to get API key for

    Returns:
        Decrypted API key string, or None if no key available
    """
    # Priority 1: User's own API key
    if user.api_key_encrypted:
        try:
            return decrypt_api_key(user.api_key_encrypted)
        except ValueError:
            logger.warning("Failed to decrypt API key for user %d", user.id)

    # Priority 2: Demo shared API key
    if settings.demo_mistral_api_key:
        # Accessing .demo_access here is safe ONLY if eagerly loaded
        # or if we are in a sync session context (which we aren't).
        # The dependency current_user_with_demo ensures it is loaded.
        demo_access = getattr(user, "demo_access", None)
        if demo_access and demo_access.is_active:
            logger.debug("Using demo API key for user %d", user.id)
            return settings.demo_mistral_api_key.get_secret_value()
    else:
        logger.debug("DEMO_MISTRAL_API_KEY not configured")

    return None
