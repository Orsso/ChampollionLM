# Development Guide

---

## Prerequisites

| Dependency | Required | Notes |
|------------|----------|-------|
| Python | 3.13+ | Backend |
| Node.js | 20+ | Frontend |
| FFmpeg | Yes | Audio processing |
| Pandoc | Optional | PDF export |

---

## Setup

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `FERNET_SECRET_KEY` | Encryption key for API keys |
| `JWT_SECRET` | JWT signing secret |
| `DATABASE_URL` | Database connection string |
| `FILE_STORAGE_ROOT` | Audio file storage path |
| `ENVIRONMENT` | `dev` or `prod` |

**Generate secrets:**
```bash
# Fernet key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |

---

## Testing

```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test
```

---

## Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Deployment

### Docker

```bash
docker compose up --build
```



