# Deployment (Vercel + Next.js 16)

## 1. Vercel project setup

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `npm run build` (default).
4. Output: App Router (no static export).
5. Optional local link: `npx vercel link` then `npx vercel env pull .env.local`.

Crons and API security headers are defined in `vercel.json`.

## 2. Database (Supabase)

1. Create a **dedicated** Supabase project for dark-charts (do **not** share the darktunes DB).
2. Run `supabase/reset.sql` in the SQL Editor (idempotent — same file for fresh and existing DBs).
4. Enable Email auth; set Site URL + redirect URLs to `NEXT_PUBLIC_APP_URL`.

## 3. Required environment variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Service role (API routes only) |
| `JWT_SECRET` | Server | JWT signing secret (legacy fallback) |
| `CRON_SECRET` | Server | Bearer token for `/api/cron/*` and `/api/sync*` |
| `NEXT_PUBLIC_APP_URL` | All | Production URL (Stripe redirects, email links) |
| `SPOTIFY_CLIENT_ID` | Server | Spotify API |
| `SPOTIFY_CLIENT_SECRET` | Server | Spotify API |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | All | Spotify OAuth (PKCE) |

## 4. Recommended for production

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | Cover-art cache (R2) |
| `RESEND_API_KEY` | Email verification |
| `EMAIL_FROM` | Sender address |
| `STRIPE_SECRET_KEY` | Spotlight self-service checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature |
| `DATA_API_TOKEN` | Server-to-server `/api/v1/*` access |
| `ALLOWED_ORIGIN` | CORS origin (default `*`) |
| `NEXT_PUBLIC_LEGAL_*` | Imprint / privacy operator data |
| `ALLOW_DEMO_LOGIN` | Set to `1` only if demo login must work in production (default: off) |

See `.env.example` for the full list (R2, Google OAuth, admin bootstrap).

## 5. Stripe webhook

Register in Stripe Dashboard:

- **URL:** `https://<your-domain>/api/spotlight/webhook`
- **Events:** `checkout.session.completed`, `checkout.session.expired`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 6. Cron jobs (`vercel.json`)

| Schedule (UTC) | Path | Purpose |
|----------------|------|---------|
| `*/10 * * * *` | `/api/sync` | Drain durable `sync_queue` (iTunes → releases + R2) |
| `0 3 * * 1` | `/api/sync/queue` | Weekly enqueue of all visible artists |
| `0 4 * * *` | `/api/cron/sync-itunes-artwork` | Backfill missing R2 covers |
| `0 22 * * 0` | `/api/cron/streaming-snapshots` | Spotify/YouTube popularity snapshots for the current ISO week |
| `50 23 * * 0` | `/api/cron/aggregate-airplay` | Roll `airplay_events` into `airplay_snapshots` (does not affect Combined) |
| `55 23 * * 0` | `/api/cron/aggregate-charts` | Weekly chart aggregation + anomaly detection + credit reset |
| `0 0 * * 1` | `/api/cron/reset-credits` | Monday fan credit refresh (runs even if Sunday aggregation failed) |
| `15 0 * * 1` | `/api/cron/evaluate-badges` | Award weekly fan badges for the completed ISO week |
| `30 5 * * 1` | `/api/cron/purge-inactive` | Delete non-admin accounts with no activity for 24 months |

Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.

## 6c. Radio monitor worker (optional)

Metadata probes must **not** run in Vercel route handlers. Deploy `workers/radio-monitor/Dockerfile` on an always-on host (Hetzner VPS or Fly.io Machines). Cloud Run scale-to-zero is a poor fit.

```bash
docker build -f workers/radio-monitor/Dockerfile -t dark-charts-radio-monitor .
docker run --env-file .env.local dark-charts-radio-monitor
```

Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Optional: `SHOUTCAST_API_KEY` for SHOUTcast directory discovery.

Then in Admin → Features enable **Radio monitor**, Admin → Radio Monitor save settings with master enable, Discover candidates, and toggle monitoring per station. Apply the new `radio_stations` / `airplay_events` / `radio_monitor_heartbeat` columns via `supabase/reset.sql`.

## 6b. Bootstrap catalog (after first deploy)

1. **darktunes import** (preferred for label releases): export visible artists + releases from darktunes as JSON, then:

```bash
# Admin session cookie / Bearer, or offline:
npx tsx scripts/import-darktunes-catalog.ts path/to/catalog.json
# or POST /api/admin/import/darktunes with the same JSON body
```

2. **Scene artist seed** (CSV):

```bash
# Admin auth required
curl -X POST https://<domain>/api/admin/seed/artists \
  -H "Authorization: Bearer <admin-access-token>"
```

3. Kick queue processing:

```bash
curl -X POST https://<domain>/api/sync \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "x-force-sync: 1"
```

4. Promote first admin in SQL:

```sql
UPDATE public.users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

## 7. Post-deploy checks

```bash
curl https://<your-domain>/api/health
```

- Register/login flow (demo login is **off** in production)
- Email verification (Resend)
- Releases non-empty: `GET /api/releases`
- Fan vote submission against real release UUIDs
- Admin: `/admin/anomalies`, `/admin/promotions`, sync queue health
- Spotlight checkout (Band/Label test account)
- Homepage charts from database (not mock)

## 8. Local production preview

```bash
npm ci
npm run build
npm run preview
```
