# CLAUDE.md

## Stack

- **Bun** monorepo with workspace packages (shared, backend, frontend)
- **Effect v4** (4.0.0-beta.40) -- `ServiceMap.Service`, `Schema.TaggedErrorClass`
- **Astro 6** + React 19 islands
- **Drizzle ORM** + PostgreSQL
- **Tailwind CSS 4**
- **Biome** for linting/formatting

## Effect v4 Imports

```typescript
// Core
import { Effect, Layer, Schema, ServiceMap, Redacted } from "effect"

// HTTP (unstable)
import { HttpRouter, HttpClient, FetchHttpClient } from "effect/unstable/http"
import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi"

// Frontend atoms
import { AtomHttpApi } from "effect/unstable/reactivity"
```

## Service Architecture

Services are **pure FP** -- no database operations, no side effects:

```typescript
export class MyService extends ServiceMap.Service<MyService, {
  readonly myMethod: (input: Input) => Effect.Effect<Output, MyError>
}>()(
  "@powercycle/MyService"
) {}

export const MyServiceLive = Layer.succeed(MyService)({ ... })
```

- `Layer.succeed(Service)({...})` -- curried form (v4)
- `Layer.effect(Service)(Effect.gen(...))` -- when service needs deps
- Handlers do DB queries via `Effect.tryPromise` + Drizzle
- Pure services do validation, entity creation, business logic

## Pre-Commit Checklist (MANDATORY)

```bash
bun run lint:fix
bun run typecheck
bun run test:unit
```

## Testing

- **Unit**: `@effect/vitest` with `it.effect()`, mock layers in `test/fixtures/`
- **E2E**: Playwright at `packages/frontend/tests/`
- Preferred pattern: `layer(ServiceLive)("describe block", (it) => { it.effect(...) })` -- provides the layer once for the entire describe block
- Legacy pattern: `Effect.gen(...).pipe(Effect.provide(ServiceLayer))` per test

## Local Docker Stack

- `bun run docker:dev` -- starts Postgres + app (mirrors production: Caddy + Bun backend + Astro static)
- `bun run docker:down` -- tears down
- App: `http://localhost:4321`, Postgres: `localhost:5433`
- Ports configurable via `APP_PORT` and `POSTGRES_PORT` env vars
- **E2E against Docker**: `bun run test:e2e:docker`
- **Docker-in-Docker networking**: this sandbox can't reach `localhost:4321` directly. Fix:
  1. `docker network connect <stack-network> $(hostname)` to join the dev stack network
  2. `BASE_URL=http://powercycle-dev-app:80 bun run test:e2e:docker` to point Playwright at the container

## Database

- Schema: `packages/backend/src/db/schema.ts`
- Migrations: `bun run db:generate` then `bun run db:migrate`
- Drizzle `numeric()` returns strings -- cast with `Number()` in handlers

## Frontend

- Astro server-rendered pages with React islands (`client:load`)
- `@effect/atom-react` for state: query atoms (reactive) vs mutation atoms (imperative)
- API client: `AtomHttpApi.Service` at `src/atoms/client.ts`
- Tailwind 4 with `@tailwindcss/vite` plugin

## Design Theme

Nike-inspired light-mode brand. Clean, bold, minimal — NOT dark mode.

**Colors:**
- Background: white (#ffffff)
- Text: black (#000000) primary, gray-600 (#4b5563) secondary
- Cards: white, 1px solid #e5e7eb border
- Inputs: white, #d1d5db border, black border on focus
- Danger: red-600

**Typography:** Inter (400/500/600/700) for all text. JetBrains Mono for numbers/weights.

**Shared CSS classes** (defined in `packages/frontend/src/styles/global.css`):
- `.btn-primary` — black bg, white text (Nike signature)
- `.btn-secondary` — outlined, dark text
- `.btn-danger` — red bg, white text
- `.btn-ghost` — text-only
- `.card` — white bg, gray border, rounded-xl
- `.input` — bordered, compact (text-sm), black focus ring
- `.badge` — small pill for metadata
- `.label` — small gray label text

**Rules:**
- No dark mode classes (bg-neutral-950, bg-neutral-900, text-neutral-100, etc.)
- No gradients, glow, glass-morphism, or indigo accent
- Inputs must be compact — never text-xl or larger
- Timer display is text-based (bold monospace) — no SVG circle/ring
- Use shared CSS classes from global.css, not inline Tailwind strings for common patterns

## Workout Data

- `skipped` boolean on workout_sets — skipped sets are real data, not faked completions. Records that the user chose to skip (time constraints, etc.)
- End cycle: `POST /api/cycles/current/end` — ends active cycle only (sets completedAt)
- Start next: `POST /api/cycles/next` — ends current + creates new cycle with updated 1RMs

## Shared Schema Locations

- **UUID**: `packages/shared/src/schema/common.ts` -- `Schema.String.check(Schema.isUUID())`; import from `../common.js`
- **DAY_NAMES**: `packages/shared/src/schema/program.ts` -- `Record<TrainingDay, string>` mapping day numbers to display names
- **DEFAULT_USER_ID**: `packages/backend/src/lib/constants.ts` -- centralized default user constant

## Entity Pattern (Cast-Free)

Entities use `Schema.Class` with a static `DrizzleRow` schema for decoding DB rows. The `DrizzleRow` schema uses branded types (e.g., `Schema.NumberFromString`) to handle Drizzle's string numerics without `as` casts:

```typescript
export class Cycle extends Schema.Class<Cycle>("Cycle")({
  id: UUID,
  squat1rm: Schema.NullOr(Schema.Number),
  // ...
}) {
  static readonly DrizzleRow = Schema.Struct({
    id: UUID,
    squat1rm: Schema.NullOr(Schema.NumberFromString), // string → number
    // ...
  });

  static decodeRow(row: unknown) {
    return Schema.decodeUnknownEffect(Cycle.DrizzleRow)(row).pipe(
      Effect.map((data) => new Cycle(data)),
      Effect.mapError((e) => new InternalError({ message: `Cycle decode failed: ${e}` })),
    );
  }
}
```

No `as never`, no `as number` -- all conversions flow through the schema.

## Query Helpers

- `firstRow()` helper in `packages/backend/src/lib/queries.ts` -- safely extracts the first row from a query result via `Effect.succeed`/`Effect.fail`, replacing `rows[0]!` patterns

## Conventions

- **Tabs** for indentation, **double quotes** for strings
- Branch naming: `feat/<description>`, `fix/<description>`
- Errors: `Schema.TaggedErrorClass` with descriptive `_tag`
- Query functions in `src/lib/queries.ts` wrapped in `Effect.tryPromise`
- **No `as` casts or `!` assertions** -- Biome `noNonNullAssertion` enforced project-wide
