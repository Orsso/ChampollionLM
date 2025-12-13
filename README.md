<p align="center">
  <img src="frontend/public/logo.svg" alt="Champollion Logo" width="120" height="120">
  <h1 align="center">Champollion</h1>
  <p align="center">
    <strong>Transform audio, videos, and documents into structured notes with AI</strong>
  </p>
  <p align="center">
    <a href="https://champollion-project.fr">🌐 Live Demo</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Mistral_AI-FF6B35?style=flat-square&logo=mistral&logoColor=white" alt="Mistral AI">
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
</p>

---

## About

Champollion is a personal knowledge assistant designed to capture and synthesize information from multiple sources. Whether it's a recorded lecture, a YouTube video explaining a concept, or a PDF document, Champollion processes it all and enables interaction with the content through AI-powered chat and automatic document generation.

---

## How It Works

Sources are imported as audio recordings, YouTube videos, or documents. Champollion transcribes audio using Mistral's Voxtral speech-to-text, extracts YouTube transcripts automatically, and processes PDFs with OCR. All content is indexed using vector embeddings for semantic search.

Once processed, the content becomes available for RAG-powered chat (ask specific questions) or structured Markdown document generation via the LLM. Final notes can be exported as PDF.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Import    │ ──► │  Process    │ ──► │   Output    │
│             │     │             │     │             │
│ Audio/Video │     │ Transcribe  │     │ Chat (RAG)  │
│ YouTube     │     │ + Index     │     │ Notes (LLM) │
│ Documents   │     │             │     │ PDF Export  │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Quick Start

```bash
# Clone and setup backend
git clone https://github.com/orsso/champollionlm.git
cd champollionlm/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env && alembic upgrade head
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173**

---

## Tech Stack

**Frontend:** React 19 · TypeScript · Vite · TailwindCSS  
**Backend:** FastAPI · SQLAlchemy · ChromaDB  
**AI:** Mistral (LLM, STT, OCR, Embedding)

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System overview
- [API Reference](docs/API.md) — Endpoints
- [Development](docs/DEVELOPMENT.md) — Setup & deployment

---

## License

MIT
