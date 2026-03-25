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
- Pattern: `Effect.gen(...).pipe(Effect.provide(ServiceLayer))`

## Database

- Schema: `packages/backend/src/db/schema.ts`
- Migrations: `bun run db:generate` then `bun run db:migrate`
- Drizzle `numeric()` returns strings -- cast with `Number()` in handlers

## Frontend

- Astro server-rendered pages with React islands (`client:load`)
- `@effect/atom-react` for state: query atoms (reactive) vs mutation atoms (imperative)
- API client: `AtomHttpApi.Service` at `src/atoms/client.ts`
- Tailwind 4 with `@tailwindcss/vite` plugin

## Conventions

- **Tabs** for indentation, **double quotes** for strings
- Branch naming: `feat/<description>`, `fix/<description>`
- Errors: `Schema.TaggedErrorClass` with descriptive `_tag`
- Query functions in `src/lib/queries.ts` wrapped in `Effect.tryPromise`
