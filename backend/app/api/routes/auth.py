from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from mistralai import Mistral

from app.core.auth import auth_backend, current_active_user, fastapi_users, get_user_manager, UserManager
from app.core.security import decrypt_api_key
from app.models import User
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])

router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="",
)
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/jwt",
)


@router.get("/users/me", response_model=UserRead)
async def read_current_user(user: User = Depends(current_active_user)) -> User:
    return user


@router.patch("/users/me", response_model=UserRead)
async def update_current_user(
    payload: UserUpdate,
    user_manager: UserManager = Depends(get_user_manager),
    user: User = Depends(current_active_user),
) -> User:
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return user
    if payload.api_key == "":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="API key cannot be empty")
    updated_user = await user_manager.update(payload, user, safe=True)
    return updated_user


@router.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    user_manager: UserManager = Depends(get_user_manager),
    user: User = Depends(current_active_user),
) -> None:
    await user_manager.delete(user)


@router.post("/test-api-key")
async def test_api_key(user: User = Depends(current_active_user)) -> dict[str, Any]:
    """Test the user's Mistral API key by making a simple API call."""
    if not user.api_key_encrypted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune clé API configurée"
        )

    try:
        api_key = decrypt_api_key(user.api_key_encrypted)
        client = Mistral(api_key=api_key)

        # Make a simple chat completion call to test the key
        response = await client.chat.complete_async(
            model="mistral-small-latest",
            messages=[
                {"role": "user", "content": "Hello"}
            ],
            max_tokens=10,
        )

        # If we get here, the API key works
        return {
            "success": True,
            "message": "Clé API valide et fonctionnelle"
        }

    except Exception as exc:
        error_message = str(exc)

        # Check for common error patterns
        if "401" in error_message or "Unauthorized" in error_message or "Invalid API key" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Clé API invalide ou expirée"
            )
        elif "403" in error_message or "Forbidden" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Accès refusé - vérifiez les permissions de votre clé API"
            )
        elif "429" in error_message or "rate limit" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limite de taux dépassée - réessayez dans quelques instants"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors du test de la clé API: {error_message}"
            )
