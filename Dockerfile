FROM oven/bun:1-alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/frontend/node_modules ./packages/frontend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules
COPY packages/frontend ./packages/frontend
COPY packages/shared ./packages/shared
COPY packages/backend/package.json ./packages/backend/
COPY package.json bun.lock tsconfig.json ./

RUN bun run --filter @powercycle/frontend build

FROM oven/bun:1-alpine AS runner

RUN apk add --no-cache caddy curl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/packages/frontend/dist /srv
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared
COPY package.json bun.lock ./
COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh /app/start.sh

RUN rm -rf /app/packages/backend/node_modules && \
    ln -s /app/node_modules /app/packages/backend/node_modules && \
    rm -rf /app/packages/shared/node_modules && \
    ln -s /app/node_modules /app/packages/shared/node_modules && \
    chmod +x /app/start.sh

EXPOSE 80

CMD ["/app/start.sh"]
