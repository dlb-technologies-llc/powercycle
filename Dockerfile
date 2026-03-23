# Stage 1: Build
FROM oven/bun:1-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build frontend
RUN cd packages/frontend && bun run build

# Stage 2: Production
FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy everything needed to run
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/backend ./packages/backend
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist

# Copy drizzle config and migrations for db:migrate
COPY --from=builder /app/packages/backend/drizzle.config.ts ./packages/backend/
COPY --from=builder /app/packages/backend/src/db ./packages/backend/src/db

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
