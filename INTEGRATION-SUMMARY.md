# Integration Summary — Dark Charts

Living product-status snapshot. Architecture and agent rules: `AGENTS.md` + `docs/agent/`. User guides: `README.md`, `ADMIN.md`, `DEPLOYMENT.md`.

**Stack:** Next.js 16 · React 19 · Supabase · Stripe (Spotlight) · Vercel · Tailwind v4  
**Schema:** `supabase/reset.sql` (only SQL artefact) · **PRD:** [PRD.md](PRD.md)

---

## Public website

| Area | Status |
|------|--------|
| Home current charts | ✅ Fan + Club + combined RSC |
| Chart detail (`/charts/fan`, `/charts/club`, archive, history) | ✅ History = DB archive |
| Genre taxonomy (4 main × subgenres) | ✅ |
| Custom charts builder | ✅ Fan/expert mixer (streaming slider is cosmetic) |
| Methodology, about, imprint, privacy, terms | ✅ Bilingual; methodology matches two pillars |
| Voting (quadratic + confirmation + receipt) | ✅ Weekly ballots (`weekStart`), 12-month eligibility |
| Spotlight (self-service booking) | ✅ Stripe |
| Data API `/api/v1/*` | ✅ Bearer |
| Public artist / release / search | ✅ `/artist/[id]`, `/release/[id]`, `/search` |
| Band claiming | ✅ `POST /api/band/claim` |

## Voting & chart integrity

| Area | Status |
|------|--------|
| Quadratic voting + weekly voice credits | ✅ `quadratic.ts`, `fan-credits.ts`, `/api/cron/reset-credits` |
| Trust levels (Sybil resistance) | ✅ `src/lib/trust-level.ts` |
| Expert ranking + reputation | ✅ Rank points × reputation, weekly shrinkage; auto-update from later Fan Top 20 |
| Streaming public pillar | ✅ Popularity snapshots (Spotify 85/YouTube 15); not in overall; no unique-listener loyalty |
| Aggregation + anomaly guard | ✅ Fan + expert → `chart_entries` |
| Vote conflicts + blocked releases | ✅ |

## Admin (`/admin`)

| Area | Status |
|------|--------|
| Artists, releases | ✅ |
| Chart control, anomalies, votes | ✅ |
| Users, spotlight, analytics, badges, promotions, metrics | ✅ |
| Settings (weights + credit budget), features, colors, api-keys, system | ✅ |

## Platform services

| Area | Key paths |
|------|-----------|
| Catalog sync (durable) | `src/lib/sync/` — `sync_queue` / `sync_logs`, iTunes + Spotify + Odesli |
| Import / seed | `/api/admin/import/darktunes`, `/api/admin/seed/artists` |
| DAL | `src/lib/api/*`, `src/lib/math/*` |
| Domain services | `src/backend/services/*` — Auth, Artist, Chart, Aggregation, Badge, Promotion |
| Auth | `src/lib/api-auth.ts`, `proxy.ts` |
| Errors | `withErrorHandler`, `ApiError` |
| Health | `GET /api/health`, `/admin/system` |

---

## Entry-point files

| File | Purpose |
|------|---------|
| `PRD.md` | Product requirements (pillars, surfaces, NFRs) |
| `README.md` | Quick start, scripts, env overview |
| `DEPLOYMENT.md` | Vercel, Supabase, Stripe, cron, bootstrap |
| `ADMIN.md` | Admin/operator guide |
| `AGENTS.md` | Agent index + mandatory checks |
| `docs/agent/*.md` | Topic-specific coding rules |
| `supabase/reset.sql` | Canonical idempotent schema (the only SQL file) |
| `src/types/database.ts` | TypeScript DB types (sync with schema) |
| `.env.example` | Env var template |

## Quick start

```bash
cp .env.example .env.local   # fill Supabase + JWT_SECRET
npm ci && npm run dev
# http://localhost:3000 · /admin
```
