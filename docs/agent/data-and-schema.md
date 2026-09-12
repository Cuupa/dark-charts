# Data Layer & Schema

## Single source of truth

- SQL: **`supabase/reset.sql` only** — full, idempotent schema. Re-run is always safe.
- Types: `src/types/database.ts` (mirror of the schema — keep in sync after every change)

⛔ **No `supabase/migrations/`.** Incremental migration files are forbidden. Every schema change lands as `CREATE … IF NOT EXISTS` / `ALTER … ADD COLUMN IF NOT EXISTS` / `DROP … IF EXISTS` in `reset.sql`.

Schema change checklist: [supabase/DB_REQUIREMENTS.md](../../supabase/DB_REQUIREMENTS.md) and [supabase/SETUP.md](../../supabase/SETUP.md).

## Supabase clients

- Browser: `src/lib/supabase/client.ts` (anon key); `isSupabaseConfigured()` in `src/lib/supabase/isConfigured.ts`
- Server API (RSC/handlers): `createServiceRoleSupabaseClient()` in `src/lib/supabase/server.ts`
- SSR: `src/lib/supabase/server-ssr.ts`
- Env validation: Zod in `src/lib/env.server.ts` / `src/lib/env.client.ts`

## DAL pattern

```typescript
export async function getChartEntries(supabase: AppSupabaseClient, ...) { ... }
```

Pass `AppSupabaseClient` as the first argument. `.single()` returning `PGRST116` → return `null`. `rowTo*` mappers convert snake_case → camelCase.

## Chart data

`chart_entries` (aggregated) serve public chart reads via `src/lib/api/charts.ts`. Voting/bulk writes go through `src/lib/api/fan-vote.ts` and `src/lib/api/votes.ts`. Fan/expert ballots are unique per `(voter, release, weekStart)`. Vote anomalies/conflicts in `src/lib/vote-anomaly.ts`, `src/lib/vote-conflicts.ts`. Eligible voting catalog: last 12 months (`src/lib/voting-eligibility.ts`). Credit reset: `src/lib/api/fan-credits.ts`. Account purge: `src/lib/api/account-purge.ts` (self-serve delete + 24-month inactivity cron). Weekly fan badges: `src/lib/badges/weekly-fan-badges.ts`. Airplay tracker: `tracked_playlists` / `radio_stations` (monitor flags, health, discovery source) / `airplay_events` (raw title, detection method, confidence) / `airplay_snapshots` / `radio_monitor_heartbeat`; `system_settings.radioMonitor` JSON. Rollup in `src/lib/airplay/`. Probe logic in `src/lib/radio/`. Combined ranking never reads airplay.

## Public catalog

Shareable artist/release pages (`/artist/[id]`, `/release/[id]`) and `/search` read visible rows only via `src/lib/api/public-catalog.ts`. Band claiming: `POST /api/band/claim` sets `band_profiles.artistId` (nullable until claimed; unique when set).

## Catalog sync (durable)

1. Enqueue: `POST /api/sync/queue` → `sync_queue` rows
2. Process: `POST /api/sync` (cron every 10m) → `syncArtist` → upsert `releases` + R2 covers
3. Logs: `sync_logs`
4. darktunes bootstrap: `POST /api/admin/import/darktunes` or `scripts/import-darktunes-catalog.ts`
5. Scene artists: `POST /api/admin/seed/artists` (CSV)

Sync imports: `src/lib/itunesApi.ts`, `src/lib/sync/itunesSyncProcessor.ts`, `OdesliAPIRepository.ts`, `SpotifyWebAPIRepository.ts`.

## R2 artwork

1. Download external image during sync
2. `uploadUrlToR2()` / `createSyncUploadFn()` → `src/lib/r2Utils.ts`
3. Store URL in `releases.r2ArtworkUrl`
4. Fallback to external URL on failure

## Genre taxonomy

SSOT: `src/lib/config/genres.ts` — four main genres (`Gothic`, `Metal`, `Dark Electro`, `Crossover`) each with an ordered list of subgenres. Niche windows / aggregation thresholds key off the subgenre level.

## Trust levels

`src/lib/trust-level.ts` — `TRUST_LEVEL_WEIGHTS`: unverified email `0.1`, verified `0.5`, OAuth (Spotify/Google) `1.0`, OAuth + listening history `1.25`. `trustLevelForProvider(provider, emailVerified)` derives the level.

## Env & secrets

- Server secrets in env only (never `NEXT_PUBLIC_`).
- External API credentials (Spotify, Stripe) AES-256-GCM encrypted in `api_credentials` (admin-only RLS); master key in env only.
