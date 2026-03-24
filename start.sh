#!/bin/sh
set -e

cd /app/packages/backend
if command -v drizzle-kit > /dev/null 2>&1; then
  bun run db:migrate || echo "Warning: migrations failed"
else
  echo "drizzle-kit not available, skipping migrations"
fi

set +e
caddy run --config /etc/caddy/Caddyfile &
API_PORT=3001 bun run src/server.ts &
wait
