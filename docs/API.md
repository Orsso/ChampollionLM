# Champollion - API Reference

**Version:** 2.1  
**Base URL:** `http://localhost:8000` (dev) | `https://your-domain.com` (prod)

---

## Table des Matières

1. [Authentication](#authentication)
2. [Projects](#projects)
3. [Sources](#sources)
4. [Documents](#documents)
5. [Tokens](#tokens)
6. [User Settings](#user-settings)
7. [Error Handling](#error-handling)

---

## Authentication

### Register

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "is_active": true,
  "is_superuser": false,
  "is_verified": false,
  "has_api_key": false,
  "created_at": "2025-10-14T12:00:00Z"
}
```

---

### Login

**Endpoint:** `POST /api/auth/jwt/login`

**Request:** `application/x-www-form-urlencoded`
```
username=user@example.com
password=SecurePassword123!
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Usage:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Get Current User

**Endpoint:** `GET /api/auth/users/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "is_active": true,
  "is_superuser": false,
  "is_verified": false,
  "has_api_key": true,
  "created_at": "2025-10-14T12:00:00Z"
}
```

---

### Update User

**Endpoint:** `PATCH /api/auth/users/me`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "email": "newemail@example.com",
  "api_key": "your-mistral-api-key"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "newemail@example.com",
  "has_api_key": true,
  ...
}
```

**Note:** `api_key` est chiffrée avant stockage (Fernet).

---

### Test API Key

**Endpoint:** `POST /api/auth/test-api-key`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Clé API valide et fonctionnelle"
}
```

**Errors:**
- `400` - Clé invalide ou expirée
- `429` - Rate limit dépassé

---

## Projects

### List Projects

**Endpoint:** `GET /api/projects`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Introduction à la Philosophie",
    "status": "ready",
    "created_at": "2025-10-14T10:00:00Z",
    "status_updated_at": "2025-10-14T10:30:00Z",
    "sources_count": 2,
    "processing_status": {
      "status": "succeeded",
      "updated_at": "2025-10-14T10:30:00Z",
      "error": null
    },
    "document_status": {
      "status": "succeeded",
      "updated_at": "2025-10-14T11:00:00Z",
      "error": null
    }
  }
]
```

---

### Create Project

**Endpoint:** `POST /api/projects`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Nouveau Projet",
  "description": "Description optionnelle"
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "title": "Nouveau Projet",
  "status": "draft",
  "created_at": "2025-10-14T12:00:00Z",
  "status_updated_at": "2025-10-14T12:00:00Z",
  "description": "Description optionnelle",
  "sources": [],
  "document": null,
  "transcription_error": null,
  "document_error": null,
  "processing_status": null,
  "document_status": null
}
```

---

### Get Project Details

**Endpoint:** `GET /api/projects/{project_id}`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Introduction à la Philosophie",
  "status": "ready",
  "created_at": "2025-10-14T10:00:00Z",
  "status_updated_at": "2025-10-14T10:30:00Z",
  "description": "Cours magistral",
  "sources": [
    {
      "id": 1,
      "filename": "lecture-part1.mp3",
      "title": "Partie 1",
      "duration_seconds": 3600,
      "size_bytes": 52428800,
      "uploaded_at": "2025-10-14T10:00:00Z",
      "transcript": {
        "provider": "mistral",
        "text": "Transcription complète...",
        "created_at": "2025-10-14T10:30:00Z"
      }
    }
  ],
  "document": {
    "provider": "mistral",
    "title": "Notes Structurées",
    "markdown": "# Introduction\n\n## Résumé\n...",
    "created_at": "2025-10-14T11:00:00Z"
  },
  "processing_status": { ... },
  "document_status": { ... }
}
```

---

### Update Project

**Endpoint:** `PATCH /api/projects/{project_id}`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Titre Modifié",
  "description": "Nouvelle description"
}
```

**Response:** `200 OK` (ProjectDetail)

---

### Delete Project

**Endpoint:** `DELETE /api/projects/{project_id}`

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Note:** Supprime également tous les fichiers audio associés.

---

## Sources

### Upload Audio Source

**Endpoint:** `POST /api/projects/{project_id}/sources/audio`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request:**
```
file: <audio file> (MP3, WAV, M4A, WebM)
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "type": "audio",
  "title": "lecture.mp3",
  "created_at": "2025-10-14T12:00:00Z",
  "has_processed_content": false
}
```

**Validation:**
- Extensions: `.mp3`, `.wav`, `.m4a`, `.webm`
- Taille max: 500 MB
- Durée max: 7200s (2h)

**Note:** Déclenche automatiquement la transcription en arrière-plan.

---

### Create Document Source

**Endpoint:** `POST /api/projects/{project_id}/sources`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "type": "document",
  "title": "Mes Notes v1",
  "content": "# Contenu\n\nTexte en Markdown...",
  "metadata": "{\"version\": 1}"
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "type": "document",
  "title": "Mes Notes v1",
  "created_at": "2025-10-14T12:05:00Z",
  "has_processed_content": false
}
```

---

### List Sources

**Endpoint:** `GET /api/projects/{project_id}/sources`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "type": "audio",
    "title": "lecture.mp3",
    "created_at": "2025-10-14T12:00:00Z",
    "has_processed_content": true
  },
  {
    "id": 2,
    "type": "document",
    "title": "Mes Notes v1",
    "created_at": "2025-10-14T12:05:00Z",
    "has_processed_content": false
  }
]
```

---

### Get Source Details

**Endpoint:** `GET /api/projects/{project_id}/sources/{source_id}`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 2,
  "type": "document",
  "title": "Mes Notes v1",
  "created_at": "2025-10-14T12:05:00Z",
  "has_processed_content": false,
  "content": "# Contenu\n\nTexte en Markdown...",
  "file_path": null,
  "metadata": "{\"version\": 1}"
}
```

---

### Update Source

**Endpoint:** `PATCH /api/projects/{project_id}/sources/{source_id}`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Nouveau Titre",
  "content": "Nouveau contenu..."
}
```

**Response:** `200 OK` (SourceRead)

---

### Delete Source

**Endpoint:** `DELETE /api/projects/{project_id}/sources/{source_id}`

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Note:** Supprime également le fichier audio si présent.

---

### Download Source File

**Endpoint:** `GET /api/projects/{project_id}/sources/{source_id}/file`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
- `Content-Type: audio/mpeg` (ou autre selon extension)
- Body: fichier audio

**Errors:**
- `404` - Source sans fichier ou fichier introuvable

---

## Documents

### Generate Document

**Endpoint:** `POST /api/projects/{project_id}/documents`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "provider": "mistral",
  "source_ids": [1, 2, 3],
  "title": "Notes Complètes"
}
```

**Parameters:**
- `provider` (required): `"mistral"`
- `source_ids` (optional): Liste IDs sources à inclure (défaut: toutes)
- `title` (optional): Titre custom du document

**Response:** `202 Accepted`
```json
{
  "status": "pending",
  "updated_at": "2025-10-14T12:10:00Z",
  "error": null
}
```

**Note:** Traitement asynchrone, utiliser `/documents/status` pour suivre.

---

### Get Document Status

**Endpoint:** `GET /api/projects/{project_id}/documents/status`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "succeeded",
  "updated_at": "2025-10-14T12:15:00Z",
  "error": null
}
```

**Status values:**
- `pending` - En attente
- `in_progress` - En cours
- `succeeded` - Terminé
- `failed` - Échec

---

### Get Document

**Endpoint:** `GET /api/projects/{project_id}/documents`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "provider": "mistral",
  "title": "Notes Complètes",
  "markdown": "# Introduction\n\n## Résumé\n\nLe cours aborde...\n\n## Concepts clés\n\n- Concept 1\n- Concept 2\n\n## Déroulé du cours\n\n### Partie 1\n...",
  "created_at": "2025-10-14T12:15:00Z"
}
```

**Errors:**
- `404` - Document non disponible

---

### Update Document

**Endpoint:** `PATCH /api/projects/{project_id}/documents`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Nouveau Titre"
}
```

**Response:** `200 OK` (DocumentRead)

---

### Delete Document

**Endpoint:** `DELETE /api/projects/{project_id}/documents`

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Note:** Supprime également le job de génération associé.

---

### Export PDF

**Endpoint:** `GET /api/projects/{project_id}/documents/export/pdf`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="document-titre-cours.pdf"`
- Body: fichier PDF

**Errors:**
- `404` - Document non disponible
- `500` - Erreur Pandoc (vérifier installation)

**Requirements:** Pandoc doit être installé sur le serveur.

---

## Tokens

### Estimate Tokens

**Endpoint:** `GET /api/projects/{project_id}/tokens/estimate`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `source_ids` (optional): Liste IDs sources (ex: `?source_ids=1&source_ids=2`)

**Response:** `200 OK`
```json
{
  "total_tokens": 45000,
  "formatted_count": "45k",
  "context_percentage": 35.2,
  "context_limit": 128000,
  "source_count": 3
}
```

**Fields:**
- `total_tokens`: Nombre total de tokens estimés
- `formatted_count`: Format lisible (ex: "45k", "1.2M")
- `context_percentage`: Pourcentage du contexte Mistral utilisé (128k)
- `context_limit`: Limite contexte modèle (128000)
- `source_count`: Nombre de sources incluses (audio + documents)

**Note:** Si `source_ids` non fourni, estime pour toutes les sources du projet.

---

## User Settings

### Update API Key

**Endpoint:** `PATCH /api/auth/users/me`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "api_key": "your-new-mistral-api-key"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "has_api_key": true,
  ...
}
```

**Validation:**
- Clé ne peut pas être vide
- Chiffrée avec Fernet avant stockage

---

### Delete Account

**Endpoint:** `DELETE /api/auth/users/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Note:** Supprime l'utilisateur et toutes ses données en cascade.

---

## Error Handling

### Standard Error Response

```json
{
  "detail": "Error message"
}
```

### HTTP Status Codes

**Success:**
- `200 OK` - Requête réussie
- `201 Created` - Ressource créée
- `202 Accepted` - Traitement asynchrone accepté
- `204 No Content` - Suppression réussie

**Client Errors:**
- `400 Bad Request` - Payload invalide
- `401 Unauthorized` - Token manquant ou invalide
- `403 Forbidden` - Accès refusé
- `404 Not Found` - Ressource introuvable
- `409 Conflict` - Conflit (ex: job déjà en cours)
- `413 Payload Too Large` - Fichier trop volumineux
- `422 Unprocessable Entity` - Validation Pydantic échouée
- `429 Too Many Requests` - Rate limit dépassé

**Server Errors:**
- `500 Internal Server Error` - Erreur serveur
- `503 Service Unavailable` - Service temporairement indisponible

### Common Error Examples

**401 Unauthorized:**
```json
{
  "detail": "Not authenticated"
}
```

**404 Not Found:**
```json
{
  "detail": "Project not found"
}
```

**400 Bad Request:**
```json
{
  "detail": "Audio file exceeds maximum allowed size"
}
```

**409 Conflict:**
```json
{
  "detail": "Document generation already in progress"
}
```

**429 Too Many Requests:**
```json
{
  "detail": "Rate limit exceeded"
}
```

---

## Rate Limits

**Global:** 200 requests/minute

**Specific Endpoints:**
- `POST /projects/{id}/sources/audio` - 10/minute
- `POST /projects/{id}/documents` - 5/minute

**Headers:**
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1697280000
```

---

## Pagination

**Not implemented in MVP** - All list endpoints return complete results.

Future implementation will use:
```
GET /api/projects?page=1&per_page=20
```

---

## Webhooks

**Not available in MVP.**

---

## OpenAPI / Swagger

**Interactive Documentation:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## Examples

### Complete Workflow (cURL)

```bash
# 1. Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# 2. Login
TOKEN=$(curl -X POST http://localhost:8000/api/auth/jwt/login \
  -d "username=test@example.com&password=SecurePass123!" \
  | jq -r '.access_token')

# 3. Set API Key
curl -X PATCH http://localhost:8000/api/auth/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"api_key":"your-mistral-key"}'

# 4. Create Project
PROJECT_ID=$(curl -X POST http://localhost:8000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Project"}' \
  | jq -r '.id')

# 5. Upload Audio
curl -X POST http://localhost:8000/api/projects/$PROJECT_ID/sources/audio \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@lecture.mp3"

# 6. Wait for transcription (poll status)
curl http://localhost:8000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.processing_status'

# 7. Generate Document
curl -X POST http://localhost:8000/api/projects/$PROJECT_ID/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"mistral"}'

# 8. Get Document
curl http://localhost:8000/api/projects/$PROJECT_ID/documents \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.markdown'

# 9. Export PDF
curl http://localhost:8000/api/projects/$PROJECT_ID/documents/export/pdf \
  -H "Authorization: Bearer $TOKEN" \
  -o notes.pdf
```

---

## Changelog

### v2.0 (Octobre 2025)
- ✅ Multi-source architecture (audio + documents)
- ✅ Unified `/sources` endpoints
- ✅ `/documents` endpoints (alias `/notes`)
- ✅ Rate limiting
- ✅ Improved error handling
- ✅ Token estimation with sources

### v1.0 (Initial)
- Basic auth (JWT)
- Audio upload & transcription
- Notes generation
- PDF export

---

**Last Updated:** Octobre 2025  
**Maintainers:** Équipe Champollion

