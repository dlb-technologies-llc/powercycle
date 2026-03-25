# PowerCycle

PRIME Powerbuilding training program management app. Track training cycles, log workouts, and manage progression through the PRIME periodization system.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) monorepo
- **Backend**: [Effect v4](https://effect.website) (beta) -- pure FP services, typed HTTP API
- **Frontend**: [Astro 6](https://astro.build) + [React 19](https://react.dev) islands
- **Database**: [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Testing**: [Vitest](https://vitest.dev) + [@effect/vitest](https://effect.website) (unit), [Playwright](https://playwright.dev) (E2E)
- **Linting**: [Biome](https://biomejs.dev)

## Monorepo Structure

```
packages/
├── shared/     # Domain engine, schemas, API contract, errors
├── backend/    # Effect HTTP API server, Drizzle DB, services
└── frontend/   # Astro SSR + React islands
```

### packages/shared

Pure TypeScript domain logic -- no framework dependencies except Effect Schema.

- `src/engine/` -- Workout calculations (1RM, progression, set generation)
- `src/schema/` -- Domain schemas (lifts, program config, API responses)
- `src/api/Api.ts` -- Type-safe HTTP API contract (shared between frontend & backend)
- `src/errors/` -- Tagged error classes (domain + HTTP)

### packages/backend

Effect v4 HTTP API server with pure FP service architecture.

- `src/services/` -- Pure services (no DB ops): CycleService, WorkoutService, ConfigService
- `src/api/` -- HTTP handlers using `HttpApiBuilder.group`
- `src/lib/queries.ts` -- Drizzle query functions wrapped in `Effect.tryPromise`
- `src/db/schema.ts` -- Drizzle PostgreSQL schema
- `test/services/` -- 100% coverage for service layer
- `test/handlers/` -- Handler business logic tests

### packages/frontend

Astro 6 server-rendered site with React interactive islands.

- `src/pages/` -- Astro file-based routing
- `src/components/` -- React islands (`client:load`)
- `src/atoms/` -- `@effect/atom-react` state management (query + mutation patterns)
- `tests/` -- Playwright E2E tests

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [PostgreSQL](https://postgresql.org) (or use Docker)

### Setup

```bash
# Install dependencies
bun install

# Start PostgreSQL (via Docker)
bun run docker:dev

# Generate and run migrations
bun run db:generate
bun run db:migrate

# Start development servers
bun run dev
```

### Development URLs

- Frontend: http://localhost:4321
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/api/health

## Architecture

### Service Pattern (Pure FP)

Services are pure -- no database operations, no side effects:

```typescript
export class CycleService extends ServiceMap.Service<CycleService, {
  readonly createEntity: (...) => Effect.Effect<CycleData>
  readonly advancePosition: (cycle: CycleData) => Effect.Effect<CycleData>
}>()(
  "@powercycle/CycleService"
) {}
```

### Handler Pattern

Handlers compose pure services with DB queries:

```
Handler = query DB -> pure service method -> respond
```

### Layer Composition

```
ServerLive
  └── ApiLive (HttpApiBuilder)
       └── HandlerLive (cycles, workouts, health)
            └── ServiceLive (CycleLive, WorkoutLive, DatabaseService, ConfigLive)
```

### Frontend State (Atoms)

- **Query atoms**: `useAtomValue` -> reactive Result
- **Mutation atoms**: `useAtomSet` with `mode: "promiseExit"` -> `Promise<Exit>`

## Testing

```bash
# Unit tests (vitest)
bun run test:unit

# E2E tests (playwright -- requires running servers)
bun run test:e2e

# All tests
bun run test

# Coverage
bun run test:unit -- --coverage
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start frontend + backend |
| `bun run dev:server` | Backend only |
| `bun run dev:frontend` | Frontend only |
| `bun run build` | Build frontend |
| `bun run lint` | Check with Biome |
| `bun run lint:fix` | Auto-fix with Biome |
| `bun run typecheck` | TypeScript check |
| `bun run test:unit` | Vitest unit tests |
| `bun run test:e2e` | Playwright E2E tests |
| `bun run docker:dev` | Start PostgreSQL |
| `bun run db:generate` | Generate migrations |
| `bun run db:migrate` | Run migrations |
