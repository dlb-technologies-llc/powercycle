#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/backend
bun run db:migrate

echo "Starting services..."
cleanup() { kill "$CADDY_PID" "$BACKEND_PID" 2>/dev/null; }
trap cleanup EXIT

caddy run --config /etc/caddy/Caddyfile &
CADDY_PID=$!

cd /app
API_PORT=3001 bun run packages/backend/src/server.ts &
BACKEND_PID=$!

wait
