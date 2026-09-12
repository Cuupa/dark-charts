# Architecture & Code Conventions

Dark Charts is a Next.js 16 App Router application backed by Supabase PostgreSQL. It follows the same general system as the [darktunes-website](https://github.com/Neuroklast/darktunes-website) family.

## Core principles

- No god-object files — split UI, hooks, DAL, and domain services into focused modules.
- Strict TypeScript — no `any` in production code or test mocks. At API boundaries use `unknown` + type guards; validate with Zod.
- Reuse hooks/utilities; prop-drill at most two levels.
- Prefer native HTML/JS over heavy NPM packages when practical.
- No speculative features (YAGNI).

## Request flow

```
Browser → app/(main)/* pages → fetch /api/* → src/lib/* → Supabase (service role)
```

Public chart data is served from aggregated `chart_entries`. Voting writes go through transactional helpers in `src/lib/api/`.

## Layers

| Layer | Path |
|-------|------|
| App Router (routes/pages) | `app/` |
| API Route Handlers | `app/api/**/route.ts` |
| Domain services | `src/backend/services/` |
| Domain repositories | `src/backend/repositories/` (interfaces + Supabase impls) |
| DAL | `src/lib/api/` |
| Math / algorithms | `src/lib/math/` |
| UI | `src/components/` |
| Hooks | `src/hooks/` |

## Chart pillars

| Pillar | Source | Notes |
|--------|--------|-------|
| Fan | `votes` + quadratic credits | Trust-weighted, weekly, `weekStart` on each ballot |
| Expert (Club) | `expert_votes` | Verified DJs, top-10 bulk, rank points × reputation, shrunk toward weekly prior; reputation learns from later Fan Top 20 |
| Streaming | `streaming_snapshots` | Public popularity view only; not in combined |
| Airplay | `airplay_events` → `airplay_snapshots` | Tracker only; not in combined (playlist pitching). Radio metadata via Docker worker, not Vercel. |
| Combined | `ChartAggregationService` | Fan + expert only; streaming/airplay discarded |

Weekly cron (`/api/cron/aggregate-charts`) runs aggregation and anomaly detection. `/api/cron/reset-credits` (Monday 00:00 UTC) refreshes fan credit budgets independently. High-severity unresolved anomalies block voting on affected releases (`/api/vote/blocked-releases`).

## Key modules

| Area | Path |
|------|------|
| Fan voting | `src/lib/api/fan-vote.ts`, `app/api/vote/route.ts` |
| Vote conflicts | `src/lib/vote-conflicts.ts` |
| Anomaly guard | `src/lib/vote-anomaly.ts`, `src/lib/vote-anomaly-guard.ts` |
| Math | `src/lib/math/quadratic.ts`, `fan-scoring.ts`, `expert-ranking.ts`, `borda.ts`, `normalization.ts` |
| Aggregation | `src/backend/services/ChartAggregationService.ts` |
| Streaming calc | `src/backend/services/StreamingChartCalculationService.ts` |
| Spotlight | `app/api/spotlight/*`, `src/lib/stripe.ts` |
| Auth | `src/backend/services/AuthService.ts`, `src/lib/api-auth.ts` |
| Sync | `src/lib/sync/*`, `src/lib/api/syncQueue.ts` |
| Charts UI | `app/(main)/_components/ChartShellClient.tsx` |

## Routing & navigation

URL-based navigation via Next.js `<Link>`. Route helpers in `src/lib/routes.ts`. Public chart routes live under `app/(main)/`.

## Inversion of control

- Chart pages receive data via `ChartShellClient` context or props.
- Admin containers receive callbacks via props (`AdminPageShell`).
- No direct Supabase reads in presentational components; DAL functions take `SupabaseClient<Database>` as their first argument.

## Server vs client components

Default to RSC. Add `"use client"` only for event handlers, browser APIs, hooks, Framer Motion, or Recharts. Pattern: RSC parent fetches → client leaf animates/interacts.

## Error handling

- API: `withErrorHandler` + `ApiError` (`src/lib/errors.ts`), never manual `NextResponse.json({ error })`.
- UI: `app/error.tsx`, `app/global-error.tsx`, `ErrorBoundary`.

## Metadata & loading

- Every `page.tsx` exports `metadata` or `generateMetadata()` — never `<title>` in JSX.
- Async route segments provide `loading.tsx` with skeleton parity (`src/components/skeletons/`).

## Naming & structure

| Kind | Convention |
|------|------------|
| Components | `PascalCase.tsx` |
| Hooks | `useCamelCase.ts` |
| DAL | `camelCase.ts`, `verbNoun` functions |
| Math | `camelCase.ts` |
| Tests | co-located `*.test.ts(x)` |

`@/` → `src/`. Files under `app/` use relative imports.

## State management

No global state library. Server state → RSC/ISR. Shared UI → providers context. Forms → `react-hook-form` + Zod.

## Cross-references

- Schema, R2 keys, sync queue → [data-and-schema.md](data-and-schema.md)
- Tailwind, a11y, theme, Lenis → [frontend.md](frontend.md)
- API auth, RBAC, cron, Stripe → [backend.md](backend.md)
- Chart/voting/product surface → [features.md](features.md)
