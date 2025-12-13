# API Reference

**Base URL:** `http://localhost:8000/api`

---

## Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create account |
| `/auth/jwt/login` | POST | Get JWT token |
| `/auth/users/me` | GET | Current user info |
| `/auth/users/me` | PATCH | Update user (email, API key) |
| `/auth/users/me` | DELETE | Delete account |

**Login:** Send `username` and `password` as form data. Returns `access_token`.

**All other endpoints:** Include `Authorization: Bearer <token>` header.

---

## Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects` | GET | List all projects |
| `/projects` | POST | Create project |
| `/projects/{id}` | GET | Get project details |
| `/projects/{id}` | PATCH | Update project |
| `/projects/{id}` | DELETE | Delete project |

---

## Sources

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects/{id}/sources` | GET | List sources |
| `/projects/{id}/sources/audio` | POST | Upload audio (multipart) |
| `/projects/{id}/sources/youtube` | POST | Import YouTube transcript |
| `/projects/{id}/sources/pdf` | POST | Upload PDF for OCR |
| `/projects/{id}/sources/{source_id}` | DELETE | Delete source |

**Audio formats:** MP3, WAV, M4A, WebM (max 500MB)  
**PDF:** Max 50MB, processed via Mistral OCR

---

## Chat

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects/{id}/chat` | POST | Send message (streaming SSE) |
| `/projects/{id}/chat/sessions` | GET | List chat sessions |
| `/projects/{id}/chat/sessions` | POST | Create session |
| `/projects/{id}/chat/sessions/{session_id}` | DELETE | Delete session |
| `/projects/{id}/chat/sessions/{session_id}/history` | GET | Get messages |

Chat uses RAG (Retrieval-Augmented Generation) with Mistral embeddings and ChromaDB.

---

## Documents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects/{id}/documents` | POST | Generate document (LLM) |
| `/projects/{id}/documents` | GET | List documents |
| `/projects/{id}/documents/{doc_id}` | GET | Get document content |
| `/projects/{id}/documents/{doc_id}` | DELETE | Delete document |
| `/projects/{id}/documents/{doc_id}/export/pdf` | GET | Export as PDF |

---

## Tokens

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects/{id}/tokens/estimate` | GET | Estimate token count |

Query param: `source_ids` to filter sources.

---

## Errors

| Code | Meaning |
|------|---------|
| 400 | Bad request |
| 401 | Not authenticated |
| 404 | Not found |
| 413 | File too large |
| 422 | Validation error |
| 429 | Rate limit (200 req/min) |

---

## Interactive Docs

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
