"""Admin API routes - protected by superuser authentication."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import fastapi_users
from app.api.deps import get_db_session
from app.models import User
from app.schemas.demo_access import DemoAccessCreate, DemoAccessRead, UserAdminRead
from app.services.demo_access import DemoAccessService


router = APIRouter(prefix="/admin", tags=["admin"])

# Superuser-only dependency
current_superuser = fastapi_users.current_user(active=True, superuser=True)


@router.get("/users", response_model=list[UserAdminRead])
async def list_users(
    _: User = Depends(current_superuser),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict[str, Any]]:
    """List all users with their demo access status."""
    service = DemoAccessService(session)
    users = await service.list_all_users()
    
    result = []
    for user in users:
        demo_data = None
        if user.demo_access:
            demo_data = {
                "id": user.demo_access.id,
                "user_id": user.demo_access.user_id,
                "user_email": user.email,
                "granted_at": user.demo_access.granted_at,
                "expires_at": user.demo_access.expires_at,
                "revoked_at": user.demo_access.revoked_at,
                "granted_by": user.demo_access.granted_by,
                "notes": user.demo_access.notes,
                "is_active": user.demo_access.is_active,
            }
        
        result.append({
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "is_verified": user.is_verified,
            "has_api_key": user.has_api_key,
            "created_at": user.created_at,
            "demo_access": demo_data,
        })
    
    return result


@router.get("/demo-access", response_model=list[DemoAccessRead])
async def list_demo_access(
    _: User = Depends(current_superuser),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict[str, Any]]:
    """List all demo access records."""
    service = DemoAccessService(session)
    records = await service.list_all_demo_access()
    
    return [
        {
            "id": record.id,
            "user_id": record.user_id,
            "user_email": record.user.email,
            "granted_at": record.granted_at,
            "expires_at": record.expires_at,
            "revoked_at": record.revoked_at,
            "granted_by": record.granted_by,
            "notes": record.notes,
            "is_active": record.is_active,
        }
        for record in records
    ]


@router.post("/demo-access", response_model=DemoAccessRead, status_code=status.HTTP_201_CREATED)
async def grant_demo_access(
    payload: DemoAccessCreate,
    admin: User = Depends(current_superuser),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Grant demo access to a user by email."""
    service = DemoAccessService(session)
    
    # Find user by email
    user = await service.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec email '{payload.email}' non trouvé"
        )
    
    # Check if user already has their own API key
    if user.has_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet utilisateur a déjà configuré sa propre clé API"
        )
    
    # Grant access
    demo_access = await service.grant_access(
        user_id=user.id,
        duration_days=payload.duration_days,
        granted_by=admin.email,
        notes=payload.notes,
    )
    
    return {
        "id": demo_access.id,
        "user_id": demo_access.user_id,
        "user_email": user.email,
        "granted_at": demo_access.granted_at,
        "expires_at": demo_access.expires_at,
        "revoked_at": demo_access.revoked_at,
        "granted_by": demo_access.granted_by,
        "notes": demo_access.notes,
        "is_active": demo_access.is_active,
    }


@router.delete("/demo-access/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_demo_access(
    user_id: int,
    _: User = Depends(current_superuser),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    """Revoke demo access for a user."""
    service = DemoAccessService(session)
    
    revoked = await service.revoke_access(user_id)
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun accès demo actif trouvé pour cet utilisateur"
        )
