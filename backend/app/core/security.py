from cryptography.fernet import Fernet, InvalidToken

from app.core.settings import settings


fernet = Fernet(settings.fernet_secret_key.get_secret_value())


def encrypt_api_key(raw_key: str) -> str:
    if not raw_key:
        raise ValueError("API key must not be empty")
    return fernet.encrypt(raw_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    try:
        return fernet.decrypt(encrypted_key.encode()).decode()
    except InvalidToken as exc:  # pragma: no cover - defensive guard
        raise ValueError("Invalid encrypted API key") from exc

