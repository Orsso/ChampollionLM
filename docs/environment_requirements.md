# Exigences d'environnement et dépendances - Champollion

**Version:** 2.1  
**Dernière mise à jour:** Novembre 2025

> Voir aussi: [DEVELOPMENT.md](DEVELOPMENT.md) pour le guide de setup complet.

---

| Composant | Version minimale recommandée | Justification / Référence |
|-----------|----------------------------|---------------------------|
| Python | 3.13+ | Version actuelle utilisée dans le projet. [Python Status](https://devguide.python.org/versions/) |
| FastAPI | 0.100+ | Framework principal du backend, version stable pour production. [FastAPI Docs](https://fastapi.tiangolo.com/deployment/versions/) |
| SQLAlchemy | 2.0.14+ | ORM utilisé avec async support. [SQLAlchemy Docs](https://docs.sqlalchemy.org/) |
| SQLite | 3.35+ | Base de données intégrée pour stockage local, version supportée par SQLAlchemy 2.0+. [SQLite Downloads](https://www.sqlite.org/download.html) |
| Node.js | 25+ | Version utilisée dans le projet. [Node.js Releases](https://nodejs.org/en/about/previous-releases) |
| React | 19.1+ | Version utilisée dans le projet. [React v19](https://react.dev/) |
| Vite | 5+ | Outil de build frontend. [Vite Releases](https://vite.dev/releases) |
| react-hook-form | 7.60+ | Gestion des formulaires React. [react-hook-form npm](https://www.npmjs.com/package/react-hook-form) |
| SWR | 2.2+ | Fetch de données React avec cache. [SWR Docs](https://swr.vercel.app/) |
| GSAP | 3.12+ | Animation library pour UI. [GSAP Docs](https://greensock.com/gsap/) |
| TailwindCSS | 3.4+ | Framework CSS utility-first. [Tailwind Docs](https://tailwindcss.com/) |
| fastapi-users | 14.0+ | Auth JWT avec email/password, requiert Python 3.9+. [fastapi-users PyPI](https://pypi.org/project/fastapi-users/) |
| cryptography | 44.0+ | Chiffrement Fernet pour clés API, support Python 3.8+. [Cryptography Docs](https://cryptography.io/) |
| pytest | 8.4+ | Tests backend, requiert Python 3.9+ depuis EOL Python 3.8. [pytest PyPI](https://pypi.org/project/pytest/) |
| httpx | 0.28+ | Client HTTP pour appels API externes (STT/LLM). [HTTPX Docs](https://www.python-httpx.org/) |
| BackgroundTasks | Intégré FastAPI | Tâches asynchrones pour transcription/génération notes. [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/) |
| Pandoc | 3.0+ | Convertisseur de documents pour export PDF des notes. [Pandoc](https://pandoc.org/) |
| FFmpeg | 6.0+ | Conversion audio (WebM/Opus → WAV mono 16 kHz) et segmentation si besoin. Requis côté backend pour la transcription fiable. [FFmpeg](https://ffmpeg.org/) |
| TeX Live (xelatex) | 2020+ | Moteur LaTeX avec support Unicode pour génération PDF via Pandoc. Paquets requis: `texlive-basic`, `texlive-latex`, `texlive-xetex`, `texlive-fontsrecommended`, `texlive-pictures`, `texlive-latexextra` (Arch) ou équivalents. [TeX Live](https://www.tug.org/texlive/) |

---

## Variables d'Environnement

### Backend (.env)

**Sécurité:**
```env
FERNET_SECRET_KEY=<base64-fernet-key>
JWT_SECRET=<random-secret>
JWT_LIFETIME_SECONDS=3600
```

**Base de données:**
```env
DATABASE_URL=sqlite+aiosqlite:///./champollion.db
```

**Stockage:**
```env
FILE_STORAGE_ROOT=./storage/files
MAX_AUDIO_BYTES=524288000
MAX_AUDIO_DURATION_SECONDS=7200
```

**Environnement:**
```env
ENVIRONMENT=dev
LOG_LEVEL=INFO
```

**CORS (production uniquement):**
```env
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Génération des Secrets

**Fernet Key:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**JWT Secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Installation Système

### macOS
```bash
brew install python@3.13 node@25 ffmpeg pandoc
brew install --cask mactex  # Pour PDF export
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install python3.13 python3.13-venv ffmpeg pandoc
# Node.js 25+ via NodeSource
curl -fsSL https://deb.nodesource.com/setup_25.x | sudo -E bash -
sudo apt install -y nodejs
sudo apt install texlive-xetex texlive-fonts-recommended texlive-latex-extra
```

### Arch Linux
```bash
sudo pacman -S python nodejs npm ffmpeg pandoc
sudo pacman -S texlive-basic texlive-latex texlive-xetex texlive-fontsrecommended
```

---

**Voir aussi:**
- [DEVELOPMENT.md](DEVELOPMENT.md) - Guide de setup complet
- [api_key_encryption.md](api_key_encryption.md) - Détails chiffrement
- [audio_storage_policy.md](audio_storage_policy.md) - Politique stockage
