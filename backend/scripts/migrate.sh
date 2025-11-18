#!/bin/bash
# Production database migration script
# Run this script before starting the application in production

set -e

cd "$(dirname "$0")/.."

echo "🔄 Running database migrations..."
alembic upgrade head

echo "✅ Database migrations completed successfully"

