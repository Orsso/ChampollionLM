<p align="center">
  <h1 align="center">Champollion</h1>
  <p align="center">
    <strong>AI-powered course notes generator from audio, YouTube videos, and documents</strong>
  </p>
</p>



<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/FastAPI-0.103-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/Mistral_AI-1.2-FF6B35?style=flat-square" alt="Mistral AI">
  <img src="https://img.shields.io/badge/Python-3.13+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
</p>

---

## Overview

Champollion transforms audio recordings, YouTube videos, and text inputs into structured, intelligent tailored documents. Powered by Mistral AI for transcription (Voxtral STT) and synthesis (LLM), it offers a complete workflow from source import to PDF export. It is designed to be a user-friendly and accessible tool for anyone looking to create structured, intelligent documents from various sources.

---

## Features

| Feature | Description |
|---------|-------------|
| **Audio Transcription** | Automatic speech-to-text via Mistral Voxtral (MP3, WAV, M4A, WebM) |
| **YouTube Import** | Direct transcript extraction without API key |
| **AI Synthesis** | Intelligent Markdown notes generation via Mistral LLM |
| **Multi-Source Projects** | Combine audio, video, and text sources in a single project |
| **RAG Chat** | Context-aware conversations with your sources using ChromaDB |
| **Token Estimation** | Cost preview before document generation |
| **PDF Export** | Professional export via Pandoc |
| **Secure** | AES encryption (Fernet) for API keys, JWT authentication |

---

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 20+
- FFmpeg
- Pandoc (optional, for PDF export)

### Installation

```bash
# Clone
git clone https://github.com/orsso/champollionlm.git
cd champollionlm

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Environment
cp .env.example .env
# Edit .env:
#   FERNET_SECRET_KEY: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
#   JWT_SECRET: random string

# Database
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --port 8000
```

```bash
# Frontend
cd frontend
npm install
npm run dev
```

Access: **http://localhost:5173**

---

## Architecture

```
Frontend (React 19 + TypeScript)          Backend (FastAPI + SQLAlchemy)
┌─────────────────────────────┐          ┌─────────────────────────────┐
│  Auth / Projects / Sources  │◄────────►│  REST API + WebSocket       │
│  Chat / Studio / Documents  │          │  JWT Auth + Rate Limiting   │
│  Vite + TailwindCSS + GSAP  │          │  Async PostgreSQL/SQLite    │
└─────────────────────────────┘          └──────────────┬──────────────┘
                                                        │
                                         ┌──────────────▼──────────────┐
                                         │  Mistral AI    │  ChromaDB  │
                                         │  (Voxtral STT) │  (RAG)     │
                                         │  (LLM)         │            │
                                         └─────────────────────────────┘
```

### Tech Stack

**Frontend**
- React 19, TypeScript, Vite 7
- TailwindCSS 4, GSAP animations
- SWR for data fetching
- React Hook Form

**Backend**
- FastAPI, SQLAlchemy 2.0, Alembic
- PostgreSQL (prod) / SQLite (dev)
- Mistral AI SDK (Voxtral STT, LLM)
- ChromaDB for vector search
- FastAPI-Users for authentication

---

## Workflow

1. **Create Project** — Define title and description
2. **Import Sources** — Upload audio, paste YouTube URL, or add text
3. **Transcribe** — Automatic STT for audio, direct import for YouTube
4. **Chat** — Discuss your sources with RAG-powered AI
5. **Generate Document** — AI synthesis from selected sources
6. **Export** — Download as PDF

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design and components |
| [API Reference](docs/API.md) | Complete API specification |
| [Development Guide](docs/DEVELOPMENT.md) | Setup, testing, deployment |
| [Environment Config](docs/environment_requirements.md) | Environment variables |
| [Audio Storage](docs/audio_storage_policy.md) | Storage policies |
| [API Key Security](docs/api_key_encryption.md) | Encryption details |
| [Mistral Provider](docs/providers/mistral.md) | Mistral AI integration |

---

## Development

```bash
# Backend tests
cd backend && pytest tests/ -v

# Frontend lint
cd frontend && npm run lint

# Build
cd frontend && npm run build
```

---

## Deployment

Docker-based deployment. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for details.

---

## License

MIT License - See [LICENSE](LICENSE) for details.
