#!/bin/bash
# Robust dev server wrapper that loads .env properly (sandbox system env override issue)
cd /home/z/my-project

while true; do
  echo "[$(date)] Starting dev with .env loaded..."
  # Load .env vars explicitly, override system env
  set -a
  source <(grep -v "^#" .env | grep -v "^$" | sed 's/^export //')
  set +a
  echo "[$(date)] DATABASE_URL=$DATABASE_URL"
  bun run next dev -H 0.0.0.0 -p 3000 >> dev.log 2>&1
  EXIT=$?
  echo "[$(date)] Exited with $EXIT, restarting in 3s..."
  sleep 3
done
