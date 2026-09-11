# Dark Charts Database Requirements

This document defines the **permanent, non-negotiable** structural requirements for the Dark Charts Supabase PostgreSQL database. Any developer or AI agent modifying the schema **must** verify compliance with all rules below.

---

## 1. Single Source of Truth

| Artefact | Purpose |
|---|---|
| `supabase/reset.sql` | **The only SQL file.** Full idempotent schema: tables, columns, RLS, triggers, indexes, functions. |
| `src/types/database.ts` | TypeScript mirror of the schema. Keep in sync after every change. |

- ⛔ **No `supabase/migrations/`.** Do not add incremental migration files.
- `reset.sql` is safe on a fresh database **and** an existing one. Existing DBs are updated by re-running `reset.sql`.
- A schema change lands **only** in `reset.sql` (CREATE / `ADD COLUMN IF NOT EXISTS`) **and** `src/types/database.ts`.

---

## 2. Normalisation & Referential Integrity

- Comply with 3NF: no redundant/derived columns that are derivable from other columns via a query; no transitive `PK → B → A` dependencies.
- Junction tables for many-to-many (e.g. `user_badges`, band↔release credits) — never array-of-IDs in a nullable/volatile column where FK integrity matters.
- FKs reference the correct table and cascade appropriately (`ON DELETE CASCADE` when the child is meaningless without the parent, `ON DELETE SET NULL` when it remains valid).

---

## 3. Idempotency Requirements

Every statement in `reset.sql` must be safe to run on a fresh database **and** an existing one:

| Object | Idempotent pattern |
|---|---|
| Tables | `CREATE TABLE IF NOT EXISTS` |
| Columns | `ALTER TABLE … ADD COLUMN IF NOT EXISTS` |
| Indexes | `CREATE INDEX IF NOT EXISTS` |
| Triggers | `DROP TRIGGER IF EXISTS` then `CREATE TRIGGER` |
| Policies | `DROP POLICY IF EXISTS` / `IF NOT EXISTS` then `CREATE POLICY` |
| Enum types | `DO $$ BEGIN CREATE TYPE … EXCEPTION WHEN duplicate_object … END $$` |
| Functions | `CREATE OR REPLACE FUNCTION` |

---

## 4. Row Level Security (RLS)

- **All tables must have RLS enabled** (`ALTER TABLE … ENABLE ROW LEVEL SECURITY`).
- Policies are named `"<table>: <actor> <action>"`, e.g. `"users: public read visible"`.
- Never bypass RLS from app code — use `SECURITY DEFINER` functions (`get_my_role()` / `has_permission()`) where direct recursion would otherwise occur.
- Public surfaces use column whitelists; secrets stay in admin-only tables.

---

## 5. Core tables

| Table | Purpose |
|---|---|
| `users` | Supabase-linked account + role (`FAN`/`DJ`/`BAND`/`LABEL`/`ADMIN`) |
| `artists`, `releases` | Catalog |
| `votes`, `expert_votes` | Fan + expert voting (unique per voter + release + `weekStart`) |
| `streaming_snapshots`, `user_listening_snapshots` | Streaming + loyalty input |
| `chart_entries` | Aggregated output for public chart reads |
| `vote_anomalies` | Aggregation anomaly detection |
| `fan_profiles`, `dj_profiles`, `band_profiles`, `label_profiles` | Role profiles (`band_profiles.artistId` nullable until claimed) |
| `sync_queue`, `sync_logs` | Durable catalog sync |
| `bookings` | Spotlight (Stripe) bookings |
| `badges`, `user_badges` | Gamification |
| `system_settings` | Runtime CMS settings |
| `audit_logs` | Admin/compliance audit |

---

## 6. Naming Conventions

| Object | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural | `user_badges`, `chart_entries` |
| Columns | `snake_case` | `artist_id`, `created_at` |
| Indexes | `idx_<table>_<column(s)>` | `idx_releases_artist_id` |
| Triggers | `trg_<table>_<purpose>` | `trg_users_updated_at` |
| Policies | `"<table>: <actor> <action>"` | `"users: admin delete"` |
| Functions | `snake_case` | `get_my_role()` |

---

## 7. Audit & Compliance

- **Admin/role changes**: logged in `audit_logs`.
- **GDPR**: identity is pseudonymised at the analytics layer; no individual voter is exposed to partners. Voter data is minimised and retention-bound.

---

## 8. Checklist for Schema Changes

Before committing any schema change, verify:

- [ ] Added to `supabase/reset.sql` only (CREATE or `ADD COLUMN IF NOT EXISTS`) — **no new migration file**
- [ ] `src/types/database.ts` updated (Row / Insert / Update shapes)
- [ ] No 3NF violations introduced (§ 2)
- [ ] RLS enabled and policies defined for the new table
- [ ] Index created for every FK and high-cardinality filter column
- [ ] `npx tsc --noEmit`, `npm test` pass
