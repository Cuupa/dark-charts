# Testing & Performance

## Unit tests (Vitest)

```bash
npm test            # single run
npm run precheck    # fast Vitest run
npm run test:watch  # (not wired; use --watch)
```

- Vitest + Testing Library (`jsdom`).
- Tests are **co-located** as `src/**/*.test.ts(x)`.
- Mock external APIs; no network in unit tests.
- Cover the math (quadratic, fan-scoring, expert-ranking, genre-aggregation, week), vote write path (`fan-vote.ts`, `weekStart` isolation, credit rollback), credit reset, voting eligibility window, live-chart empty fallback, vote conflict/anomaly logic, sync queue, import/seed, and admin views.

Coverage baseline includes: `src/lib/math/*`, `src/lib/vote-conflicts.ts`, `src/lib/vote-anomaly.ts`, `src/lib/vote-anomaly-guard.ts`, `src/lib/trust-level.ts`, `src/lib/week.ts`, `src/lib/youtube-metrics.ts`, `src/lib/itunesApi.ts`, `src/lib/charts/itunesChartStore.ts`, `src/lib/sync/itunesSyncQueue.ts`, `src/lib/catalog/importDarktunes.ts`, `src/lib/catalog/seedConsolidatedArtists.ts`, `src/lib/artists/consolidatedArtists.ts`, `src/lib/genre-aggregation.ts`, `src/config/vercel.config.test.ts`, and admin views (`ArtistBlacklistView`, `ChartControlView`, `DashboardMetricsView`, `PromotionApprovalView`, `SystemSettingsView`, `UserManagementView`, `ChartArchiveView`).

## Lint

Flat ESLint 9 config is `eslint.config.mjs` (`eslint-config-next/core-web-vitals`). `npm run lint` is `eslint .`. Put global ignores in a top-level `{ ignores: [...] }` object — `ignores` next to `rules` only apply to that block.

## Full CI

```bash
npm run ci   # lint → tsc --noEmit → test → build
```

## Build verification

```bash
npm run build
```

Next.js 16 production build must complete without errors.

## E2E (planned, not yet implemented)

Playwright E2E is **not yet set up** — see [E2E-TESTS.md](../E2E-TESTS.md) for the coverage plan and current status.

## Performance

- Public chart routes use ISR/caching; verify no unnecessary client-side fetches on RSC pages.
- Lazy-load heavy chart/admin modules.
- `npm run analyze` (bundle analyzer) if you need to inspect bundle size.
