# Lessons Learned

Distilled anti-patterns from project history. **Append session findings before opening a PR** when the session uncovered a recurring anti-pattern or process gap — see `docs/agent/workflow.md` → *Living docs*.

---

## Schema & data layer

| Anti-pattern | Rule |
|--------------|------|
| `@prisma/client` being re-added / used at runtime | ⛔ Prisma is retired. `prisma/schema.prisma` + `src/backend/repositories/prisma/*` are legacy. Use `src/backend/repositories/supabase/*` + the `I*Repository` interfaces. |
| Adding `supabase/migrations/*.sql` | ⛔ Forbidden. `supabase/reset.sql` is the only SQL artefact and must stay fully idempotent. Update `src/types/database.ts` in the same change. |
| Schema edited only in types | Keep `reset.sql` and `database.ts` in sync. Re-run `reset.sql` on existing DBs. |
| Public reads with `select('*')` | Use strict column whitelists on public surfaces; keep secrets out of public rows. |

## Chart & math

| Anti-pattern | Rule |
|--------------|------|
| Mixing pillars before aggregation | Fan / Expert / Streaming pools stay isolated until `ChartAggregationService`. Never merge for a UI shortcut. |
| Letting revenue touch ranking | Spotlight revenue must never write a paid signal into a ranking pillar. |
| Ignoring vote velocity anomalies | Surface anomalies; a high-severity unresolved anomaly blocks voting on affected releases. |
| Raw streaming counts as a popularity signal | Normalise by listener loyalty (streams ÷ unique listeners), not raw click counts. |

## Voting & auth

| Anti-pattern | Rule |
|--------------|------|
| Trusting all registered accounts equally | Weight by `TRUST_LEVEL_WEIGHTS` (unverified < verified email < OAuth < OAuth+history). |
| Skipping email verification before voting | Voters must be verified (403 `EMAIL_NOT_VERIFIED`), except OAuth-verified flows. |
| Demo login in production | Disable unless `ALLOW_DEMO_LOGIN=1`. |

## Docs & process

| Anti-pattern | Rule |
|--------------|------|
| Stale docs after a code change | Agents **always** refresh markdown at session end (`AGENTS.md` + `docs/agent/*` + `CHANGELOG` + relevant living docs). |
| Prisma / legacy beliefs in docs | Verify the codebase each session; retired stacks stay documented as retired. |
| Bloated duplicate prose across agent docs | Progressive disclosure: `AGENTS.md` index + topic files. |

---

## Session additions

### 2026-09-11 — Spec language leaked onto the public DJ page

**Symptom:** `/djs` explained “we only show public names, never emails.” Nobody asked.
**Cause:** An API/privacy constraint from `features.md` was copied into `djs.description` as visitor copy.
**Rule / Fix:** Public copy is what you’d say to someone in the scene. Implementation constraints stay in agent specs and code. Denylist test in `messages.public-copy.test.ts`.

### 2026-09-11 — Club-announcer copy hid how the charts work

**Symptom:** Public strings were cut to barky fragments (“Hau rauf.”, “Die Liste”, “Kein Deal.”). Nobody understood Fan vs Club vs Streaming.
**Cause:** A “no jargon / short imperative” voice guideline over-stripped meaning and warmth.
**Rule / Fix:** Keep names clear (Fan / Club / Overall / Streaming). Explain the mechanic in plain language on the page, not only behind a tooltip. Warm and human, still no quadratic/Sybil formulas.

### 2026-09-11 — Playlist/airplay is not a Combined weight

**Symptom:** PR #47 added an `airplay` term to the combined score (default 0) plus a `supabase/migrations/` file and Prisma models.
**Cause:** Tracker foundation was copied as a fourth ranking pillar; playlist adds can be bought.
**Rule / Fix:** Airplay stays a separate `chartType` like streaming. Schema only in `reset.sql`. No Prisma. Do not parse an `airplay` chart weight into Combined.

### 2026-09-11 — Schema is one idempotent script

**Symptom:** Incremental `supabase/migrations/*.sql` drifted from `reset.sql` and duplicated policy.
**Cause:** Dark Charts briefly copied a two-artefact migration model.
**Rule / Fix:** Only `supabase/reset.sql`. Re-run it on existing DBs. Never add migration files.

### 2026-09-11 — Docs claimed three pillars; product is two

**Symptom:** PRD / INTEGRATION-SUMMARY / README advertised Bayesian experts, a streaming loyalty pillar, and mock-filled public charts.
**Cause:** Concept document was copied into living product docs without matching `ChartAggregationService` / `PillarSlug`.
**Rule / Fix:** Trust `src/lib/routes.ts`, `normalizeHybridWeights`, and `/methodology` over marketing copy. Empty live charts must stay empty.

<!-- Append dated entries here using the template below. Newest first. -->

### Template for new entries

```
### YYYY-MM-DD — Short title

**Symptom:** …
**Cause:** …
**Rule / Fix:** …
```
