# Features & Product Surface

The Dark Charts product surface — pillars, voting, taxonomy, revenue isolation, and the admin control plane. Concept source: [`src/assets/documents/Musikcharts_Konzept__Schwarze_&_Metal_Szene.md`](../../src/assets/documents/Musikcharts_Konzept__Schwarze_&_Metal_Szene.md).

> **Cardinal rule:** no paid signal may ever influence a ranking pillar. Revenue (Spotlight) is marketing placement only.

## Chart pillars

| Pillar | Algorithm | Route | Service |
|--------|-----------|-------|---------|
| Fan | Quadratic Voting + trust weight | `/charts/fan` | `src/lib/math/quadratic.ts`, `fan-scoring.ts` |
| Expert (Club) | Rank points × reputation, shrunk toward weekly prior | `/charts/club` | `src/lib/math/expert-ranking.ts` |
| Combined | Fan + expert weighted merge | `/` | `ChartAggregationService.ts` |

Public ranking pillars are **Fan** and **Club**. **Streaming** is a separate popularity view at `/charts/streaming` (Spotify 85% + YouTube 15% on stored snapshots). It is **not** unique listeners and is **not** merged into overall (`normalizeHybridWeights`). Snapshots are ingested Sunday 22:00 UTC (`/api/cron/streaming-snapshots`) before aggregation. **Airplay** (playlists/radio/DJ spins) is a backend tracker only: events roll up Sunday 23:50 UTC (`/api/cron/aggregate-airplay`) into `airplay_snapshots` and optional `chartType=airplay` rows. It is **not** merged into Combined (playlist placement can be paid). Expert ranking is a 10/8/6/4/2/1 points table times reputation, then shrunk toward the weekly mean (`shrinkExpertScores`, prior strength 5).

`/charts/archive` and `/history` both read weekly `chart_entries` (same archive UI). Anomalies (`vote-anomaly.ts` / `vote-anomaly-guard.ts`) flag unusual vote velocity; a high-severity unresolved anomaly blocks voting on the affected release (`/api/vote/blocked-releases`).

## Quadratic Voting

- Fans receive a **weekly** `voice credits` budget (`src/lib/math/quadratic.ts`); cost = votes². Concentrating votes on one release is expensive, so breadth is rewarded. Credits reset after weekly aggregation and again Monday 00:00 UTC (`/api/cron/reset-credits`) so a missed aggregation still refreshes the budget.
- Each ballot is stored with `weekStart`. Unique key is `(fanId, releaseId, weekStart)` — previous weeks are kept.
- The voting pool is visible releases from the last 12 months (`eligible=1` on `/api/releases`).
- Trust levels (`src/lib/trust-level.ts`) scale weight: unverified email `0.1`, verified `0.5`, OAuth `1.0`, OAuth + listening history `1.25`.
- Voting requires email verification (OAuth flows excepted) — `requireVerifiedVoter` (403 `EMAIL_NOT_VERIFIED`).
- Vote receipt + status endpoints: `/api/vote/receipt`, `/api/vote/status`.

## Expert voting

Verified DJs/curators submit a top-10 bulk ballot (`expert_votes`, also keyed by `weekStart`). Points are 10/8/6/4/2/1 × `dj_profiles.reputationScore`, then shrunk toward the weekly prior. Reputation is updated after aggregation: last week’s expert ballot vs this week’s Fan Top 20 (`updateDjReputationsFromLaterCharts`). DJs request access via `POST /api/dj/apply` (`expertRequested`); admins grant `expertStatus`. Public ranking: `/djs` and `/djs/[id]` (display name from `dj_profiles.displayName`; no emails). BAND/LABEL cannot vote in this pool. Labels manage a roster via `GET/POST /api/label/roster` (`artists.labelId`); roster links never affect rankings.

## Streaming calculation

Public route `/charts/streaming`. Weekly snapshots (`streaming_snapshots`) from Spotify popularity/followers and optional YouTube subscriber score. Combined overall still ignores streaming. Empty weeks stay empty (no iTunes fallback).

## Genre taxonomy

SSOT `src/lib/config/genres.ts` — `Gothic`, `Metal`, `Dark Electro`, `Crossover`, each with ordered subgenres. Subgenre charts may accumulate over longer windows and only activate past a voting threshold; subgenre votes roll up into the parent main genre (`src/lib/genre-aggregation.ts`, `genre-charts.ts`). Routes: `/genre/[main]` and `/genre/[main]/[sub]` (rendered by `GenrePageClient`; pillar via `?pillar=`). Chart tabs/filters are `ChartNavigation` on the chart surface, not a layout redirect to `?genre=`.

## Custom charts

`/custom-charts` — fans weight fan vs expert (streaming slider is cosmetic / renormalized to 0) to build a personalised discovery list (`ChartShellClient`, `HomeChartsView`).

## Spotlight (revenue — isolated)

Self-service promotional placement (Band of the Week, sponsors, subgenre headers) via Stripe checkout. Routes: `/api/spotlight/availability` (list bookable slots), `/bookings`, `/checkout`, `/webhook`. A booking is only listed after a verified `checkout.session.completed`. `src/lib/stripe.ts`, `spotlight-config.ts`. Revenue never affects rankings.

- Public: `/spotlight`
- Admin: `/admin/spotlight` (approvals + management)

## Badges & promotions

- Badges (`BadgeDefinitions`) reward community behaviour. Weekly cron `/api/cron/evaluate-badges` (Monday 00:15 UTC) awards Thronwächter, Dauergast, and Genre-Scout from last week’s fan ballots. Admin can still award manually.
- Promotions (`PromotionService`) manage curated feature surfaces, reviewed in `/admin/promotions`.

## Roles

`FAN` · `DJ` · `BAND` · `LABEL` · `ADMIN`. Voting gated by role for the expert pool; email verification for fans. Admin `ADMIN`/`editor` roles gate `/admin/*` via `proxy.ts`.

## Feature flags

`/admin/features` toggles product surfaces at runtime; admin reads via `systemSettings.ts` / `settingsExtensions.ts`. Never hardcode a flag in a public path.

## Admin control plane

`ADMIN_NAV_GROUPS` (`src/lib/admin/nav.ts`): CONTENT (Artists, Releases), CHARTS (Chart Control, Anomalies, Votes, Radio Monitor), MANAGEMENT (Users, Spotlight, Analytics, Badges), SYSTEM (Settings, Features, Colors, API Keys, System). Plus **Metrics** and **Promotions**.

- **Radio Monitor** — `/admin/radio`: discover public Radio Browser (optional SHOUTcast) stations as **candidates**, enable probes, legal hold, unmatched events, worker heartbeat. Feature flag `radioMonitorEnabled` defaults off. Worker: `workers/radio-monitor`. Public claim: relevant publicly reachable dark-scene stations, not all internet radio. Fingerprinting not in MVP.
- **Chart Control** — pause/resume voting, trigger weekly recalc.
- **Anomalies** — review aggregation anomalies; block/unblock releases.
- **Settings** — chart weights and the fan credit budget.

## Public catalog

- `/artist/[id]` and `/release/[id]` — SSR pages for visible catalog rows (`src/lib/api/public-catalog.ts`).
- `/search` — public catalog search (`GET /api/catalog/search`).
- Chart titles link to the release page.
- Band claiming: `band_profiles.artistId` is nullable until `POST /api/band/claim`; unique when set; sets `artists.verified`.

## Catalog & media

- Durable `sync_queue` / `sync_logs`; iTunes + Spotify + Odesli; R2 cover art (`r2Utils.ts`).
- Import: `POST /api/admin/import/darktunes`; seed: `POST /api/admin/seed/artists` (CSV from `doc/consolidated_darkcharts_artists.csv`).
- `src/lib/catalog/importDarktunes.ts`, `seedConsolidatedArtists.ts`.

## Data API

Server-to-server `/api/v1/*` (charts, artists/top, categories/top, search, overview, airplay, radio stations) behind `DATA_API_TOKEN` or a session (`requireApiAccess`).

## Legal & compliance

Bilingual legal pages via `src/lib/legal-content.ts`; operator data from `NEXT_PUBLIC_LEGAL_*`; `src/lib/legal-config.ts`. GDPR: pseudonymised/aggregated analytics only — never expose an individual voter.
