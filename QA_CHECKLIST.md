# Pre-Release QA Checklist — Dark Charts

## Functional Tests
- [ ] Public routes load: `/`, `/charts/[pillar]`, `/charts/archive`, `/history`, `/genre/[main]`, `/custom-charts`, `/methodology`, `/spotlight`, `/about`, `/imprint`, `/privacy`, `/terms`, `/search`, `/artist/[id]`, `/release/[id]`
- [ ] Chart pillars render correct data for a seeded week (Fan / Club / Combined); disconnected local environments show only the labelled deterministic demo edition
- [ ] `/charts/streaming` shows snapshot-based popularity or empty — never iTunes/mock stand-ins; overall stays fan+club only
- [ ] Airplay snapshots never change Combined / Fan / Club placements; `/api/charts?type=airplay` is empty until events exist
- [ ] Admin → Radio Monitor: feature flag off or settings disabled writes no events; legal-hold stations are never probed; duplicate titles within 30 minutes do not double-count; stale worker banner shows if heartbeat > 2 minutes
- [ ] `/api/v1/airplay/artist/{id}` requires session or `DATA_API_TOKEN`; unmatched raw titles are excluded from public spin counts
- [ ] Band/label `/airplay` shows only owned artists and the incomplete-coverage disclaimer
- [ ] Genre pages: main genre lists subgenres; subgenre page filters correctly (niche windows applied)
- [ ] Language: default is German; DE | EN in the header both stay visible; switching sets cookie `lang` and `<html lang>`; `/`, `/charts/fan`, `/custom-charts`, `/login`, cookie banner, skip link, and `/release/[id]` stay in one language with no bilingual slash copy and no leftover English on DE
- [ ] Methodology, About, home, Fan/Club/Streaming, and voting pages explain how charts work in plain language (DE + EN)
- [ ] Public labels are Fan / Club / Overall / Streaming — not “Die Liste” / “Szene” / “Listen”
- [ ] Default theme matches darkTunes CI (`#0d0d1a`, `#6d28d9`, Orbitron + Exo 2); header is a wordmark, chart rows have no CRT scanlines
- [ ] Methodology page explains the weighted merge and pillar isolation
- [ ] Voting: verified voter can cast votes; cost rises quadratically; receipt + confirmation render
- [ ] Voting: a second week’s ballot on the same release does not overwrite last week’s row
- [ ] Voting: releases older than 12 months are rejected (`RELEASE_NOT_ELIGIBLE`) and omitted from the pool
- [ ] `/history` and `/charts/archive` show the same weekly `chart_entries` data
- [ ] Voting: unverified email is rejected (403 `EMAIL_NOT_VERIFIED`)
- [ ] Voting: a release blocked by a high-severity anomaly cannot receive votes (`/api/vote/blocked-releases`)
- [ ] Custom charts builder: weights persist and produce a personalised list
- [ ] Search returns visible artists/releases; hidden catalog rows stay hidden
- [ ] `/djs` lists verified Club DJs by reputation and never shows emails
- [ ] `/djs/[id]` 404s for non-experts; DJs can set a public display name
- [ ] Band account can claim an unclaimed visible artist once; second claim is rejected
- [ ] Label can add an unclaimed visible artist to its roster; another label’s artist is rejected; roster is not a ranking signal
- [ ] Club chart: a one-vote outlier ranks below a broad DJ consensus after shrinkage
- [ ] DJ can request expert access; admin grant clears the request and unlocks Club voting
- [ ] Spotlight: availability lists bookable slots; Stripe checkout completes; webhook creates the booking
- [ ] Spotlight booking never appears in any ranking pillar
- [ ] `/api/v1/*` returns charts/artists/categories/search/overview with a valid Bearer token

## Security
- [ ] Unauthenticated requests to `/admin/*` redirect to `/login`
- [ ] A non-admin session is bounced with `?error=unauthorized`
- [ ] Protected APIs reject missing/invalid JWTs (401)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never present in client HTML
- [ ] `/api/v1/*` rejects a missing/invalid Bearer (401)
- [ ] Cron routes reject a missing/wrong `CRON_SECRET` (401)
- [ ] Fan vote with unverified email is rejected (403)
- [ ] External API calls back off on 429 (no runaway requests)
- [ ] `npm audit` (high severity) clean before release
- [ ] Trust-level weighting applied (unverified < verified < OAuth)

## Roles & RLS
- [ ] `FAN` / `DJ` / `BAND` / `LABEL` / `ADMIN` role flows behave correctly
- [ ] `api_credentials` is admin-only (RLS) and never returns decrypted values on GET
- [ ] Votes/spotlight tables are not writable by the anon client
- [ ] Role changes affect access immediately (no re-login needed)

## Database & Sync
- [ ] Schema parity: `reset.sql` (only SQL) + `src/types/database.ts` in sync; no `supabase/migrations/`
- [ ] Durable sync queue drains; `sync_queue` / `sync_logs` populated
- [ ] Darktunes import + scene-artist CSV seed produce visible releases/artists
- [ ] R2 cover-art cache: artwork lands on CDN; fallback to external URL on failure
- [ ] `POST /api/sync` (with `CRON_SECRET`) drains the queue; `/api/sync/queue` enqueues
- [ ] `/api/cron/aggregate-charts` runs and produces anomalies (if any)
- [ ] `/api/cron/reset-credits` (Monday) restores `fan_profiles.remainingCredits` to the budget
- [ ] `/api/cron/evaluate-badges` awards Thronwächter / Dauergast / Genre-Scout for the completed week
- [ ] `/api/cron/purge-inactive` does not delete admins or users with votes/bookings in the last 24 months

## Accessibility (WCAG 2.1 AA)
- [ ] Keyboard-only navigation across public journeys
- [ ] Visible focus-visible rings on interactive elements
- [ ] Mobile touch targets ≥ 44×44 (chart nav, voting controls)
- [ ] Reduced-motion preference respected in animated components
- [ ] Semantic landmarks + skip-to-main link

## Responsive Design
- [ ] Chart tables/genre grids render on desktop/tablet/mobile
- [ ] No horizontal overflow on ~360px
- [ ] Voting and custom-charts controls usable on touch

## Performance
- [ ] Public chart pages render promptly with ISR/caching
- [ ] `npm run build` completes without errors
- [ ] No unnecessary client-side data fetches on public RSC pages

## Documentation
- [ ] `README.md` reflects current setup and QA commands
- [ ] `DEPLOYMENT.md` up to date (crons, Stripe webhook, env)
- [ ] `AGENTS.md` + `docs/agent/*` aligned with implementation

## Test Execution
- [ ] Unit tests (`npm test`) pass
- [ ] `npm run ci` green (lint → typecheck → tests → build)

## Legal & Consent
- [ ] `/imprint`, `/privacy`, `/terms` render operator data from `NEXT_PUBLIC_LEGAL_*`
- [ ] Email verification works (Resend or Supabase built-in)
- [ ] Demo login disabled in production unless `ALLOW_DEMO_LOGIN=1`
- [ ] `/login` offers Preview admin area; in development it lands on `/admin` and shows Radio Monitor in the sidebar; a FAN demo cookie cannot open `/admin`
