# Dark Charts — Agent Guidelines

Independent chart platform for the Heavy Metal, Gothic, Dark Wave, and EBM underground scene.
Stack: Next.js 16 App Router · React 19 · Supabase (PostgreSQL) · Stripe (Spotlight) · Vercel.

**Package manager:** npm only (`npm ci` in CI).

## Session start (read before coding)

1. **This file** — critical rules, checks, and docs closeout.
2. **Topic file** — open the matching `docs/agent/{topic}.md` from the table below for the area you touch.
3. **PRD.md** — only when the task is product/feature-shaped (not pure refactors/CI).
4. **End of session** — docs refresh is mandatory; follow [workflow.md](docs/agent/workflow.md).

Skipping specs and fixing CI later costs more than reading first.

## Mandatory checks (every code change)

Prefer the full local pipeline (same gates as GitHub CI):

```bash
npm run ci
```

Or by phase when debugging a failure:

1. `npm run lint` — ESLint
2. `npx tsc --noEmit` — type check
3. `npm test` — Vitest unit tests
4. `npm run build` — production build

No PR with failing checks. No `as any`, `@ts-ignore`, or `eslint-disable` to silence errors.

## Mandatory docs update (end of every agent session)

**Always** refresh documentation and markdown before you declare work done, open a PR, or hand off — not only when the user asks. Treat docs as part of the deliverable, same as code.

1. Update every **stale** markdown that describes what you changed (agent specs, product docs, living docs).
2. Run the full end-of-session review in [workflow.md](docs/agent/workflow.md) (checklist of files).
3. When product behavior changed: [CHANGELOG.md](CHANGELOG.md), [QA_CHECKLIST.md](QA_CHECKLIST.md); when a reusable lesson appeared: [LESSONS_LEARNED.md](LESSONS_LEARNED.md).
4. New/changed patterns → matching `docs/agent/*.md`. Public surface / ops → `README.md`, `ADMIN.md`, `DEPLOYMENT.md`, `SECURITY.md` as applicable.

Skipping docs because “the task was only code” is a process failure.

## Critical rules (always apply)

- **Chart integrity** — Fan, Expert, and Streaming pools stay isolated until aggregation. No pay-to-win, no direct or indirect paid influence on rankings.
- **No `any`** — Use `unknown` + type guards at API boundaries; validate with Zod. New edge functions carry Zod schemas.
- **Server writes** — Mutations go through `app/api/**/route.ts` with service-role Supabase, never client-side DB.
- **Schema** — `supabase/reset.sql` is the **only** SQL artefact (fully idempotent). No `supabase/migrations/`. Keep `src/types/database.ts` in sync.
- **No legacy serverless** — App Router Route Handlers only; no `api/` serverless folder.
- **Prisma is retired** — `prisma/schema.prisma` and `src/backend/repositories/prisma/*` are legacy. Use the Supabase repositories (`src/backend/repositories/supabase/*`) and the `I*Repository` interfaces; do not add `@prisma/client`.
- **Logging** — Use `logger` from `@/lib/logger`, not `console.*` in app code.
- **Minimal changes** — Smallest diff that fully solves the task. No drive-by refactors, no new dependencies unless necessary.
- **Docs** — Always update documentation/markdown at session end (see above).
- **WCAG 2.1 AA** on public UI.

## Architecture & quality mandate (binding)

The following principles are binding for every agent and developer (extracted from the former `docs/guidelines/AGENT_MANDATE.md`):

- **SOLID** — Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion. Prefer DI over direct instantiation.
- **TDD** — Tests precede production code; test-first is the only accepted development approach.
- **ISO/IEC 25010** — Maintainability (Modifiability, Analysability, Testability) and Reliability (Fault Tolerance, Recoverability, Availability) are explicit quality gates.
- **Clean Code** — Expressive names; comments explain *why*, not *what*; short, focused functions (~20 lines as a guideline).
- **Code hygiene** — No God Objects, magic numbers, or copy-paste; resolve anti-patterns as soon as they are found.
- **Iterative workflow** — Plan → Implement → Test → abort & re-plan when blocked or after >3 failed attempts (never push broken code) → record findings in `LESSONS_LEARNED.md` → update `docs/agent/*`.

**Definition of Done (DoD)** before closing any task:

- [ ] Code checked for security gaps (OWASP Top 10, audited dependencies).
- [ ] Full type check passes (`tsc --noEmit`) — no hidden type errors.
- [ ] `CHANGELOG.md` updated with an exact technical description of the change.
- [ ] All tests green.
- [ ] `docs/agent/*` and relevant living docs on the current state.

## Detailed guidelines

Read the relevant file before working in that area:

| Topic | File |
|-------|------|
| CI loop, docs maintenance, multi-agent | [workflow.md](docs/agent/workflow.md) |
| RSC/client, IoC, request flow, chart pipelines | [architecture.md](docs/agent/architecture.md) |
| DAL, schema SSOT, R2 keys, sync queue | [data-and-schema.md](docs/agent/data-and-schema.md) |
| Tailwind v4, a11y, theme, Lenis | [frontend.md](docs/agent/frontend.md) |
| Vitest, build verification | [testing-performance.md](docs/agent/testing-performance.md) |
| API auth, RBAC, cron, sync, admin, Stripe | [backend.md](docs/agent/backend.md) |
| Voting, charts, spotlight, badges, feature surface | [features.md](docs/agent/features.md) |
| Legacy / hardcode / security residual inventory | [debt-inventory.md](docs/agent/debt-inventory.md) |

After introducing new patterns, update the relevant `docs/agent/*.md` file.

## External docs

[PRD.md](PRD.md) · [README.md](README.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [docs/RELEASING.md](docs/RELEASING.md) · [ADMIN.md](ADMIN.md) · [SECURITY.md](SECURITY.md) · [INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md) · [CHANGELOG.md](CHANGELOG.md) · [LESSONS_LEARNED.md](LESSONS_LEARNED.md) · [QA_CHECKLIST.md](QA_CHECKLIST.md) · [supabase/DB_REQUIREMENTS.md](supabase/DB_REQUIREMENTS.md)
