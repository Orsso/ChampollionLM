# Champollion

Générateur de notes de cours alimenté par IA à partir de sources audio et documentaires.

---

## Fonctionnalités

- **Transcription Audio** - Mistral Voxtral STT
- **Synthèse Intelligente** - Génération notes Markdown via Mistral LLM
- **Multi-Sources** - Audio (MP3, WAV, M4A, WebM) + documents texte
- **Sécurisé** - Clés API chiffrées (Fernet), authentification JWT
- **Estimation Tokens** - Prévisualisation coûts avant génération
- **Export PDF** - Via Pandoc

---

## Quick Start

### Prérequis

- Python 3.13+
- Node.js 25+
- FFmpeg
- Pandoc

### Installation

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configuration
cp .env.example .env
# Éditer .env et définir :
#   FERNET_SECRET_KEY : python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
#   JWT_SECRET : chaîne aléatoire

# Migrations
alembic upgrade head

# Démarrer
uvicorn app.main:app --reload --port 8000
```

```bash
# Frontend
cd frontend
npm install
npm run dev
```

**Accès :** http://localhost:5173

---

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  External APIs  │
│   React + TS    │◄──►│   FastAPI       │◄──►│  Mistral AI     │
├─────────────────┤    ├─────────────────┤    └─────────────────┘
│ • Auth Pages    │    │ • Auth (JWT)    │
│ • Dashboard     │    │ • Projects      │    ┌─────────────────┐
│ • Project Detail│    │ • Sources       │    │   Storage       │
│ • Audio Record  │    │ • Transcription │◄──►│   SQLite        │
│ • File Upload   │    │ • Documents     │    │   Local Files   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Stack :**
- **Backend :** FastAPI, SQLAlchemy 2.0, SQLite, Alembic
- **Frontend :** React 19, TypeScript, Vite, TailwindCSS, GSAP
- **IA :** Mistral API (Voxtral STT, Medium LLM)

---

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Conception système et composants
- **[Référence API](docs/API.md)** - Spécification API complète
- **[Guide Développement](docs/DEVELOPMENT.md)** - Configuration, tests, déploiement
- **[Configuration Environnement](docs/environment_requirements.md)** - Variables d'environnement
- **[Stockage Audio](docs/audio_storage_policy.md)** - Politiques de stockage
- **[Sécurité Clés API](docs/api_key_encryption.md)** - Détails chiffrement
- **[Provider Mistral](docs/providers/mistral.md)** - Intégration Mistral AI

---

## Workflow

1. **Créer un Projet** - Titre, description
2. **Ajouter des Sources** - Upload audio ou coller texte
3. **Transcrire** - STT automatique pour sources audio
4. **Générer Document** - Synthèse IA à partir des sources sélectionnées
5. **Exporter** - PDF via Pandoc

---

## Tests

```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm test
```

---

## Déploiement

Voir [docs/DEVELOPMENT.md#deployment](docs/DEVELOPMENT.md#deployment)

**Points clés :**
- Définir `ENVIRONMENT=prod` dans `.env`
- Configurer `CORS_ALLOWED_ORIGINS`
- Utiliser reverse proxy HTTPS (nginx/Caddy)
- Exécuter migrations avant démarrage
