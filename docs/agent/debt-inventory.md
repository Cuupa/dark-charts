# Debt & Residual Inventory

Inventory of legacy / hardcode / security residuals, plus known non-goals. Keep current — update when a residual is resolved or a new one is found. Track recurring anti-patterns in [LESSONS_LEARNED.md](../LESSONS_LEARNED.md) instead.

## Legacy code & retirement

| Item | Path | Status |
|------|------|--------|
| Retired ORM | `prisma/schema.prisma` | ⛔ Do **not** re-add `@prisma/client` |
| Legacy repository impls | `src/backend/repositories/prisma/*` | Keep interfaces `I*Repository`; use `repositories/supabase/*` |
| Legacy JWT / demo fallback | `JWT_SECRET`, `app/api/auth/demo-login` | Keep behind env gate; demo off in production unless `ALLOW_DEMO_LOGIN=1`. Migrate all users to Supabase Auth. |
| Legacy serverless folder | `api/` | Removed; App Router Route Handlers only |

## Hardcode / brand residuals

| Item | Rule |
|------|------|
| Hardcoded tenant/brand names | Use `check:brand`-style review; no hardcoded label names in `app/`/`src/` |
| Color values in TS | Prefer `app/globals.css` theme tokens; admin Colors overrides |

## Security residuals

| Item | Remaining risk | Mitigation |
|------|----------------|------------|
| Service-role misuse | Over-broad writes | Keep only in Route Handlers; never in client props |
| Public `select('*')` in old DAL paths | Column leakage risk | Move to strict column whitelists / `PublicArtist`-style mappers |
| In-memory rate limits / backoff | Multi-instance serverless | Consider distributed limiter for high-risk public routes |
| No E2E suite | Integrity regressions can slip | Track in [E2E-TESTS.md](../E2E-TESTS.md); add Playwright per phase |
| Artist streaming score on latest release | A new song can inherit the artist's popularity index | Keep streaming labelled as an index; split artist/track charts before claiming track streams |
| Delete-then-insert chart publish | A failed insert leaves the week empty | Recalculate off-line, then swap rows atomically |
| Anomalies persisted after publish | Suspicious votes can already sit in the published list | Detect and hold before insert |
| `persistVoteAnomalies` deletes the week first | Manual review state can vanish | Immutable anomaly history with its own status |
| Streaming ingest `.limit(40)` | Later artists never get a snapshot | Cursor pagination with checkpoints |

## Known non-goals

- Native apps / offline PWA (out of scope in PRD).
- Full ticketing / label settlement / merch commerce (darktunes family scope).
- Paying for, or accepting payment for, rank.
