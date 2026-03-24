#!/bin/sh
set -e
cd /app/packages/backend
bun run db:migrate || echo "Warning: migrations failed"
set +e
caddy run --config /etc/caddy/Caddyfile &
API_PORT=3001 bun run src/server.ts &
wait
