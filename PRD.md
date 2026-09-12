# Product Requirements — Dark Charts

Living product requirements for an independent chart platform for the Heavy Metal, Gothic, Dark Wave, and EBM underground scene.

**Stack (SSOT):** Next.js 16 App Router · React 19 · Supabase (PostgreSQL) · Stripe (Spotlight) · Vercel · Tailwind v4.
**Schema SSOT:** `supabase/reset.sql` (only SQL artefact, fully idempotent) + `src/types/database.ts`.
**Concept source:** [`src/assets/documents/Musikcharts_Konzept__Schwarze_&_Metal_Szene.md`](src/assets/documents/Musikcharts_Konzept__Schwarze_&_Metal_Szene.md).

Related docs: [README.md](README.md) · [ADMIN.md](ADMIN.md) · [INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md) · [docs/agent/](docs/agent/) · [CHANGELOG.md](CHANGELOG.md)

---

## 1. Product vision

A **fair, manipulation-resistant** music chart system for the global dark scene. The core, non-negotiable principle:

> No pay-to-win — no direct, indirect, or hidden paid influence on rankings.

Dark Charts aggregate three strictly isolated ranking pillars and present them honestly:

1. **Fan charts** — democratic Quadratic Voting with a weekly `voice credits` budget and trust-level Sybil resistance.
2. **Expert (Club) charts** — rank-points over verified DJ/curator top-10 ballots, weighted by reputation.
3. **Combined** — weighted merge of fan + expert only.
4. **Streaming (separate)** — Spotify/YouTube popularity snapshots. Not unique listeners; not in the overall merge.

**Experience qualities:** independent · transparent · high-contrast dark aesthetic · WCAG 2.1 AA on public UI · niche-aware.

---

## 2. Surfaces & primary users

| Surface | Route prefix | Primary users | Auth |
|---------|--------------|---------------|------|
| Public site | `/`, `/charts/*`, `/genre/*`, `/artist/*`, `/release/*`, `/search`, `/djs`, `/spotlight` | Fans, DJs, bands, labels, SEO | None |
| Voting | `/voting` | Fans (verified) | Supabase Auth + email verification |
| Expert voting | `/voting` (DJ pool) | Verified DJs / curators | DJ role + verified expert status |
| Profile | `/profile`, `/voting/confirmation` | Fans, DJs | Supabase Auth |
| Custom charts | `/custom-charts` | Fans | Optional |
| Admin | `/admin/*` | Admins | `ADMIN`/`editor` role |
| Login | `/login` | All roles | Supabase Auth |
| Data API | `/api/v1/*` | Partner/systems | `DATA_API_TOKEN` or session |
| OAuth callback | `/oauth/callback` | OAuth users | Spotify / Google |

**Roles:** `FAN` · `DJ` · `BAND` · `LABEL` · `ADMIN` (Supabase Auth + `users.role`).

---

## 3. Essential capabilities

### 3.1 Chart pillars
| Pillar | Algorithm | Source | Integrity guard |
|--------|-----------|--------|-----------------|
| Fan | Quadratic Voting + trust weights | `votes` (`weekStart`) | `trust-level.ts`, `fan-scoring.ts` |
| Expert | Rank points × reputation, shrunk toward weekly prior | `expert_votes` (`weekStart`) | `expert-ranking.ts`, `expert-reputation.ts` |
| Combined | Weighted merge of fan + expert | Those two pools | `ChartAggregationService.ts` + anomaly guard |

### 3.2 Public site
- Rolling weekly chart arcs (`/charts/fan`, `/charts/club`, `/charts/archive`, `/history` — history is the same DB archive).
- Genre taxonomy: main genres (`Gothic`, `Metal`, `Dark Electro`, `Crossover`) with granular subgenres; niche windows accumulate over longer periods. See `src/lib/config/genres.ts`.
- **Methodology** page (`/methodology`) making the ranking approach transparent.
- **Custom charts** builder — fans weight fan vs expert (streaming slider is ignored) for a personalised discovery list.
- Overview, search, artist top and category top via `/api/v1/*`.

### 3.3 Voting
- Quadratic voting with a weekly voice-credit budget; cost = votes². Ballots are stored per ISO week (`weekStart`). Eligible pool: releases from the last 12 months.
- Email verification required before voting (OAuth paths excepted).
- Vote receipt, status, and blocked-releases endpoints (`/api/vote/*`).
- Conflicts and anomaly detection (`vote-conflicts.ts`, `vote-anomaly.ts`).

### 3.4 Catalog
- Durable sync: `sync_queue` / `sync_logs`, iTunes + Spotify import, Odesli smart-link resolution, R2 cover-art cache.
- Admin import from darktunes catalog (`/api/admin/import/darktunes`, `scripts/import-darktunes-catalog.ts`) and scene-artist CSV seed (`/api/admin/seed/artists`, `doc/consolidated_darkcharts_artists.csv`).

### 3.5 Spotlight (revenue, isolated)
- Self-service promotional placement (Band of the Week, sponsors, subgenre headers) via Stripe checkout.
- Revenue is **never** allowed to influence the ranking pillars.
- Admin approval + booking management; availability/checkout/webhook routes.

### 3.6 Admin CMS
- Content: artists, releases. Charts: chart control, anomalies, votes, radio monitor.
- Passive radio airplay: public stream metadata only (no station accounts). Worker off Vercel. Authenticated `/airplay` for BAND/LABEL. Never a Combined input.
- Management: users, spotlight, analytics, badges, promotions, metrics.
- System: settings (chart weights + credit budget), features, colors, API keys, system/health.

### 3.7 Platform services
- `src/backend/services/` — domain logic (Auth, Artist, Chart, ChartAggregation, StreamingChartCalculation, Badge, Promotion, ReleaseImport).
- DAL in `src/lib/api/` + `src/lib/math/` (currencies of the algorithms).
- Errors: `withErrorHandler` + `ApiError`.

---

## 4. Non-functional requirements

| Area | Requirement |
|------|-------------|
| A11y | WCAG 2.1 AA on public UI; 44px targets; focus-visible rings |
| Chart integrity | Pools isolated until aggregation; anomaly guard blocks voting |
| Security | RLS on sensitive tables; service-role writes; no secrets in browser |
| Performance | ISR/caching on public chart routes; no unnecessary client fetches |
| Schema | `reset.sql` only (idempotent) + `database.ts` in sync; no migration files |
| Typing | No `any`; `unknown` + type guards / Zod at API boundaries |
| Brand | CI colors via theme; no hardcoded tenant names |

---

## 5. Success criteria (product)

- A release climbs a pillar only through the intended algorithmic route; no UI or API path can buy rank.
- Community trusts the charts — methodology is public and reproducible.
- Niche subgenres receive fair visibility (longer windows / thresholds) rather than being swamped by high-volume categories.
- Operators can pause voting, trigger aggregation, reset credits, and resolve anomalies from the admin without coding.
- Spotlight revenue is clearly separated from editorial ranking.

---

## 6. Out of scope (current)

- Native mobile apps / PWA offline.
- Full ticketing, merch commerce, or label settlement ledger (that is darktunes family scope).
- A public vendor ranking. Spotlight is promotional placement only.

---

## 7. Design direction (public)

Dark, high-contrast underground aesthetic: near-black background, strong accent colors, textured overlays. Public pages use the main layout group `app/(main)/` with theme + effects providers; admin uses denser dashboard chrome via `AdminPageShell`.

---

## 8. Edge cases

| Case | Behavior |
|------|----------|
| Empty catalog | Chart pages show placeholders / hide empty sections |
| Low-vote subgenre | Not activated until a minimum voting threshold / longer accumulation window |
| Unverified voter | Voting returns 403 `EMAIL_NOT_VERIFIED` |
| Pending high-severity anomaly | Voting blocked on affected releases (`/api/vote/blocked-releases`) |
| Missing external API creds | Sync/streaming degrade gracefully, logs the error |
| Demo login in production | Off unless `ALLOW_DEMO_LOGIN=1` |
| Rate-limited sync | Exponential backoff; queue cooldown |

---

## 9. Traceability

| Requirement area | Implementation anchors |
|------------------|------------------------|
| Public surfaces | `app/(main)/*`, `docs/agent/features.md` |
| Admin CMS | `app/admin/*`, `ADMIN.md` |
| Pillar math | `src/lib/math/*`, `src/backend/services/*` |
| Catalog sync | `src/lib/sync/*`, `src/lib/catalog/*` |
| Schema / DAL | `supabase/reset.sql`, `src/lib/api/*` |
| Auth patterns | `src/lib/api-auth.ts`, `proxy.ts`, `docs/agent/backend.md` |
| QA | `QA_CHECKLIST.md` |
| History | `CHANGELOG.md` `[Unreleased]` + version tags |
