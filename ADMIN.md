# Dark Charts Admin Panel

Access the admin panel at `/admin`. Authentication is enforced at the edge by `proxy.ts` — unauthenticated requests redirect to `/login`, and a session whose role is not `ADMIN`/`admin`/`editor` is bounced with `?error=unauthorized` before any page content is served.

The admin is a content + chart-ops console. It is **not** the place for infra setup — R2, Vercel, Supabase Cron, Edge Functions, and `CRON_SECRET` configuration stay in [DEPLOYMENT.md](DEPLOYMENT.md) and operator dashboards.

## Sections

### CONTENT

| Page | Purpose |
|------|---------|
| **Artists** | Catalog sync, blacklist, visibility. Create/update artists, trigger sync, mark visibility. |
| **Releases** | Release management — metadata, track mapping, visibility, linked artists. |

### CHARTS

| Page | Purpose |
|------|---------|
| **Chart Control** | Pause/resume voting, trigger weekly recalculation, inspect pillar state. |
| **Anomalies** | Review high-severity anomalies from aggregation; a pending high-severity anomaly blocks voting on affected releases. |
| **Votes** | Inspect vote receipts, detect conflicts, and audit the voting surface. |
| **Radio Monitor** | Discover public dark-scene streams, enable/disable probes, legal hold, unmatched events, worker heartbeat. Radios never install anything. Stream probing runs on a separate worker, not on Vercel. |

### MANAGEMENT

| Page | Purpose |
|------|---------|
| **Users** | Roles (`FAN` / `DJ` / `BAND` / `LABEL` / `ADMIN`), suspension, DJ expert status. |
| **Spotlight** | Approval and management of self-service promotional bookings (Stripe). |
| **Analytics** | Metrics, API health, audit log. |
| **Badges** | Badge definitions and award state (Early Adopter, Genre Gelehrter, …). |

### SYSTEM

| Page | Purpose |
|------|---------|
| **Settings** | Chart weights and the fan `voice credits` budget. |
| **Features** | Feature flags / toggles. |
| **Colors** | CI color overrides at runtime. |
| **API Keys** | Encrypted external credentials (Spotify, Stripe, etc.). |
| **System** | Health, logs, maintenance. |

Additional pages: **Metrics**, **Promotions** (promotion queue + campaign state).

## Setup

### 1. Configure Supabase

Follow [DEPLOYMENT.md](DEPLOYMENT.md) to create a Supabase project, apply the schema, and configure environment variables.

### 2. Create the first admin

Bootstrap via `POST /api/auth/init-admin` (guarded by `ADMIN_INIT_SECRET`) or promote a role directly:

```sql
UPDATE public.users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

### 3. Access

Navigate to `/admin`. If not authenticated you will be redirected to `/login?returnTo=/admin`; after login you are routed by role (`resolveRedirectPath`).

Local preview: `/login` → **Preview admin area** / **Admin-Bereich ansehen**. That creates `demo-admin@darkcharts.demo` (role `ADMIN`) and a short-lived demo cookie. Production stays off unless `ALLOW_DEMO_LOGIN=1`.

## Chart ops (operator-facing)

- **Weekly aggregation** runs via Vercel cron (`/api/cron/aggregate-charts`, `55 23 * * 0`). Fan credits also reset Monday 00:00 UTC (`/api/cron/reset-credits`) if Sunday aggregation did not run. Review resulting anomalies under **Anomalies**; unresolved high-severity anomalies keep voting blocked on affected releases.
- **Voting pause** in **Chart Control** freezes fan/expert submissions for a window.
- **Sync** — manual artist sync and the durable `sync_queue` drain are documented in [DEPLOYMENT.md](DEPLOYMENT.md) and [docs/agent/backend.md](docs/agent/backend.md). The dashboard surfaces queue health; it never asks operators to configure infra.

## Audit & logging

- `src/lib/logger` writes structured logs.
- **System** page shows health snapshot and log browsing.
- External API keys live in the `api_credentials` table (admin-only RLS), AES-256-GCM encrypted; the decryption master key stays in env, never in the browser.

## Permissions

Role access is enforced at three layers: Edge `proxy.ts` (`/admin/:path*`), API route guards (`requireAuth` / `withAdminAuth`), and RLS on sensitive tables. The `ADMIN` role is never restricted.
