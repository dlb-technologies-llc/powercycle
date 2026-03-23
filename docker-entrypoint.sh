#!/bin/sh
set -e

echo "Running database migrations..."
cd packages/backend && bun run db:migrate && cd ../..

echo "Starting server..."
exec bun run packages/backend/src/server.ts
