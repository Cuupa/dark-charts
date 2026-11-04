import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const RESET_SQL = readFileSync(resolve(__dirname, '../../supabase/reset.sql'), 'utf8');

describe('reset.sql row level security', () => {
  it('enables RLS on vote_anomalies and user_listening_snapshots', () => {
    expect(RESET_SQL).toMatch(
      /ALTER TABLE vote_anomalies ENABLE ROW LEVEL SECURITY/
    );
    expect(RESET_SQL).toMatch(
      /ALTER TABLE user_listening_snapshots ENABLE ROW LEVEL SECURITY/
    );
  });

  it('enables RLS on every created public table', () => {
    const tables = [
      ...RESET_SQL.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g),
    ].map((match) => match[1]);

    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables) {
      expect(
        RESET_SQL,
        `${table} must enable row level security`
      ).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
    }
  });
});
