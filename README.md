# Dark Charts

Independent music charts for the Heavy Metal, Gothic, Dark Wave, and EBM underground scene.

Built with **Next.js 16 (App Router)**, React 19, Supabase (PostgreSQL), Stripe (Spotlight), and Tailwind CSS v4.

**Product version:** SemVer in `package.json` (see [docs/RELEASING.md](docs/RELEASING.md)). Changelog: [CHANGELOG.md](CHANGELOG.md).

---

## 🎵 Features

- **Independent chart system** — Fan and Club (expert) pools stay isolated until aggregation. No pay-to-win. Streaming remains a separate pillar and is never merged into Overall.
- **Fan charts** — Quadratic Voting with a weekly `voice credits` budget; trust-level scoring (OAuth + listening history) resists Sybil attacks. Ballots are stored per ISO week. See `src/lib/math/quadratic.ts`, `fan-scoring.ts`.
- **Club / expert charts** — Verified DJ top-10 ballots scored with rank points × reputation. See `src/lib/math/expert-ranking.ts`.
- **Combined charts** — `ChartAggregationService` merges fan + expert into overall charts, with anomaly detection that blocks voting on affected releases.
- **Public preview mode** — When Supabase is not configured, all public routes use a clearly labelled, deterministic demo edition. Set `NEXT_PUBLIC_DATA_MODE=live` to require the live API in staging.
- **Wave charting** — Rolling weekly arcs (`/charts/archive`, `/history` — same DB archive) and a user-weighted **custom charts** builder (`/custom-charts`).
- **Public catalog** — SEO artist/release pages (`/artist/[id]`, `/release/[id]`), `/search`, and band claiming.
- **Genre taxonomy** — Dynamic main genres (`Gothic`, `Metal`, `Dark Electro`, `Crossover`) with granular subgenres; niche charts accumulate over longer windows. See `src/lib/config/genres.ts`.
- **Roles** — `FAN`, `DJ`, `BAND`, `LABEL`, `ADMIN` with email verification (OAuth paths excepted) before voting.
- **Catalog sync** — Durable `sync_queue` / `sync_logs`, iTunes + Spotify import, Odesli smart-link resolution, and R2 cover-art caching.
- **Spotlight** — Self-service promotional booking via Stripe checkout, auctioned/approved in the admin.
- **Admin panel** — full CMS at `/admin` (artists, releases, chart control, anomalies, votes, users, spotlight, analytics, badges, promotions, settings, features, colors, API keys, system).
- **Data API** — server-to-server `/api/v1/*` (charts, artists, categories, search, overview) behind a Bearer token.
- **Bilingual** — legal pages and public copy via `src/lib/legal-content.ts`; operator data from `NEXT_PUBLIC_LEGAL_*`.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| UI framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (PostCSS), Radix primitives |
| Charts | Recharts |
| Fonts / icons | Phosphor Icons, Lucide |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + `@supabase/ssr` + Edge `proxy.ts` |
| Storage | Cloudflare R2 (cover-art cache) |
| Payments | Stripe (Spotlight) |
| Deployment | Vercel |
| Testing | Vitest + Testing Library |

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm ci

# 2. Set up environment variables
cp .env.example .env.local
# Fill in Supabase URL/key, JWT_SECRET, and optional integrations

# 3. Start development server (http://localhost:3000)
npm run dev
```

> **Admin panel** is available at `http://localhost:3000/admin` once authenticated.
> **Demo login** is disabled in production unless `ALLOW_DEMO_LOGIN=1`. Locally, `/login` has **Preview admin area** for `demo-admin@darkcharts.demo`.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server (port 3000) |
| `npm run build` | Production build (`next build`) |
| `npm run preview` | Serve production build locally (`next start`) |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run precheck` | Fast Vitest run |
| `npm run ci` | Full CI: `lint` → `tsc --noEmit` → `test` → `build` |
| `npm run kill` | Kill a stuck process on port 5000 |

---

## ✅ Quality Assurance

```bash
npm run ci              # lint → typecheck → tests → build
npm test                # unit tests only
npm run build           # production build verification
```

PRs use [.github/pull_request_template.md](.github/pull_request_template.md) (docs checklist is conditional — see [docs/agent/workflow.md](docs/agent/workflow.md)).

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values.

### Client-side (`NEXT_PUBLIC_` prefix — exposed to the browser)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | Spotify OAuth (PKCE) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth |
| `NEXT_PUBLIC_APP_URL` | Production URL (Stripe redirects, email links) |
| `NEXT_PUBLIC_LEGAL_*` | Imprint / privacy operator data |

### Server-side (Route Handlers / Edge proxy only — never in the browser)

| Variable | Description |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key — used in Route Handlers |
| `JWT_SECRET` | Legacy JWT + demo-login fallback until all users are on Supabase Auth |
| `CRON_SECRET` | Bearer token for `/api/cron/*` and `/api/sync*` |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify API |
| `DATA_API_TOKEN` | Server-to-server `/api/v1/*` access |
| `ALLOWED_ORIGIN` | CORS origin (default `*`) |
| `RESEND_API_KEY` | Email verification |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Spotlight self-service checkout |
| `R2_*` | Cover-art cache (optional; full parity with darktunes) |

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full setup instructions and `.env.example` for the complete list (Google OAuth, admin bootstrap).

---

## 🗄 Database

The schema lives in **`supabase/reset.sql`** (the only SQL artefact; fully idempotent) and **`src/types/database.ts`**. Re-run `reset.sql` on fresh and existing databases. See [docs/agent/data-and-schema.md](docs/agent/data-and-schema.md) and [supabase/DB_REQUIREMENTS.md](supabase/DB_REQUIREMENTS.md).

---

## ♿ Accessibility & Quality

| Requirement | Status | Implementation |
|---|---|---|
| **WCAG 2.1 AA** | ✅ | Skip-to-main link, semantic landmarks, focus-visible rings, 44px touch targets |
| **Reduced Motion** | ✅ | `useReducedMotion()` in animated components |
| **TypeScript `any`** | ✅ | Zero `any` in production code; boundaries use `unknown` + type guards (Zod) |
| **Chart integrity** | ✅ | Three pillars isolated until aggregation; anomaly guard blocks voting |
| **Server writes** | ✅ | Mutations through app Route Handlers with service-role Supabase, not client-side DB |

---

## 🚀 Deployment

Deployments run on **Vercel** with `"framework": "nextjs"` in `vercel.json`. Every push to `main` triggers an automatic production deployment. Crons and API security headers are defined in `vercel.json`.

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step setup (Supabase, Stripe webhook, cron, catalog bootstrap).

---

## 📁 Project Structure

```
app/                            # Next.js App Router
├── (main)/                     # Public site (main layout group)
│   ├── page.tsx                # Home — current charts
│   ├── charts/[pillar]/        # Fan / Expert / Streaming / Combined
│   ├── charts/archive/         # Rolling weekly arcs
│   ├── custom-charts/          # User-weighted custom charts
│   ├── genre/[main]/[sub]/     # Main genre + subgenre breakdown
│   ├── history/                # Chart history
│   ├── methodology/            # How the charts are built
│   ├── voting/                 # Quadratic voting + confirmation
│   ├── spotlight/              # Self-service promo booking
│   ├── profile/                # Voter / expert profile
│   └── about, imprint, privacy, terms
├── login/                      # Central login (role-aware redirect)
├── admin/                      # Protected admin CMS
│   ├── artists/  releases/  charts/  anomalies/  votes/
│   ├── users/  spotlight/  analytics/  badges/  promotions/
│   ├── metrics/  settings/  features/  colors/  api-keys/  system/
│   └── page.tsx                # Admin overview
├── providers.tsx               # Root providers (theme, effects)
└── api/                        # Route Handlers
    ├── charts/*                # Current, history, weights, aggregation
    ├── vote/*                  # Submit, receipt, status, blocked-releases
    ├── releases/               # Public + admin release access
    ├── sync/*                  # Durable queue, iTunes import, artist sync
    ├── admin/*                 # Admin CRUD + import + seed
    ├── spotlight/*             # Availability, bookings, checkout, webhook
    ├── auth/*                  # Login, register, demo-login, OAuth, verify
    ├── v1/*                    # Server-to-server Data API (Bearer)
    ├── cron/*                  # chart aggregation + artwork backfill
    └── health, theme, promotions, spotify/token
proxy.ts                        # Edge middleware — auth for /admin/*
src/
├── backend/                    # Domain layer
│   ├── services/               # Auth, Artist, Chart, ChartAggregation,
│   │                           # StreamingChartCalculation, Badge, Promotion,
│   │                           # ReleaseImport
│   ├── repositories/           # Interface + Supabase + (legacy Prisma) impls
│   ├── models/                 # Domain types
│   └── lib/                    # Shared backend utilities
├── lib/
│   ├── math/                   # quadratic.ts, fan-scoring.ts, expert-ranking.ts,
│   │                           # borda.ts, normalization.ts
│   ├── charts/  sync/  catalog/  artists/  auth/  supabase/
│   ├── api/                    # DAL (charts, votes, fan-vote, syncQueue, users)
│   ├── admin/                  # Admin nav, settings extensions
│   └── config/genres.ts        # Genre taxonomy SSOT
├── components/                 # UI (admin, profiles, skeletons, ui)
├── hooks/  contexts/  providers/  services/  styles/  types/
└── assets/documents/           # Concept + reference markdown
supabase/
└── reset.sql                   # Only SQL artefact (idempotent)
scripts/                        # Import, seed, release tooling
```

---

## 📄 License

Proprietary — All Rights Reserved. See [LICENSE](./LICENSE).
