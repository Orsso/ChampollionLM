# Champollion — API Key Encryption Strategy

**Version:** 2.1  
**Dernière mise à jour:** Novembre 2025

> Voir aussi: [ARCHITECTURE.md](ARCHITECTURE.md#sécurité) pour l'architecture sécurité complète.

## Références
- [Cryptography — Fernet documentation](https://cryptography.io/en/latest/fernet/)
- [FastAPI settings management](https://fastapi.tiangolo.com/advanced/settings/)
- [Pydantic Settings — `SecretStr`](https://docs.pydantic.dev/latest/concepts/settings/#secret-support)

## Objectifs
1. Stocker les clés API Mistral saisies par l'utilisateur de manière chiffrée côté backend.
2. Empêcher toute exposition en clair en base, en logs ou vers le client.
3. Maintenir une mise en œuvre simple (KISS/DRY/YAGNI) compatible avec un déploiement local.

## Key Management Design

### Secret Key Generation & Storage
- Générer une clé Fernet unique (`Fernet.generate_key()`) et la stocker hors code source :
  - Fichier `.env` (non versionné) ou variable d'environnement `FERNET_SECRET_KEY`.
  - Référence doc FastAPI Settings pour chargement : [FastAPI Settings Management](https://fastapi.tiangolo.com/advanced/settings/).
- Clé Fernet au format base64 (type `bytes`) : exemple `FERNET_SECRET_KEY=3v4...`.
- `FERNET_SECRET_KEY` n'est jamais loggée ; utilisée uniquement pour initialiser `Fernet` au démarrage.

### Settings Module (Pydantic `BaseSettings`)
```
# settings.py
from pydantic_settings import BaseSettings
from pydantic import SecretStr

class AppSettings(BaseSettings):
    fernet_secret_key: SecretStr

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }

settings = AppSettings()
```
- Utiliser `SecretStr` pour éviter que la clé soit affichée en clair lorsque l'objet settings est représenté en string.
- Doc Pydantic Settings : [Secret Support](https://docs.pydantic.dev/latest/concepts/settings/#secret-support).

### Encryption/Decryption Utility
```
# security.py
from cryptography.fernet import Fernet
from app.settings import settings

fernet = Fernet(settings.fernet_secret_key.get_secret_value())

def encrypt_api_key(raw_key: str) -> str:
    return fernet.encrypt(raw_key.encode()).decode()

def decrypt_api_key(encrypted_key: str) -> str:
    return fernet.decrypt(encrypted_key.encode()).decode()
```
- Basé sur la doc officielle cryptography — `Fernet.encrypt()`/`decrypt()` attendent des bytes et renvoient des bytes.
- Fonctions centralisées pour respecter DRY.

## Persistence Workflow
1. **Saisie** : l'utilisateur envoie sa clé via un endpoint authentifié (`PATCH /users/me/api-key`).
2. **Traitement** :
   - Backend valide (clé non vide), appelle `encrypt_api_key`.
   - Résultat stocké dans `User.api_key_encrypted` (champ TEXT).
3. **Utilisation** :
   - Lors d'un appel STT/LLM, récupérer `user.api_key_encrypted`, utiliser `decrypt_api_key` pour obtenir la clé en mémoire.
   - La clé en clair n'est jamais persistée, uniquement utilisée pour la requête courante.
4. **Logs** : ne jamais logger la clé, même chiffrée.

## Rotation & Lifecycle
- MVP : pas de rotation automatique (YAGNI). Si la clé doit être changée, l'utilisateur soumet une nouvelle clé (qui écrase l'ancienne en base).
- Sauvegarder le secret `.env` de manière sécurisée (backup manuel si besoin, usage personnel).
- Pour invalider toutes les clés, régénérer `FERNET_SECRET_KEY`, mettre à jour `.env`, supprimer les clés existantes (les utilisateurs devront les ressaisir).

## Error Handling & Validation
- Sur `encrypt_api_key` / `decrypt_api_key`, capturer `InvalidToken` (`cryptography.fernet.InvalidToken`) pour gérer les cas de corruption.
- Endpoints doivent retourner une erreur 400 si la clé fournie est vide ou invalide.
- Tests unitaires (planifiés en T12) couvriront chiffrement/déchiffrement avec clé valide et token invalide.

## Summary
- Chiffrement symétrique Fernet (AES128 + HMAC) fournit confidentialité et intégrité ([Cryptography docs](https://cryptography.io/en/latest/fernet/)).
- Clé secrète chargée via `BaseSettings` Pydantic (`SecretStr`).
- Implémentation minimale, aucune dépendance externe supplémentaire.

---

**Voir aussi:**
- [ARCHITECTURE.md](ARCHITECTURE.md#sécurité) - Architecture sécurité complète
- [environment_requirements.md](environment_requirements.md) - Configuration variables d'environnement
- [DEVELOPMENT.md](DEVELOPMENT.md#setup-environnement) - Guide génération secrets

