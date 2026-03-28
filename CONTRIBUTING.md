# Contributing to PowerCycle

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (recommended) or a local PostgreSQL instance

## Getting Started

```bash
# Clone the repository
git clone <repo-url> && cd powercycle

# Install dependencies
bun install

# Start PostgreSQL via Docker
bun run docker:dev

# Generate and run database migrations
bun run db:generate
bun run db:migrate

# Start development servers (frontend + backend)
bun run dev
```

Once running, the frontend is at http://localhost:4321 and the backend API at http://localhost:3000.

## Project Structure

```
packages/
  shared/     # Domain schemas, engine logic, API contract, error types
  backend/    # Effect HTTP API server, Drizzle DB, pure FP services
  frontend/   # Astro 6 SSR pages + React 19 interactive islands
```

- **shared** is framework-agnostic (only depends on Effect Schema) and defines the types and logic used by both backend and frontend.
- **backend** implements HTTP handlers that compose pure services with database queries.
- **frontend** uses Astro for server-rendered pages and React islands (`client:load`) for interactivity, with `@effect/atom-react` for state management.

## Development Workflow

### Before Every Commit

Run all three checks -- CI will reject PRs that fail any of them:

```bash
bun run lint:fix    # Auto-fix formatting and lint issues (Biome)
bun run typecheck   # TypeScript type checking across all packages
bun run test:unit   # Vitest unit tests
```

### Running Tests

```bash
# Unit tests
bun run test:unit

# E2E tests (requires dev servers running)
bun run test:e2e

# E2E tests against Docker stack
bun run test:e2e:docker
```

## Branch Naming

- `feat/<description>` -- new features
- `fix/<description>` -- bug fixes

## Code Conventions

### Formatting

- **Tabs** for indentation, **double quotes** for strings (enforced by Biome)

### TypeScript Rules

- No `as` type casts or `!` non-null assertions in production code
- All types flow from Effect Schemas -- no parallel type definitions
- Errors use `Schema.TaggedErrorClass` with a descriptive `_tag`
- Query functions go in `src/lib/queries.ts`, wrapped in `Effect.tryPromise`

### Testing Rules

- Test data uses schema-derived arbitraries via `Arbitrary.make()` -- no hardcoded UUIDs or factory functions
- Unit tests use `@effect/vitest` with `it.effect()` and mock layers in `test/fixtures/`
- Pattern: `Effect.gen(...).pipe(Effect.provide(ServiceLayer))`

## Docker Development

```bash
bun run docker:dev    # Start PostgreSQL + app
bun run docker:down   # Tear down the stack
bun run docker:logs   # Follow container logs
```

- **App**: http://localhost:4321
- **PostgreSQL**: localhost:5433
- Ports are configurable via `APP_PORT` and `POSTGRES_PORT` environment variables

To run E2E tests against the Docker stack:

```bash
bun run test:e2e:docker
```

## Pull Requests

- PRs target `main`
- CI runs lint, typecheck, and unit tests on every PR
- PRs that close an issue must include `Closes #N` in the PR body
