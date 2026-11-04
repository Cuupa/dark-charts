# Security Policy — Dark Charts

## Supported Versions

| Version | Supported |
|---|---|
| `main` branch | ✅ |
| Older branches | ❌ |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report security issues by emailing the maintainers directly (see repository contacts) or via [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability).

Include as much detail as possible: type of vulnerability, affected file(s)/line numbers, steps to reproduce, and potential impact. We will respond within 72 hours and coordinate a fix before public disclosure.

## Security Practices

- **Chart integrity** — Fan, Expert, and Streaming pools are stored and processed in isolation; they only merge inside `ChartAggregationService`. No route or UI writes a paid-influence signal into a ranking pillar. The anomaly guard (`src/lib/vote-anomaly-guard.ts`) blocks voting on releases with an unresolved high-severity anomaly.
- **Row-Level Security (RLS)** — enabled on every table in `reset.sql`, including `vote_anomalies` and `user_listening_snapshots`. Votes, anomalies, listening snapshots, and credential data are never writable by the anon client; only service-role Route Handlers mutate. Covered by `src/lib/schema-rls.test.ts`.
- **Server writes** — All mutations flow through `app/api/**/route.ts` using the service-role Supabase client (`src/lib/supabase/server.ts`). The browser never holds `SUPABASE_SERVICE_ROLE_KEY`.
- **`proxy.ts` (Edge)** — `/admin/:path*` requires an authenticated user whose `users.role` is `ADMIN`/`admin`/`editor`; otherwise it redirects to login with `?error=unauthorized`. `/login` routes authenticated users to `resolveRedirectPath(role)`.
- **API auth** — `src/lib/api-auth.ts` exposes `requireAuth`, `requireVerifiedVoter`, and `requireApiAccess`. `requireVerifiedVoter` rejects voting for unverified email accounts (403 `EMAIL_NOT_VERIFIED`), and demo sessions are the only allowed bypass.
- **`/api/v1/*` Data API** — Bearer token only. `requireApiAccess` accepts the static `DATA_API_TOKEN` (server-to-server) or a valid session/JWT. Missing/invalid token → 401.
- **Cron auth** — `/api/cron/*` and `/api/sync*` require `Authorization: Bearer <CRON_SECRET>` (`src/lib/cronAuth.ts`). A missing or wrong secret is rejected with 401, preventing unauthenticated or under-privileged callers from triggering resource-intensive aggregation/sync.
- **Trust levels (Sybil resistance)** — Fan voting weight is scaled by `TRUST_LEVEL_WEIGHTS` (`src/lib/trust-level.ts`): unverified email `0.1`, verified email `0.5`, OAuth (Spotify/Google) `1.0`, OAuth + listening history `1.25`. This raises the cost of mass registered-account manipulation without a paid gate.
- **Quadratic Voting** — per-vote cost grows quadratically (`src/lib/math/quadratic.ts`), so concentrating many votes on one release is expensive; this mitigates the classic disproportionate-preference failure.
- **External API credentials** — Spotify, Stripe, and friends are stored AES-256-GCM encrypted in `api_credentials` (admin-only RLS). The decryption master key exists only in Vercel env / `.env.local` — never in Supabase, never sent to the browser. The admin API-keys UI never returns decrypted values on GET.
- **Environment variables** — secrets (`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `CRON_SECRET`, `DATA_API_TOKEN`, `STRIPE_*`) are never prefixed `NEXT_PUBLIC_` and never reach the browser. Client-safe values use `NEXT_PUBLIC_`.
- **Service-role key** — bypasses RLS; used exclusively in Route Handlers for token verification and server writes. Never exposed to the client.
- **External API backoff** — all calls to external APIs (iTunes, Spotify, Odesli) go through `withExponentialBackoff()` (`src/lib/sync/retryPolicy.ts`) to handle 429/5xx gracefully and prevent runaway requests.
- **Spotlight (Stripe)** — checkout confirmation is verified server-side via a signed Stripe webhook (`/api/spotlight/webhook`) with `STRIPE_WEBHOOK_SECRET`; a booking is only listed after a verified `checkout.session.completed` event.
- **Upload limits** — cover-art / artwork uploads enforce size and MIME checks in Route Handlers; R2 credentials are never browser-accessible.
- **Legal / DSGVO** — operator data from `NEXT_PUBLIC_LEGAL_*` env; bilingual legal pages via `src/lib/legal-content.ts`.

## Known residual risks

| Risk | Why it remains | Mitigation / follow-up |
|------|----------------|------------------------|
| Legacy `JWT_SECRET` fallback | Remains until all users are migrated to Supabase Auth | Keep `JWT_SECRET` strong/stored in env; demo login disabled in production unless `ALLOW_DEMO_LOGIN=1`. Tracked in [debt-inventory.md](docs/agent/debt-inventory.md). |
| In-memory IP rate limits / backoff | Serverless multi-instance | Prefer a distributed store for high-risk public routes; keep exponential backoff per-external-API. |
| Retired Prisma repositories present | `prisma/schema.prisma` + `repositories/prisma/*` are no longer wired (no `@prisma/client`) | Do not re-add `@prisma/client`; use Supabase repos + `I*Repository` interfaces. |
| Public `select('*')` risk | Some legacy DAL paths | Keep strict column whitelists on public reads; see [debt-inventory.md](docs/agent/debt-inventory.md). |

## Rate Limiting & Abuse Guards

- Public voting and auth endpoints are guarded with in-process limits and exponential backoff on external calls.
- Anomaly detection flags unusual vote velocity; unresolved high-severity anomalies block voting on affected releases (`/api/vote/blocked-releases`).

## Upload Size Limits (enforced in Route Handlers)

| Route | Max Size |
|---|---|
| `/api/admin/*` artwork import | validated in Route Handler |
| `/api/spotlight/*` (no file body) | n/a |

## CSRF

CSRF protection is not needed for Route Handlers that verify an Authorization bearer token or Supabase session. For Server Actions, Next.js enforces same-origin via the `Origin` header. Do **not** add manual CSRF token middleware — it conflicts with Server Actions.
