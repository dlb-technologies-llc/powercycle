#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/backend
bun run db:migrate || echo "Warning: migrations failed (may not exist yet)"
cd /app

PORT="${PORT:-3000}"
API_PORT=$((PORT + 1))

if [ "$NODE_ENV" = "production" ] && [ -f /app/packages/frontend/dist/index.html ]; then
	echo "Starting API server on port $API_PORT..."
	PORT=$API_PORT bun run /app/packages/backend/src/server.ts &

	echo "Starting static server on port $PORT..."
	exec bun run /app/packages/backend/src/static-server.ts
else
	echo "Starting API server on port $PORT..."
	exec bun run /app/packages/backend/src/server.ts
fi
