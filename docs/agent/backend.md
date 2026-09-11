# Backend, Admin & Sync

## API routes

- Location: `app/api/**/route.ts` (App Router Route Handlers only — no legacy `api/` serverless folder).
- Wrap handlers with `withErrorHandler` from `@/lib/errors`; throw `ApiError` instead of manual JSON.
- Auth: `requireAuth`, `requireVerifiedVoter`, `requireApiAccess` from `@/lib/api-auth`; `withAdminAuth` for admin. Edge `proxy.ts` guards `/admin/:path*`.
- DB: `createServiceRoleSupabaseClient()` (`src/lib/supabase/server.ts`) — never expose service role to the client.

## RBAC

Roles: `FAN`, `DJ`, `BAND`, `LABEL`, `ADMIN` (`users.role`). Enforcement at three layers: Edge `proxy.ts`, API route guards, and RLS.

Helper (`src/lib/auth/session.ts` → `resolveAuthFromRequest`) resolves session / JWT / demo. Types: `session` | `jwt` | `api_key`.

## Data API `/api/v1/*`

`requireApiAccess` accepts the static `DATA_API_TOKEN` (server-to-server) or a valid session/JWT. Handlers under `src/lib/api/v1-handler.ts`.

## Services (domain)

`src/backend/services/` — `AuthService`, `ArtistService`, `ChartService`, `ChartAggregationService`, `StreamingChartCalculationService`, `BadgeService`, `PromotionService`, `ReleaseImportService`, `ReleaseImportScheduler`.

Repositories: interfaces `I*Repository` in `src/backend/repositories/`; Supabase implementations in `repositories/supabase/`. **Prisma repositories (`repositories/prisma/`) are retired** — do not add `@prisma/client`.

## Cron

Protected by `CRON_SECRET` via `src/lib/cronAuth.ts`. Schedules in `vercel.json`.

| Path | Role |
|------|------|
| `/api/sync` | Drain durable `sync_queue` (iTunes → releases + R2) |
| `/api/sync/queue` | Enqueue all visible artists |
| `/api/cron/sync-itunes-artwork` | R2 cover backfill |
| `/api/cron/streaming-snapshots` | Sunday 22:00 UTC Spotify/YouTube snapshot ingest |
| `/api/cron/aggregate-charts` | Weekly chart aggregation + anomaly detection + credit reset |
| `/api/cron/reset-credits` | Monday credit refresh (safety net if aggregation did not run) |
| `/api/cron/evaluate-badges` | Monday fan badge awards for the completed ISO week |
| `/api/cron/purge-inactive` | Monday GDPR purge of accounts inactive 24 months (non-admin) |

Sync DAL: `src/lib/api/syncQueue.ts`, worker: `src/lib/sync/processSyncQueue.ts`, artist sync: `src/lib/sync/syncArtist.ts`, import: `src/lib/catalog/importDarktunes.ts` + `seedConsolidatedArtists.ts`.

## Admin

`app/admin/*` — route guard on the edge; `withAdminAuth` on admin APIs. Admin nav defined in `src/lib/admin/nav.ts` (groups: CONTENT, CHARTS, MANAGEMENT, SYSTEM). Settings extensions in `src/lib/admin/settingsExtensions.ts`.

## Spotlight (Stripe)

Routes under `app/api/spotlight/*` — `availability`, `bookings`, `checkout`, `webhook`. Stripe helpers in `src/lib/stripe.ts`, config in `src/lib/spotlight-config.ts`. Webhook verifies `STRIPE_WEBHOOK_SECRET`; a booking is listed only after a confirmed `checkout.session.completed`.

## Rate limiting

External API calls (iTunes, Spotify, Odesli) use `withExponentialBackoff` (`src/lib/sync/retryPolicy.ts`); 429/5xx are handled gracefully. Sequential work uses `src/lib/mapWithConcurrency.ts` and `src/lib/error-recovery.ts`.

## Logging

Use `logger` from `@/lib/logger`, not `console.*`. Non-fatal errors surface in the admin System/analytics views.
