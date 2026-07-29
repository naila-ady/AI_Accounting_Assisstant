#!/bin/sh
set -e

echo "Starting server (tables created automatically on startup)..."
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
