# PowerCycle

A self-hosted powerbuilding workout tracker based on the PRIME Powerbuilding Program (5/3/1 style).

## Quick Start

```bash
cp .env.example .env
# Edit .env with your passwords
docker compose up -d
```

The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_PASSWORD` | Yes | - | Password for the admin user |
| `AUTH_SECRET` | Yes | - | Secret for signing session tokens (32+ chars) |
| `POSTGRES_PASSWORD` | No | `powercycle` | Postgres password |
| `PORT` | No | `3000` | Server port |

## Development

```bash
# Start Postgres
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
bun install

# Start backend
cd packages/backend && bun run start

# Start frontend (separate terminal)
cd packages/frontend && bun run dev
```

## Tech Stack

- **Runtime**: Bun
- **Backend**: Effect v4, Drizzle ORM, PostgreSQL
- **Frontend**: React 19, TanStack Router, TanStack Query, Tailwind CSS v4
- **Testing**: Vitest, @effect/vitest

## Project Structure

```
packages/
  shared/     # Domain logic, schemas, calculation engine
  backend/    # Effect HTTP API server
  frontend/   # TanStack Router SPA
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run lint:fix` | Fix linting issues |
| `bun run typecheck` | Type check all packages |
| `bun run test:unit` | Run unit tests |
| `bun run docker:dev` | Start dev Postgres |
| `bun run docker:down` | Stop dev Postgres |
| `bun run docker:logs` | Tail dev Postgres logs |
| `bun run db:generate` | Generate DB migrations |
| `bun run db:migrate` | Apply DB migrations |

