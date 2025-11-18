# Frontend ↔ Backend Type Mapping

**Document de référence pour maintenir la synchronisation des types entre backend (Python/Pydantic) et frontend (TypeScript).**

Voir aussi: `scripts/verify_types.py` (vérification automatique)

---

## Project

| Backend | Frontend | Notes |
|---------|----------|-------|
| `id: int` | `id: string` | Converti à string dans API response |
| `title: str` | `title: string` | Max 160 chars |
| `description: str \| None` | `description?: string` | Optional, textarea |
| `created_at: datetime` | `created_at: string` | ISO 8601 format |
| `sources: list[Source]` | `sources: Source[]` | Relationships chargées |
| `document: Document \| None` | `document?: Document` | Null si non généré |
| `processing_job: ProcessingJob \| None` | `processing_job: ProcessingJob \| null` | Null si non créé |
| `generation_job: GenerationJob \| None` | `generation_job: GenerationJob \| null` | Null si non créé |
| `(computed) status` | `(computed) status` | Dérivé from job statuses |
| `(computed) processing_error` | `(derived)` | De `processing_job.error` |
| `(computed) document_error` | `(derived)` | De `generation_job.error` |

**Backend Schema**: `ProjectDetail`, `ProjectSummary`
**Frontend Type**: `Project` (interface unifiée)

---

## ProcessingJob

| Backend | Frontend | Notes |
|---------|----------|-------|
| `id: int` | `id: string` | Converti à string |
| `project_id: int` | `(not exposed)` | Relationship via project |
| `status: JobStatus` | `status: JobStatus` | 'pending' \| 'in_progress' \| 'succeeded' \| 'failed' |
| `error: str \| None` | `error?: string` | Null si succès |
| `updated_at: datetime` | `updated_at: string` | ISO 8601 |

**Backend Schema**: `JobStatusRead`
**Frontend Type**: `ProcessingJob` (interface)

---

## GenerationJob

| Backend | Frontend | Notes |
|---------|----------|-------|
| `id: int` | `id: string` | Converti à string |
| `project_id: int` | `(not exposed)` | Relationship via project |
| `status: JobStatus` | `status: JobStatus` | 'pending' \| 'in_progress' \| 'succeeded' \| 'failed' |
| `error: str \| None` | `error?: string` | Null si succès |
| `updated_at: datetime` | `updated_at: string` | ISO 8601 |

**Backend Schema**: `JobStatusRead`
**Frontend Type**: `GenerationJob` (interface)

---

## Source

| Backend | Frontend | Notes |
|---------|----------|-------|
| `id: int` | `id: string` | Converti à string |
| `project_id: int` | `(not exposed)` | Relationship via project |
| `type: SourceType` | `type: 'audio' \| 'document'` | Enum strings |
| `status: SourceStatus` | `status: SourceStatus` | 'uploaded' \| 'processing' \| 'processed' \| 'failed' |
| `title: str` | `title: string` | Max 160 chars |
| `file_path: str \| None` | `(not exposed)` | Internal, ne pas utiliser |
| `content: str \| None` | `content?: string` | Pour documents texte |
| `processed_content: str \| None` | `processed_content?: string` | Transcription/OCR/extraction |
| `source_metadata: dict (JSON)` | `(not directly exposed)` | JSON column storing AudioMetadata or DocumentMetadata |
| `audio_metadata: AudioMetadata \| None` | `audio_metadata?: AudioMetadata` | Typed metadata for audio sources (see below) |
| `document_metadata: DocumentMetadata \| None` | `document_metadata?: DocumentMetadata` | Typed metadata for document sources (see below) |
| `created_at: datetime` | `created_at: string` | ISO 8601 |

**Backend Schema**: `SourceRead`
**Frontend Type**: `Source` (interface)

**Phase 7 Changes**:
- Added explicit `status` field (no longer inferred from processed_content)
- Changed `source_metadata` from TEXT (JSON string) to JSON type (dict)
- Added typed metadata accessors: `audio_metadata` and `document_metadata`

---

## AudioMetadata

| Backend | Frontend | Notes |
|---------|----------|-------|
| `duration_seconds: float \| None` | `duration_seconds?: number` | Audio duration in seconds |
| `sample_rate: int \| None` | `sample_rate?: number` | Sample rate in Hz (e.g., 44100, 48000) |
| `channels: int \| None` | `channels?: number` | Number of channels (1=mono, 2=stereo) |
| `size_bytes: int \| None` | `size_bytes?: number` | File size in bytes |
| `format: str \| None` | `format?: string` | Audio format ('mp3', 'wav', 'ogg', etc.) |
| `bitrate: int \| None` | `bitrate?: number` | Audio bitrate in kbps |

**Backend Schema**: `AudioMetadata` (Pydantic BaseModel)
**Frontend Type**: `AudioMetadata` (interface)

---

## DocumentMetadata

| Backend | Frontend | Notes |
|---------|----------|-------|
| `pages: int \| None` | `pages?: number` | Number of pages |
| `word_count: int \| None` | `word_count?: number` | Total word count |
| `size_bytes: int \| None` | `size_bytes?: number` | File size in bytes |
| `format: str \| None` | `format?: string` | Document format ('pdf', 'docx', 'txt', etc.) |
| `language: str \| None` | `language?: string` | Detected language (ISO 639-1 code) |

**Backend Schema**: `DocumentMetadata` (Pydantic BaseModel)
**Frontend Type**: `DocumentMetadata` (interface)

---

## Document

| Backend | Frontend | Notes |
|---------|----------|-------|
| `id: int` | `id: string` | Converti à string |
| `project_id: int` | `(not exposed)` | Relationship via project |
| `provider: str` | `provider: string` | 'mistral', etc. |
| `title: str \| None` | `title?: string` | Null = use generated title |
| `markdown: str` | `markdown: string` | Full document content |
| `created_at: datetime` | `created_at: string` | ISO 8601 |

**Backend Schema**: `DocumentRead`
**Frontend Type**: `Document` (interface)

---

## Enums

### JobStatus

```
Backend:
class JobStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCEEDED = "succeeded"
    FAILED = "failed"

Frontend:
type JobStatus = 'pending' | 'in_progress' | 'succeeded' | 'failed'
```

### SourceType

```
Backend:
class SourceType(str, Enum):
    AUDIO = "audio"
    DOCUMENT = "document"

Frontend:
type SourceType = 'audio' | 'document'
```

### ProjectStatus (DERIVED, NOT STORED)

```
Backend:
class ProjectStatus(str, Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    READY = "ready"

Frontend:
type ProjectStatus = 'draft' | 'processing' | 'ready'

Derivation Logic:
- if processing_job?.status in ('pending', 'in_progress') → 'processing'
- if generation_job?.status == 'in_progress' → 'generating'
- if document exists → 'ready'
- default → 'draft'
```

---

## Critical Type Conversions

### ID Conversion (int → string)

All IDs are converted at the API boundary:
- Backend models: `int`
- Backend schemas: `int` (fastapi/pydantic)
- API JSON response: `string` (auto-converted by FastAPI)
- Frontend types: `string`

**Example**:
```python
# Backend model
class Project(Base):
    id: Mapped[int]

# Backend schema
class ProjectRead(BaseModel):
    id: int  # Pydantic serializes as int

# API response (fastapi auto-converts)
GET /api/projects/123
Response: {"id": "123", ...}  # FastAPI converts int to string in JSON

# Frontend receives
const project = { id: "123", ... }  // string
```

### Datetime Conversion (datetime → ISO 8601 string)

```python
# Backend
created_at: Mapped[datetime] = mapped_column(
    DateTime, default=lambda: datetime.now(tz=UTC)
)

# API response (Pydantic auto-converts)
"created_at": "2025-11-18T10:30:45Z"

# Frontend
created_at: string  // ISO 8601 format
```

### JSON String → Typed Object

`source_metadata` is stored as JSON string in database:

```python
# Backend stores as string
source_metadata: Mapped[str | None] = mapped_column(Text)

# In schema, parsed to object
class SourceRead(BaseModel):
    source_metadata: str | None  # Raw JSON

# Frontend parses and types
metadata: {
    filename: string;
    duration_seconds: number;
    size_bytes: number;
}
```

---

## Calculated/Derived Fields

### Backend Computed Fields (Pydantic @computed_field)

```python
class ProjectSummary(BaseModel):
    processing_job: JobStatusRead | None
    generation_job: JobStatusRead | None

    @computed_field
    @property
    def status(self) -> str:
        """Derived from job statuses."""
        if self.processing_job?.status in ('pending', 'in_progress'):
            return 'processing'
        if self.generation_job?.status == 'in_progress':
            return 'generating'
        return 'ready'
```

These are included in API responses (thanks to `@computed_field` from Pydantic v2).

### Frontend Computed Properties

```typescript
interface Project {
  processing_job: ProcessingJob | null;
  generation_job: GenerationJob | null;
  document: Document | null;

  // Derived on frontend if needed
  getStatus(): ProjectStatus {
    if (this.processing_job?.status === 'in_progress' ||
        this.processing_job?.status === 'pending') {
      return 'processing';
    }
    if (this.generation_job?.status === 'in_progress') {
      return 'generating';
    }
    if (this.document) {
      return 'ready';
    }
    return 'draft';
  }
}
```

---

## Common Mistakes to Avoid

❌ **Don't**: Assume backend int → frontend int
✅ **Do**: Convert IDs to strings (FastAPI handles automatically)

❌ **Don't**: Store `Project.status` in database
✅ **Do**: Compute from `processing_job.status` + `generation_job.status`

❌ **Don't**: Check multiple error fields on frontend
✅ **Do**: Use `processing_job?.error` or `generation_job?.error`

❌ **Don't**: Forget that datetime strings are ISO 8601
✅ **Do**: Parse with `new Date(string)` in JavaScript

❌ **Don't**: Assume source_metadata is always present
✅ **Do**: Add `?.` optional chaining when accessing metadata

---

## Verification Script

Run `python scripts/verify_types.py` to check for mismatches:

```bash
python scripts/verify_types.py
# Output:
# ✓ Project: All fields match
# ✓ Source: All fields match
# ✗ Document: Missing field 'provider' in Frontend
```

---

## When Adding New Fields

1. **Add to backend model** (`app/models/*.py`)
2. **Add to backend schema** (`app/schemas/*.py`)
3. **Add to frontend type** (`frontend/src/types/index.ts`)
4. **Update this mapping document**
5. **Run verification script**

