# Backend Dockerfile
# Base image matching development requirement (Python 3.13)
FROM python:3.13-slim

# Set environment variables
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

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Create a non-root user and switch to it for security
RUN useradd -m -u 1000 champollion && \
    chown -R champollion:champollion /app

# Copy application code with correct ownership
COPY --chown=champollion:champollion . .

# Create storage directory and ensure permissions
RUN mkdir -p storage/audio && \
    chown -R champollion:champollion storage

USER champollion

# Default command: Run migrations and start the application
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
