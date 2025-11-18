# Champollion - Architecture Documentation

**Version:** 2.1 (Architecture Générique)  
**Date:** Octobre 2025

---

## Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Modèle de Données](#modèle-de-données)
3. [Architecture Backend](#architecture-backend)
4. [Architecture Frontend](#architecture-frontend)
5. [Flux de Données](#flux-de-données)
6. [Sécurité](#sécurité)
7. [Stockage](#stockage)
8. [Extensibilité](#extensibilité)

---

## Vue d'Ensemble

### Principes Architecturaux

**KISS (Keep It Simple, Stupid)**
- Minimiser les abstractions
- Code explicite plutôt que patterns complexes
- Chaque fichier fait une chose clairement

**DRY (Don't Repeat Yourself)**
- Logique commune dans utils
- Réutilisation des services
- Pas de duplication de code

**YAGNI (You Aren't Gonna Need It)**
- Implémenter uniquement ce qui est nécessaire maintenant
- Pas d'optimisation prématurée
- Extensibilité via code simple et propre

**Architecture Générique**
- `Project` : conteneur générique (pas seulement des "cours")
- `Source` : input polymorphique (audio, PDF, texte, etc.)
- `Document` : output structuré (notes, résumés, articles, etc.)
- Pipeline extensible : Processors → Generators → Exporters

### Stack Technique

**Backend**
- **Framework:** FastAPI (Python 3.13)
- **ORM:** SQLAlchemy 2.0 (async)
- **Database:** SQLite + Alembic migrations
- **Auth:** FastAPI Users (JWT)
- **Encryption:** Fernet (cryptography)
- **AI:** Mistral API (Voxtral STT, Medium LLM)

**Frontend**
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Styling:** TailwindCSS
- **Animation:** GSAP
- **State:** SWR (API caching)
- **Forms:** React Hook Form

**Infrastructure**
- **Storage:** Local filesystem
- **Logs:** Python logging (structured)
- **Rate Limiting:** SlowAPI
- **PDF Export:** Pandoc

---

## Modèle de Données

### Diagramme Entité-Relation

```
User (1) ──┬──> (N) Project
           │
           └──> api_key_encrypted (Fernet)

Project (1) ──┬──> (N) Source
              ├──> (1) Document
              ├──> (1) ProcessingJob
              └──> (1) GenerationJob

Source ──> processed_content (TEXT)
```

### Entités Principales

#### User
```python
id: int (PK)
email: str (unique, indexed)
hashed_password: str (bcrypt)
api_key_encrypted: str | None (Fernet)
created_at: datetime (UTC)
```

**Relations:**
- `projects: list[Project]` (cascade delete)

---

#### Project (Conteneur Générique)
```python
id: int (PK)
user_id: int (FK → User, cascade)
title: str (max 160)
description: str | None
status: ProjectStatus (draft|processing|ready)
created_at: datetime
status_updated_at: datetime
transcription_error: str | None  # LEGACY - sera déprécié
document_error: str | None
```

**Relations:**
- `owner: User`
- `sources: list[Source]` (cascade delete)
- `document: Document | None` (1-1, cascade delete)
- `processing_job: ProcessingJob | None` (1-1, cascade delete) — Transcription, OCR, extraction
- `generation_job: GenerationJob | None` (1-1, cascade delete) — Génération document LLM

**Enum ProjectStatus:**
- `draft` - Projet créé, pas de traitement
- `processing` - Traitement en cours (transcription, OCR, etc.)
- `ready` - Traitement terminé

**Vision Future:**
- Support de multiples documents par projet (notes, résumés, flashcards, etc.)
- Workflows de traitement complexes (OCR → extraction → enrichissement)

---

#### Source (Modèle Central Polymorphique)
```python
id: int (PK)
project_id: int (FK → Project, cascade)
type: SourceType (audio|document)  # LEGACY
title: str (max 160)

# Polymorphic storage
file_path: str | None        # Pour audio, PDF, etc.
content: str | None          # Pour documents texte

# Processed content: résultat unifié du traitement
# Audio → transcription, PDF → OCR/extraction, Text → passthrough
processed_content: str | None (TEXT)

source_metadata: str | None  # JSON extensible
created_at: datetime
```

**Relations:**
- `project: Project`

**Enum SourceType (LEGACY):**
- `audio` - Fichier audio (MP3, WAV, M4A, WebM)
- `document` - Texte Markdown

**Future: SourceFormat (MIME types)**
```python
class SourceFormat(str, Enum):
    AUDIO_MP3 = "audio/mp3"
    AUDIO_WAV = "audio/wav"
    AUDIO_WEBM = "audio/webm"
    APPLICATION_PDF = "application/pdf"
    TEXT_MARKDOWN = "text/markdown"
    TEXT_PLAIN = "text/plain"
```

**Métadonnées JSON (audio):**
```json
{
  "filename": "recording.mp3",
  "duration_seconds": 3600,
  "size_bytes": 52428800
}
```

**Architecture:**
- **Avant:** Table `Transcript` séparée (1-1 avec Source)
- **Après:** Champ `processed_content` directement dans `Source`
- **Bénéfice:** Uniformité pour tous types de sources (audio, PDF, OCR, etc.)

---

#### Document
```python
id: int (PK)
project_id: int (FK → Project, unique, cascade)
provider: str (ex: "mistral")
title: str | None
markdown: str (contenu structuré)
created_at: datetime
```

**Relations:**
- `project: Project`

**Contrainte:** Un seul document par projet (unique constraint)

**Vision Future:**
- `type: DocumentType` (notes, summary, flashcards, quiz, etc.)
- Multiple documents par projet
- Versioning des documents

---

#### ProcessingJob & GenerationJob
```python
# ProcessingJob: Traitement des sources (transcription, OCR, extraction)
id: int (PK)
project_id: int (FK → Project, unique, cascade)
status: JobStatus
error: str | None
updated_at: datetime

# GenerationJob: Génération document via LLM
id: int (PK)
project_id: int (FK → Project, unique, cascade)
status: JobStatus
error: str | None
updated_at: datetime
```

**Enum JobStatus:**
- `pending` - En attente
- `in_progress` - En cours
- `succeeded` - Terminé avec succès
- `failed` - Échec

---

## Architecture Backend

### Structure des Dossiers

```
backend/app/
├── main.py                 # Point d'entrée FastAPI
├── core/
│   ├── settings.py         # Configuration Pydantic
│   ├── auth.py             # FastAPI Users setup
│   └── security.py         # Fernet encryption
├── db/
│   ├── session.py          # SQLAlchemy async engine
│   ├── init_db.py          # DB initialization
│   └── base.py             # Metadata
├── models/
│   ├── user.py
│   ├── project.py          # ⭐ Conteneur générique
│   ├── source.py           # ⭐ Modèle central polymorphique
│   ├── document.py
│   ├── job.py              # ProcessingJob, GenerationJob
│   └── enums.py            # ⭐ Enums centralisés (future)
├── schemas/
│   ├── user.py
│   ├── project.py          # ProjectCreate, ProjectDetail, etc.
│   └── source.py
├── services/
│   ├── projects.py         # CRUD projets, orchestration
│   ├── sources.py          # CRUD sources
│   └── jobs.py             # Background tasks (processing, generation)
├── processors/              # ⭐ Nouveau: traitement sources
│   ├── base.py             # Protocol SourceProcessor
│   ├── audio.py            # AudioProcessor (Mistral STT)
│   ├── pdf.py              # PDFProcessor (OCR, extraction)
│   └── text.py             # TextProcessor (passthrough)
├── generators/              # ⭐ Nouveau: génération documents
│   ├── base.py             # Protocol GenerationStrategy
│   ├── mistral.py          # MistralGenerator
│   └── openai.py           # OpenAIGenerator (future)
├── exporters/               # ⭐ Nouveau: export documents
│   ├── base.py             # Protocol DocumentExporter
│   ├── markdown.py         # MarkdownExporter
│   ├── pdf.py              # PDFExporter (Pandoc)
│   └── docx.py             # DOCXExporter (future)
├── utils/
│   ├── audio.py            # Validation, conversion, durée
│   ├── text_extraction.py  # Extraction texte depuis Source
│   ├── tokens.py           # Estimation tokens Mistral
│   └── cleanup.py          # Nettoyage fichiers temp
└── api/
    ├── deps.py             # Dependency injection
    └── routes/
        ├── auth.py
        └── projects.py     # Routes principales
```

### Couches et Responsabilités

**1. Routes (API Layer)**
- Validation requêtes (Pydantic)
- Authentification (JWT via Depends)
- Délégation aux services
- Sérialisation réponses

**2. Services (Business Logic)**
- Logique métier
- Orchestration des opérations
- Vérification ownership
- Gestion transactions DB

**3. Models (Data Layer)**
- Définition schéma SQLAlchemy
- Relations entre entités
- Contraintes DB

**4. Processors/Generators/Exporters (Pipeline)**
- **Processors:** Source brute → `processed_content`
- **Generators:** `processed_content` → Document (Markdown)
- **Exporters:** Document → Formats (PDF, DOCX, etc.)

**5. Utils (Helpers)**
- Fonctions pures
- Pas de dépendances DB
- Réutilisables

### Pipelines de Traitement

#### Pipeline de Sources

```
┌─────────────┐
│ Raw Source  │  Audio, PDF, Texte brut
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Processor  │  AudioProcessor, PDFProcessor, TextProcessor
│  (Protocol) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ processed_  │  Texte extrait/transcrit unifié
│  content    │
└─────────────┘
```

**Exemples:**
- **AudioProcessor:** MP3 → Mistral STT → transcript texte
- **PDFProcessor:** PDF → OCR/extraction → texte brut
- **TextProcessor:** Markdown → validation → passthrough

#### Pipeline de Documents

```
┌─────────────┐
│ processed_  │  Texte(s) traité(s)
│  content    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Generator  │  MistralGenerator, OpenAIGenerator
│  (Strategy) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Document   │  Markdown structuré (canonical)
│  (Markdown) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Exporter   │  PDFExporter, DOCXExporter, HTMLExporter
│  (Protocol) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Output    │  PDF, DOCX, HTML, etc.
└─────────────┘
```

### Flux de Traitement

#### Upload Audio
```
1. POST /projects/{id}/sources/audio (multipart file)
2. ProjectService.add_audio_source()
   ├─> Validation (extension, taille, durée)
   ├─> Conversion WebM → MP3 (si nécessaire)
   ├─> Stockage fichier (storage/audio/{user_id}/{project_id}/)
   ├─> Création Source (type=AUDIO, metadata JSON)
   └─> BackgroundTask: run_processing_job()
3. jobs.run_processing_job()
   ├─> Pour chaque source audio sans processed_content:
   │   ├─> AudioProcessor.process()
   │   │   ├─> Segmentation audio (si >30min)
   │   │   ├─> Conversion WAV 16kHz mono
   │   │   ├─> Appel Mistral STT API
   │   │   └─> Return transcription
   │   └─> Source.processed_content = transcription
   └─> Mise à jour Project.status = ready
```

#### Génération Document
```
1. POST /projects/{id}/documents (body: provider, source_ids, title)
2. ProjectService.start_generation_job()
   ├─> Validation sources existent
   ├─> Création/Update GenerationJob (status=pending)
   └─> BackgroundTask: run_document_job()
3. jobs.run_document_job()
   ├─> Récupération sources par IDs
   ├─> Extraction texte via text_extraction.extract_text_from_source()
   │   └─> Return Source.processed_content (prioritaire) ou Source.content
   ├─> Agrégation textes
   ├─> MistralGenerator.generate_document()
   │   ├─> Appel Mistral LLM API
   │   └─> Return Markdown structuré
   ├─> Nettoyage Markdown (suppression balises ```markdown)
   ├─> Création/Update Document
   └─> GenerationJob.status = succeeded
```

---

## Architecture Frontend

### Structure des Dossiers

```
frontend/src/
├── main.tsx
├── App.tsx
├── pages/
│   ├── index.ts                # Barrel exports
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── ProjectDetail.tsx      # Page principale
│   └── Settings.tsx
├── components/
│   ├── auth/
│   │   ├── index.ts
│   │   └── AuthForm.tsx
│   ├── common/
│   │   ├── index.ts
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ErrorBoundary.tsx
│   ├── project/                # ⭐ Renommé depuis course/
│   │   ├── ProjectList.tsx
│   │   ├── CreateProjectModal.tsx
│   │   ├── SourcesPanel.tsx   # Gestion sources audio
│   │   └── StudioPanel.tsx    # Génération documents
│   └── ui/                     # ⭐ Composants organisés par catégorie
│       ├── index.ts            # Central barrel export
│       ├── buttons/
│       │   ├── index.ts
│       │   ├── AnimatedButton.tsx
│       │   ├── IconButton.tsx
│       │   ├── FloatingActionButton.tsx
│       │   └── ConfirmDeleteButton.tsx
│       ├── forms/
│       │   ├── index.ts
│       │   └── Input.tsx           # AnimatedInput
│       ├── feedback/
│       │   ├── index.ts
│       │   ├── Alert.tsx           # ⭐ Nouveau: messages unifiés
│       │   ├── Spinner.tsx
│       │   ├── ProgressBar.tsx
│       │   ├── Badge.tsx
│       │   └── Tooltip.tsx
│       ├── layout/
│       │   ├── index.ts
│       │   ├── Card.tsx
│       │   ├── Modal.tsx
│       │   ├── Dock.tsx
│       │   └── Folder.tsx
│       ├── media/
│       │   ├── index.ts
│       │   ├── AudioPlayer.tsx
│       │   ├── Waveform.tsx
│       │   ├── TranscriptModal.tsx
│       │   └── ExportMenu.tsx
│       ├── navigation/
│       │   ├── index.ts
│       │   ├── PillNav.tsx
│       │   └── PillNav.css
│       ├── effects/
│       │   ├── index.ts
│       │   ├── PixelBlast.tsx
│       │   └── PixelBlast.css
│       └── icons/
│           ├── index.ts
│           └── Icons.tsx
├── hooks/
│   ├── index.ts                # ⭐ Barrel exports
│   ├── useAuth.ts              # ⭐ Extrait d'AuthContext
│   ├── useProjects.ts          # ⭐ Renommé depuis useCourses.ts
│   ├── useSources.ts
│   ├── useDocuments.ts         # ⭐ Renommé depuis useNotes.ts
│   ├── useTokens.ts
│   ├── useAudioPlayer.ts
│   ├── useProjectsWithPolling.ts
│   └── useRecordingAnimations.ts
├── contexts/
│   └── AuthContext.tsx         # Export AuthContext (pas useAuth)
├── constants/
│   └── styles.ts               # ⭐ TRANSITIONS, BUTTON_VARIANTS, etc.
├── styles/
│   └── markdown.css
├── types/
│   └── index.ts                # Types TypeScript
└── lib/
    └── api.ts                  # Fetcher avec JWT
```

### Composants Clés

**ProjectDetail**
- Onglets: Sources / Studio
- Polling status jobs (processing, génération)
- Badges statut projet

**SourcesPanel**
- Enregistrement audio (MediaRecorder)
- Upload fichier audio
- Liste sources audio avec player
- Suppression sources

**StudioPanel**
- Sélection sources (audio + documents)
- Estimation tokens
- Génération document
- Visualisation Markdown
- Export PDF

### Gestion d'État

**SWR (Stale-While-Revalidate)**
```typescript
const { project, isLoading, mutate } = useProject(projectId);
```

- Cache automatique
- Revalidation en arrière-plan
- Optimistic updates
- Polling pour jobs async

**AuthContext**
```typescript
const { user, token, login, logout } = useAuth();
```

- État auth global
- Persistance token (localStorage)
- Redirection automatique 401

---

## Flux de Données

### Flux Complet: Audio → Document

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS AUDIO                                           │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: SourcesPanel                                          │
│ ├─> File selection / MediaRecorder                             │
│ ├─> POST /projects/{id}/sources/audio (multipart)              │
│ └─> Display upload progress                                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend: ProjectService.add_audio_source()                     │
│ ├─> Validate file (extension, size, duration)                  │
│ ├─> Convert WebM → MP3 (if needed)                             │
│ ├─> Save to storage/audio/{user_id}/{project_id}/              │
│ ├─> Create Source (type=AUDIO, file_path, metadata)            │
│ └─> Trigger BackgroundTask: run_processing_job()               │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Background: run_processing_job()                               │
│ ├─> Load project + audio sources without processed_content     │
│ ├─> For each source:                                           │
│ │   ├─> AudioProcessor.process()                               │
│ │   │   ├─> Segment if >30min (FFmpeg)                         │
│ │   │   ├─> Convert to WAV 16kHz mono                          │
│ │   │   ├─> Call Mistral STT API                               │
│ │   │   └─> Return transcription text                          │
│ │   └─> Source.processed_content = transcription               │
│ ├─> Update Project.status = ready                              │
│ └─> Update ProcessingJob.status = succeeded                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: Polling (every 3s)                                    │
│ └─> GET /projects/{id} → Display processed badge               │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. USER GENERATES DOCUMENT                                      │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: StudioPanel                                           │
│ ├─> Select sources (audio + documents)                         │
│ ├─> Estimate tokens (GET /tokens/estimate?source_ids=...)      │
│ ├─> POST /projects/{id}/documents                              │
│ │   Body: { provider: "mistral", source_ids: [1,2,3] }       │
│ └─> Poll status (GET /documents/status)                        │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend: ProjectService.start_generation_job()                 │
│ ├─> Validate sources exist                                     │
│ ├─> Create/Update GenerationJob (status=pending)               │
│ └─> Trigger BackgroundTask: run_document_job()                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Background: run_document_job()                                 │
│ ├─> Get sources by IDs                                         │
│ ├─> Extract text from each source:                             │
│ │   └─> extract_text_from_source() → Source.processed_content  │
│ ├─> Aggregate texts with headers                               │
│ ├─> MistralGenerator.generate_document()                       │
│ │   ├─> Call Mistral LLM API (Medium model)                    │
│ │   │   Prompt: "Generate structured notes..."                 │
│ │   └─> Return Markdown                                        │
│ ├─> Clean Markdown (remove ```markdown fences)                 │
│ ├─> Create/Update Document                                     │
│ └─> Update GenerationJob.status = succeeded                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: Display Document                                      │
│ ├─> GET /projects/{id}/documents → Markdown                    │
│ ├─> Render with react-markdown                                 │
│ └─> Export PDF (GET /documents/export/pdf)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sécurité

### Authentification

**JWT (JSON Web Tokens)**
- Bearer token dans header `Authorization`
- Lifetime configurable (défaut: 3600s)
- Stateless (pas de session serveur)
- Secret: `settings.jwt_secret`

**FastAPI Users**
- Gestion complète auth (register, login, logout)
- Hashing passwords (bcrypt)
- Current user injection via `Depends(current_active_user)`

### Chiffrement Clés API

**Fernet (Symmetric Encryption)**
```python
from cryptography.fernet import Fernet

# Génération clé (une fois)
key = Fernet.generate_key()  # Stocker dans .env

# Chiffrement
encrypted = fernet.encrypt(api_key.encode()).decode()

# Déchiffrement
api_key = fernet.decrypt(encrypted.encode()).decode()
```

**Stockage:**
- `User.api_key_encrypted` (base de données)
- Jamais exposée en clair côté client
- Déchiffrée uniquement côté serveur pour appels API

### CORS

**Configuration par Environnement**
```python
# Dev: permissif
allow_origins = ["http://localhost:5173", ...]
allow_methods = ["*"]
allow_headers = ["*"]

# Prod: strict
allow_origins = settings.cors_allowed_origins  # depuis .env
allow_methods = ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
allow_headers = ["Content-Type", "Authorization"]
```

### Rate Limiting

**SlowAPI**
- Limite globale: 200 req/min
- Upload audio: 10 req/min
- Génération documents: 5 req/min
- Basé sur IP (`get_remote_address`)

### Validation

**Pydantic**
- Validation automatique payloads
- Type coercion
- Erreurs 422 explicites

**Audio:**
- Extensions: `.mp3`, `.wav`, `.m4a`, `.webm`
- Taille max: 500 MB
- Durée max: 7200s (2h)

---

## Stockage

### Fichiers Audio

**Structure:**
```
storage/audio/
└── {user_id}/
    └── {project_id}/
        ├── upload-20251014-120000-recording.mp3
        ├── upload-20251014-130000-lecture.mp3
        └── ...
```

**Nommage:**
```
upload-{timestamp}-{sanitized_filename}.{ext}
```

**Politique:**
- Stockage local uniquement (MVP)
- Suppression cascade: projet supprimé → répertoire supprimé
- Suppression source → fichier supprimé
- Cleanup temp files au startup (>24h)

### Base de Données

**SQLite**
- Fichier: `backend/champollion.db`
- Async via `aiosqlite`
- Migrations: Alembic

**Backups:**
- Copie manuelle du fichier `.db`
- Avant migrations: `cp champollion.db champollion.db.backup`

### Fichiers Temporaires

**Répertoire:** `backend/tmp/mistral/`

**Contenu:**
- Segments audio (FFmpeg)
- Fichiers WAV convertis (STT)

**Nettoyage:**
- Au startup: fichiers >24h supprimés
- Après traitement: suppression immédiate

---

## Extensibilité

### Nouvelle Architecture Modulaire

L'architecture V2 facilite l'ajout de nouvelles fonctionnalités via trois points d'extension principaux :

#### 1. Ajouter un Nouveau Type de Source

**Exemple: Support PDF avec OCR**

```python
# 1. Définir le format (enums.py)
class SourceFormat(str, Enum):
    AUDIO_MP3 = "audio/mp3"
    APPLICATION_PDF = "application/pdf"  # Nouveau

# 2. Créer le Processor (processors/pdf.py)
class PDFProcessor(SourceProcessor):
    @classmethod
    def supported_formats(cls) -> list[SourceFormat]:
        return [SourceFormat.APPLICATION_PDF]
    
    async def process(self, source: Source, file_path: Path, **options) -> ProcessorResult:
        # OCR via Tesseract ou service cloud
        text = await extract_pdf_text(file_path)
        return ProcessorResult(
            processed_content=text,
            metadata={"pages": num_pages}
        )

# 3. Enregistrer dans ProcessorRegistry (processors/__init__.py)
ProcessorRegistry.register(PDFProcessor)

# 4. Ajouter endpoint upload (api/routes/projects.py)
@router.post("/{project_id}/sources/pdf")
async def upload_pdf(
    project_id: int,
    file: UploadFile = File(...),
    service: ProjectService = Depends(get_project_service),
):
    # Validation, stockage, création Source
    source = await service.add_pdf_source(project_id, file)
    # Trigger processing job
    background_tasks.add_task(run_processing_job, project_id)
    return source
```

#### 2. Ajouter un Nouveau Provider LLM

**Exemple: Support OpenAI**

```python
# 1. Créer le Generator (generators/openai.py)
class OpenAIGenerator(GenerationStrategy):
    @classmethod
    def provider_name(cls) -> str:
        return "openai"
    
    @classmethod
    def supported_models(cls) -> list[str]:
        return ["gpt-4", "gpt-3.5-turbo"]
    
    async def generate_document(
        self,
        processed_content: str,
        document_type: DocumentType,
        **options
    ) -> GenerationResult:
        # Appel OpenAI API
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Generate structured notes..."},
                {"role": "user", "content": processed_content}
            ]
        )
        return GenerationResult(
            markdown=response.choices[0].message.content,
            metadata={"tokens_used": response.usage.total_tokens}
        )

# 2. Enregistrer dans GeneratorRegistry (generators/__init__.py)
GeneratorRegistry.register(OpenAIGenerator)

# 3. Utilisation automatique via factory
generator = GeneratorRegistry.get("openai")
result = await generator.generate_document(text, DocumentType.NOTES)
```

#### 3. Ajouter un Nouveau Format d'Export

**Exemple: Export DOCX**

```python
# 1. Créer l'Exporter (exporters/docx.py)
class DOCXExporter(DocumentExporter):
    @classmethod
    def target_format(cls) -> DocumentFormat:
        return DocumentFormat.DOCX
    
    async def export(
        self,
        markdown_content: str,
        output_path: Path,
        metadata: Optional[dict] = None,
        **options
    ) -> ExportResult:
        # Conversion Markdown → DOCX via python-docx ou Pandoc
        doc = Document()
        # Parse markdown et populate doc
        doc.save(output_path)
        return ExportResult(
            file_path=output_path,
            format=DocumentFormat.DOCX,
            size_bytes=output_path.stat().st_size
        )

# 2. Enregistrer dans ExporterRegistry (exporters/__init__.py)
ExporterRegistry.register(DOCXExporter)

# 3. Ajouter endpoint export (api/routes/projects.py)
@router.get("/{project_id}/documents/export/docx")
async def export_docx(project_id: int, service: ProjectService = ...):
    exporter = ExporterRegistry.get(DocumentFormat.DOCX)
    result = await exporter.export(document.markdown, output_path)
    return FileResponse(result.file_path)
```

---

## Performance

### Optimisations Actuelles

**SQLAlchemy:**
- Eager loading (`selectinload`) pour éviter N+1
- Async queries
- Index sur FK et colonnes fréquentes

**Frontend:**
- SWR cache
- Lazy loading composants
- Debounce inputs

**Audio:**
- Conversion WebM→MP3 (meilleure compatibilité)
- Segmentation pour longs audios (>30min)

### Limitations Connues

- SQLite: pas de concurrence élevée (OK pour <10 users)
- Stockage local: pas de scalabilité horizontale
- Background tasks: FastAPI (pas de queue distribuée)

**Solutions futures:**
- PostgreSQL pour multi-users
- S3/Wasabi pour stockage
- Redis + TaskIQ pour jobs

---

## Références

- **FastAPI:** https://fastapi.tiangolo.com/
- **SQLAlchemy 2.0:** https://docs.sqlalchemy.org/
- **Alembic:** https://alembic.sqlalchemy.org/
- **Mistral AI:** https://docs.mistral.ai/
- **React:** https://react.dev/
- **Vite:** https://vitejs.dev/

---

**Dernière mise à jour:** Octobre 2025  
**Version:** 2.1 (Architecture Générique)  
**Auteurs:** Équipe Champollion
