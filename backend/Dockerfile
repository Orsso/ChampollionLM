# Backend Dockerfile
# Multi-stage build: Frontend + Backend in one image
# Build context: Repository root

# ============================================
# Stage 1: Frontend Build
# ============================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# Build with empty base URL (paths already include /api prefix)
ENV VITE_API_BASE_URL=
RUN npm run build

# ============================================
# Stage 2: Backend (Python)
# ============================================
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system dependencies required for audio processing and document generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    pandoc \
    gcc \
    python3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (path from repo root)
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Create a non-root user and switch to it for security
RUN useradd -m -u 1000 champollion && \
    chown -R champollion:champollion /app

# Copy backend application code (path from repo root)
COPY --chown=champollion:champollion backend/ .

# Copy frontend build artifacts from Stage 1
COPY --from=frontend-builder --chown=champollion:champollion /app/frontend/dist /app/static

# Create storage directory and ensure permissions
RUN mkdir -p storage/audio && \
    chown -R champollion:champollion storage

USER champollion

EXPOSE 8000

# Default command: Start the application (migrations already applied via Direct Connection locally)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
