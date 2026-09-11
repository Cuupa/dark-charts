# E2E Test Coverage — Tracking

> **Current state:** Dark Charts ships **co-located Vitest unit tests** only (`src/**/*.test.ts(x)`). There is **no Playwright E2E suite yet** — `package.json` has no `test:e2e` script and no `tests/` directory. This file is the tracking plan for end-to-end coverage once Playwright is introduced, and documents the intended route/feature areas so we can carve it into phases.

Goal: Playwright E2E coverage for every route/feature area across the public frontend and `/admin`, ideally against a **real local Supabase stack** (Postgres + Auth via the Supabase CLI) rather than mocks — as close to production as possible without touching production data.

Update the checkboxes as work lands; don't let this drift from reality.

## Status legend

- [ ] not started
- [~] in progress
- [x] done

## Current coverage

| Area | Status |
|------|--------|
| Co-located Vitest unit tests (`src/**/*.test.ts(x)`) | ✅ (23 files) |
| Playwright E2E | [ ] not implemented |

## Phase 1 — E2E foundation (planned)

- [ ] Add `@playwright/test` + `playwright.config.ts` (projects: Desktop Chrome, Mobile Safari/Chrome)
- [ ] Local DB: Supabase CLI local stack (`supabase start`), apply `reset.sql` only
- [ ] `.env.e2e` document (generated locally; never committed)
- [ ] Auth fixtures via GoTrue admin API (service-role), not raw SQL
- [ ] `workers: 1` for DB-backed runs; prefixed `e2e-<testId>` identifiers + cleanup

## Phase 2 — Coverage: public frontend

- [ ] Home current charts render (F/E/S/Combined)
- [ ] Chart detail per pillar; archive + history
- [ ] Genre main + subgenre pages
- [ ] Custom charts builder
- [ ] Methodology / about / imprint / privacy / terms
- [ ] Voting happy path + receipt + confirmation
- [ ] Voting: unverified voter blocked (403)
- [ ] Spotlight page and Stripe checkout redirect
- [ ] `/api/v1/*` Bearer guard (401 without token)

## Phase 3 — Coverage: `/admin`

- [ ] Section contract per route (route mounts, authorizes, renders heading, no error boundary)
- [ ] Artists, releases CRUD
- [ ] Chart control (pause/voting, recalc)
- [ ] Anomalies review; Users (role/suspend); Spotlight approvals; Badges; Promotions; Metrics
- [ ] Settings (chart weights + credit budget), Features, Colors, API Keys, System
- [ ] Access control: unauthenticated → `/login`; non-admin → `?error=unauthorized`

## Phase 4 — Chart integrity (cross-cutting)

- [ ] Async data: manual artist sync drains `sync_queue`; R2 artwork cached
- [ ] Aggregation cron runs and produces anomalies; high-severity anomaly blocks voting on affected release
- [ ] No route can write a paid signal into a ranking pillar (Spotlight isolation spot-check)

## Notes

- **Skip gracefully** when Supabase is unconfigured; CI should provision its own local stack.
- Reuse test helpers once they exist; wait on **pathname** for auth transitions, never a full-URL substring (`returnTo=/x` queries falsely satisfy a full-URL wait before the session cookie is written).
- Never weaken/`skip` a test to make it green; reconcile intent instead.
