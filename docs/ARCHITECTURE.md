# Architecture

Champollion follows a classic client-server architecture with AI capabilities provided by Mistral.

---

## Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────►│     Backend     │────►│   Mistral AI    │
│  React + Vite   │     │    FastAPI      │     │  STT/LLM/OCR    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │    Database     │
                        │ SQLite/Postgres │
                        └─────────────────┘
```

---

## Data Model

```
User
 └── Project
      ├── Source (audio, youtube, pdf, text)
      ├── Document (generated notes)
      └── ChatSession
           └── ChatMessage
```

**Project:** Container for sources and documents  
**Source:** Input content with `processed_content` (transcription/OCR result)  
**Document:** LLM-generated Markdown output  
**ChatSession:** Conversation thread with message history

---

## Processing Pipeline

### Source Processing

1. **Audio** → Mistral Voxtral STT → transcript text
2. **YouTube** → youtube-transcript-api → caption text
3. **PDF** → Mistral OCR → extracted text

All results stored in `source.processed_content`.

### Document Generation

1. Aggregate selected sources
2. Build prompt with structured format instructions
3. Call Mistral LLM
4. Store Markdown result

### RAG Chat

1. Chunk source texts (~150 words)
2. Generate embeddings (Mistral)
3. Store in ChromaDB (in-memory)
4. On query: semantic search → build context → LLM response

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Vector DB | ChromaDB (in-memory) |
| AI | Mistral (LLM, Voxtral STT, OCR, Embeddings) |
| Auth | FastAPI-Users, JWT, Fernet encryption |
| Export | Pandoc (PDF) |

---

## Security

- **Authentication:** JWT tokens (1h expiry)
- **API Keys:** Fernet symmetric encryption at rest
- **Rate Limiting:** 200 req/min global
- **CORS:** Configurable allowed origins

---

## File Structure

```
backend/
├── app/
│   ├── api/routes/      # HTTP endpoints
│   ├── services/        # Business logic
│   ├── processors/      # Audio, PDF, YouTube handlers
│   ├── generators/      # LLM document generation
│   └── models/          # SQLAlchemy models

frontend/
├── src/
│   ├── pages/           # Route components
│   ├── components/      # UI components
│   ├── hooks/           # Data fetching (SWR)
│   └── contexts/        # Auth state
```
