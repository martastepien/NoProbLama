#!/usr/bin/env bash
# Start the NoProbLama API on http://localhost:8000
set -e
cd "$(dirname "$0")"
python3 -m pip install -r requirements.txt --quiet --break-system-packages 2>/dev/null || python3 -m pip install -r requirements.txt --quiet
exec python3 -m uvicorn app.main:app --reload --port 8000
