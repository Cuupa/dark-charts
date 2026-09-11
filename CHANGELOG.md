# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Airplay tracker foundation: `tracked_playlists`, `radio_stations`, `airplay_events`, `airplay_snapshots` in `reset.sql`; Sunday 23:50 UTC rollup (`/api/cron/aggregate-airplay`). Writes `chartType=airplay` when snapshots exist. Never merged into Combined (playlist pitching is a paid-adjacent signal).
- Label roster on the profile (`/api/label/roster`); `artists.labelId` links do not affect rankings.
- Public Club DJ ranking at `/djs` and profiles at `/djs/[id]` (display name, no emails).
- Weekly fan badge evaluation (`/api/cron/evaluate-badges`) and 24-month inactive account purge (`/api/cron/purge-inactive`).
- Public streaming pillar `/charts/streaming` from weekly Spotify/YouTube snapshots (`/api/cron/streaming-snapshots`). Not unique listeners; not merged into overall.
- Expert scores shrink toward the weekly prior; DJ reputation updates from last week’s picks vs this week’s Fan Top 20. DJs request Club access via `POST /api/dj/apply`.
- Public catalog pages `/artist/[id]`, `/release/[id]`, `/search`, and band artist claiming (`POST /api/band/claim`).
- Fan and expert ballots store `weekStart`; unique key is `(voter, release, weekStart)` so weekly history is kept (`supabase/reset.sql`).
- Dedicated Monday cron `/api/cron/reset-credits` refreshes fan voice credits independently of aggregation.
- Voting pool filter: visible releases from the last 12 months (`eligible=1` on `/api/releases`).

### Changed
- Public chart copy rewritten in club-announcer voice (no quadratic/Sybil/formula jargon). UI strings go through `src/i18n/messages.ts` + `t(key, vars)`; language cookie `lang` (default `de`).
- Public charts no longer fall back to mock rankings when the live API is empty; empty weeks stay empty (demo catalog only if Supabase is unconfigured).
- `/history` reads the same weekly `chart_entries` archive as `/charts/archive`.
- Product docs describe the shipped two-pillar system (Fan + Club). Streaming is not a public chart; combined merge ignores it.
- Schema SSOT is `supabase/reset.sql` only — incremental migration files are forbidden.
- Documentation restructured to the darktunes-website system: root agent index (`AGENTS.md`), root living docs (`PRD.md`, `ADMIN.md`, `SECURITY.md`, `INTEGRATION-SUMMARY.md`, `QA_CHECKLIST.md`, `E2E-TESTS.md`, `LESSONS_LEARNED.md`), `docs/RELEASING.md`, progressive-disclosure `docs/agent/*`, `supabase/*` docs, and `.github/pull_request_template.md`. The former `docs/architecture/` and `docs/guidelines/` folders were folded into `docs/agent/` and `AGENTS.md` and removed.

## Previous release waves

### Added
- Durable catalog sync (darktunes-style): `sync_queue` / `sync_logs` schema, `POST /api/sync` + `/api/sync/queue`, `syncArtist` → Supabase + R2.
- darktunes catalog import: `POST /api/admin/import/darktunes`, `scripts/import-darktunes-catalog.ts`.
- CSV artist seed: `POST /api/admin/seed/artists` from `doc/consolidated_darkcharts_artists.csv`.
- Durable catalog sync schema folded into `supabase/reset.sql`.
- Demo login disabled in production unless `ALLOW_DEMO_LOGIN=1`.
- Binding ruleset (SOLID, TDD, ISO/IEC 25010, Clean Code, iterative workflow, DoD checklist) merged into `AGENTS.md`.

### Changed
- Restructured documentation: conceptual and feature documents moved from project root into `docs/agent/`.
- `README.md` replaced with a full project README including a table of contents.

### Fixed/Changed
- Deleted backup files (`src/App-backup.tsx`, `src/App-new-structure.tsx`, `src/App.new.tsx`).
- Deleted outdated task documents (`ARTWORK_LOADING_REQUIREMENTS.md` and others identified in the root directory).
- Extracted mathematical logic into `src/lib/math/normalization.ts` (Point normalization, Borda ranking, consensus bonus).
- Refactored `src/App.tsx` by separating logic into `src/providers/AppProviders.tsx` and `src/routes/AppContent.tsx` to follow Single Responsibility.
- Added Zod schemas to Vercel edge functions (`api/charts.ts`, `api/releases.ts`, `api/vote.ts`) for strict type safety and request validation.
