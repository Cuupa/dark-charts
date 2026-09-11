# Supabase Database Setup

This guide explains how to set up the Dark Charts database schema in Supabase.

> **Schema conventions and normalisation requirements** are documented in [`supabase/DB_REQUIREMENTS.md`](./DB_REQUIREMENTS.md). Read it before making any schema changes.

## Prerequisites

Before applying the schema, ensure you can run SQL in the **Supabase Dashboard → SQL Editor** (requires a superuser/owner-provided connection for some grants on PostgreSQL 15+). If you hit `permission denied for schema public`, run the standard platform grants first in the SQL Editor:

```sql
ALTER SCHEMA public OWNER TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE, CREATE ON SCHEMA public TO authenticated, anon, service_role;
```

## Install or update (always `reset.sql`)

There is **one** SQL artefact: `supabase/reset.sql`. It is fully idempotent.

1. Paste the entire contents of `supabase/reset.sql` into Supabase Dashboard → SQL Editor → **Run**.
2. Re-running is the supported way to apply schema changes to an **existing** database (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY/TRIGGER IF EXISTS` + recreate).

⛔ Do not add files under `supabase/migrations/`.

## Auth

- Enable **Email** auth in Supabase Auth.
- Set **Site URL** + **Redirect URLs** to `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` / `https://<your-domain>`).
- Google OAuth is optional (see `GOOGLE_CLIENT_*` env).

## Troubleshooting

### Error: "permission denied for schema public"

**Solution:** Run the manual grants (Prerequisites) first.

### Error: "relation does not exist"

**Solution:** Run the complete `reset.sql`, not a partial snippet.

### Error: "syntax error at or near NOT"

**Solution:** Your Supabase instance may not support `CREATE TYPE IF NOT EXISTS`; `reset.sql` uses `DO $$ ... EXCEPTION WHEN duplicate_object` blocks to avoid this.
