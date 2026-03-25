#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/backend
bun run db:migrate || echo "Warning: migrations failed, continuing..."

echo "Starting services..."
set +e
caddy run --config /etc/caddy/Caddyfile &
cd /app
API_PORT=3001 bun run packages/backend/src/server.ts &
wait
