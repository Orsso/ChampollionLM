# Champollion - Development Guide

**Version:** 2.0  
**Date:** Octobre 2025

---

## Table des Matières

1. [Setup Environnement](#setup-environnement)
2. [Development Workflow](#development-workflow)
3. [Testing](#testing)
4. [Database Migrations](#database-migrations)
5. [Code Style](#code-style)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Setup Environnement

### Prerequisites

**System Requirements:**
- **Python 3.13+**
- **Node.js 25+**
- **FFmpeg** (audio processing)
- **Pandoc** (PDF export)
- **Git**

**Install System Dependencies:**

```bash
# macOS
brew install python@3.13 node@25 ffmpeg pandoc

# Ubuntu/Debian
sudo apt update
sudo apt install python3.13 python3.13-venv ffmpeg pandoc
# Node.js 25+ via NodeSource
curl -fsSL https://deb.nodesource.com/setup_25.x | sudo -E bash -
sudo apt install -y nodejs

# Arch Linux
sudo pacman -S python nodejs npm ffmpeg pandoc
```

---

### Backend Setup

```bash
# Clone repository
git clone https://github.com/Orsso/ChampollionLM.git
cd ChampollionLM/backend

# Create virtual environment
python3.13 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

**Configure `.env`:**

```bash
# Generate Fernet key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Copy output to FERNET_SECRET_KEY

# Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output to JWT_SECRET
```

**`.env` example:**
```env
# Security
FERNET_SECRET_KEY=lI3d9a4d8KX-WA3N8JxKKG2bPZbYQPbQaA-jqvOB0Bo=
JWT_SECRET=your-random-jwt-secret-here
JWT_LIFETIME_SECONDS=3600

# Database
DATABASE_URL=sqlite+aiosqlite:///./champollion.db

# Storage
FILE_STORAGE_ROOT=./storage/files
MAX_AUDIO_BYTES=524288000
MAX_AUDIO_DURATION_SECONDS=7200

# Environment
ENVIRONMENT=dev

# CORS (prod only)
CORS_ALLOWED_ORIGINS=

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=text
```

**Initialize Database:**

```bash
# Run migrations
alembic upgrade head

# Verify
sqlite3 champollion.db ".tables"
# Should show: user, project, source, document, processingjob, generationjob, etc.
```

**Start Backend:**

```bash
uvicorn app.main:app --reload --port 8000
```

**Verify:**
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/projects (should return 401)

---

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Verify:**
- App: http://localhost:5173
- Should show login page

---

### Full Stack Test

1. **Register:** http://localhost:5173/register
2. **Login:** Use credentials
3. **Settings:** Add Mistral API key
4. **Create Project:** Dashboard → "Nouveau Projet"
5. **Upload Audio:** Small MP3 file (<1min for quick test)
6. **Wait Transcription:** Status should update
7. **Generate Document:** Studio tab → Generate
8. **View Result:** Markdown should display

---

## Development Workflow

### Git Workflow

**Branches:**
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code improvements

**Workflow:**

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ...

# Commit
git add .
git commit -m "feat: add amazing feature"

# Push
git push origin feature/my-feature

# Open Pull Request on GitHub
```

**Commit Convention:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance

---

### Hot Reload

**Backend:**
- Uvicorn `--reload` watches Python files
- Changes auto-reload (except `.env`)

**Frontend:**
- Vite HMR (Hot Module Replacement)
- Instant updates in browser

---

### Environment Variables

**Backend:**
- Loaded from `.env` via `pydantic-settings`
- Access: `from app.core.settings import settings`
- Reload: Restart uvicorn

**Frontend:**
- Vite env vars: `VITE_*` prefix
- Access: `import.meta.env.VITE_API_BASE_URL`
- Reload: Restart dev server

---

## Testing

### Backend Tests

**Run All Tests:**

```bash
cd backend
pytest tests/ -v
```

**Run Specific Test:**

```bash
pytest tests/test_projects.py::test_create_project -v
```

**With Coverage:**

```bash
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html
```

**Test Structure:**

```
backend/tests/
├── conftest.py           # Fixtures (client, tmp DB)
├── test_auth.py          # Auth endpoints
├── test_projects.py      # Project CRUD
├── test_sources.py       # Source management
├── test_e2e.py           # End-to-end workflows
└── test_pdf_export.py    # PDF generation
```

**Writing Tests:**

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_project(client: AsyncClient):
    # Register & login
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })

    login_response = await client.post("/api/auth/jwt/login", data={
        "username": "test@example.com",
        "password": "SecurePass123!"
    })
    token = login_response.json()["access_token"]

    # Create project
    response = await client.post("/api/projects", json={
        "title": "Test Project"
    }, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 201
    assert response.json()["title"] == "Test Project"
```

---

### Frontend Tests

**Run Tests:**

```bash
cd frontend
npm test
```

**Watch Mode:**

```bash
npm test -- --watch
```

**Coverage:**

```bash
npm test -- --coverage
```

**Test Structure:**

```
frontend/src/
├── components/
│   └── __tests__/
│       └── Button.test.tsx
├── hooks/
│   └── __tests__/
│       └── useCourses.test.ts
└── utils/
    └── __tests__/
        └── api.test.ts
```

**Writing Tests:**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

---

### E2E Testing

**Manual E2E Checklist:**

- [ ] Register new user
- [ ] Login
- [ ] Set API key
- [ ] Create project
- [ ] Upload audio (MP3)
- [ ] Upload audio (WebM - should convert)
- [ ] Create document source
- [ ] View transcript
- [ ] Estimate tokens
- [ ] Generate document (audio only)
- [ ] Generate document (mixed sources)
- [ ] Export PDF
- [ ] Update project title
- [ ] Delete source
- [ ] Delete project
- [ ] Logout

**Automated E2E (Future):**
- Playwright or Cypress
- See `backend/tests/test_e2e.py` for backend E2E

---

## Database Migrations

### Alembic Basics

**Create Migration:**

```bash
cd backend

# Auto-generate from model changes
alembic revision --autogenerate -m "Add new field to Course"

# Manual migration
alembic revision -m "Custom migration"
```

**Review Migration:**

```bash
# Check generated file
cat alembic/versions/<timestamp>_add_new_field.py
```

**Apply Migrations:**

```bash
# Upgrade to latest
alembic upgrade head

# Upgrade one version
alembic upgrade +1

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade <revision>
```

**Check Current Version:**

```bash
alembic current
```

**View History:**

```bash
alembic history
```

---

### Migration Best Practices

**1. Always backup before migration:**

```bash
cp champollion.db champollion.db.backup
```

**2. Test migrations locally first:**

```bash
# Apply
alembic upgrade head

# Test app
uvicorn app.main:app --reload

# If issues, rollback
alembic downgrade -1
```

**3. Review auto-generated migrations:**

Alembic peut manquer:
- Renommages de colonnes (génère drop + add)
- Changements de contraintes
- Données à migrer

**4. Add data migrations if needed:**

```python
# In migration file
def upgrade():
    # Schema change
    op.add_column('project', sa.Column('new_field', sa.String(100)))

    # Data migration
    connection = op.get_bind()
    connection.execute(
        "UPDATE project SET new_field = 'default' WHERE new_field IS NULL"
    )
```

---

### Common Migration Scenarios

**Add Column:**

```python
def upgrade():
    op.add_column('project', sa.Column('archived', sa.Boolean(), nullable=False, server_default='0'))

def downgrade():
    op.drop_column('project', 'archived')
```

**Rename Column:**

```python
def upgrade():
    op.alter_column('project', 'old_name', new_column_name='new_name')

def downgrade():
    op.alter_column('project', 'new_name', new_column_name='old_name')
```

**Add Index:**

```python
def upgrade():
    op.create_index('ix_project_title', 'project', ['title'])

def downgrade():
    op.drop_index('ix_project_title', 'project')
```

---

## Code Style

### Python (Backend)

**Standards:**
- PEP 8 compliance
- Type hints on all functions
- Docstrings (Google style)
- Max line length: 120 chars

**Tools:**

```bash
# Format
black app/

# Sort imports
isort app/

# Lint
flake8 app/

# Type check
mypy app/
```

**Example:**

```python
from typing import Optional

async def get_project(
    project_id: int,
    user: User,
    *,
    with_sources: bool = False
) -> Project:
    """Get project by ID with ownership verification.

    Args:
        project_id: Project primary key
        user: Current authenticated user
        with_sources: Whether to eager-load sources

    Returns:
        Project instance

    Raises:
        HTTPException: 404 if project not found or not owned by user
    """
    # Implementation...
```

---

### TypeScript (Frontend)

**Standards:**
- Strict mode enabled
- Explicit types (avoid `any`)
- Props interfaces for components
- Max line length: 100 chars

**Tools:**

```bash
# Lint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Type check
npm run type-check
```

**Example:**

```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}: ButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}
```

---

### File Organization

**Backend:**
- Max 300 lines per file
- One class/service per file
- Clear separation: models → schemas → services → routes

**Frontend:**
- One component per file
- Co-locate styles if using CSS modules
- Index files for barrel exports

---

## Deployment

### Production Checklist

**Backend:**

- [ ] Set `ENVIRONMENT=prod` in `.env`
- [ ] Configure `CORS_ALLOWED_ORIGINS`
- [ ] Use strong `JWT_SECRET` and `FERNET_SECRET_KEY`
- [ ] Set `LOG_LEVEL=INFO` or `WARNING`
- [ ] Run migrations: `alembic upgrade head`
- [ ] Use production WSGI server (Gunicorn + Uvicorn workers)
- [ ] Set up HTTPS reverse proxy (nginx/Caddy)
- [ ] Configure log aggregation (Sentry, Datadog)
- [ ] Set up monitoring (uptime, errors)
- [ ] Backup database regularly

**Frontend:**

- [ ] Build: `npm run build`
- [ ] Serve static files via nginx/Caddy
- [ ] Set `VITE_API_BASE_URL` to production API
- [ ] Enable gzip compression
- [ ] Set cache headers for assets
- [ ] Configure CDN (optional)

---

### Docker Deployment (Production)

**Dockerfile (Backend):**

See `backend/Dockerfile`. It uses `python:3.13-slim` and installs `ffmpeg` and `pandoc`.

**docker-compose.yml:**

Use the `docker-compose.yml` at the root of the project to run the full stack (Backend + PostgreSQL).

**Running with Docker:**

1.  **Configure Environment:**
    Ensure your `.env` file in `backend/` has the production settings, or set environment variables in your deployment platform.
    
    Crucially, set:
    ```env
    DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
    ENVIRONMENT=prod
    ```
    *(Note: `docker-compose.yml` sets a default internal `DATABASE_URL` for the `backend` service that matches the `db` service configuration)*

2.  **Build and Start:**
    ```bash
    docker-compose up --build -d
    ```

3.  **Verify:**
    - Backend: http://localhost:8000/docs
    - Logs: `docker-compose logs -f backend`

**Data Persistence:**
- Database data is stored in the `postgres_data` volume.
- Audio files are stored in the `audio_storage` volume.

---

### Nginx Configuration

```nginx
# Backend proxy
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts for long uploads
        client_max_body_size 500M;
        proxy_read_timeout 600s;
    }
}

# Frontend static
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/champollion/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### Environment-Specific Settings

**Development:**
```env
ENVIRONMENT=dev
LOG_LEVEL=DEBUG
CORS_ALLOWED_ORIGINS=  # Empty = allow localhost
```

**Production:**
```env
ENVIRONMENT=prod
LOG_LEVEL=INFO
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## Troubleshooting

### Common Issues

**1. Import Errors**

```
ModuleNotFoundError: No module named 'app'
```

**Solution:**
```bash
# Ensure you're in backend/ directory
cd backend

# Activate venv
source .venv/bin/activate

# Reinstall
pip install -r requirements.txt
```

---

**2. Database Locked**

```
sqlite3.OperationalError: database is locked
```

**Solution:**
- SQLite doesn't handle high concurrency
- Close other connections to DB
- For production, use PostgreSQL

---

**3. FFmpeg Not Found**

```
FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'
```

**Solution:**
```bash
# Install FFmpeg
# macOS
brew install ffmpeg

# Ubuntu
sudo apt install ffmpeg
```

---

**4. Pandoc Not Found**

```
FileNotFoundError: [Errno 2] No such file or directory: 'pandoc'
```

**Solution:**
```bash
# Install Pandoc
# macOS
brew install pandoc

# Ubuntu
sudo apt install pandoc
```

---

**5. CORS Errors**

```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**
- Check `CORS_ALLOWED_ORIGINS` in backend `.env`
- Ensure frontend URL is whitelisted
- Restart backend after `.env` changes

---

**6. 401 Unauthorized**

```
{"detail":"Not authenticated"}
```

**Solution:**
- Token expired (default: 1h)
- Re-login to get new token
- Check token in localStorage (DevTools → Application → Local Storage)

---

**7. Rate Limit Exceeded**

```
{"detail":"Rate limit exceeded"}
```

**Solution:**
- Wait 60 seconds
- Reduce request frequency
- Adjust limits in `main.py` for dev

---

### Debug Mode

**Backend:**

```python
# app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Or via .env
LOG_LEVEL=DEBUG
```

**Frontend:**

```typescript
// Enable React DevTools
// Chrome: Install React Developer Tools extension

// Log API calls
console.log('API Request:', url, options);
```

---

### Performance Profiling

**Backend:**

```bash
# Install
pip install py-spy

# Profile running app
py-spy top --pid <uvicorn_pid>

# Generate flamegraph
py-spy record -o profile.svg -- python -m uvicorn app.main:app
```

**Frontend:**

```bash
# Build with source maps
npm run build -- --sourcemap

# Analyze bundle
npm run build -- --mode analyze
```

---

## Resources

**Documentation:**
- FastAPI: https://fastapi.tiangolo.com/
- SQLAlchemy: https://docs.sqlalchemy.org/
- React: https://react.dev/
- Vite: https://vitejs.dev/

