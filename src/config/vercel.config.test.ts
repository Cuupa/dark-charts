import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---- helpers ----

function isValidSemver(version: string): boolean {
  // Accepts full semver: x.y.z or scoped package with semver: @scope/pkg@x.y.z or pkg@x.y.z
  return /^(@[^@]+\/[^@]+|[^@]+)@\d+\.\d+\.\d+$/.test(version);
}

// ---- tests ----

describe('vercel.json config', () => {
  const vercelConfig = JSON.parse(
    readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8')
  ) as Record<string, unknown>;

  it('parses as valid JSON', () => {
    expect(typeof vercelConfig).toBe('object');
  });

  it('does not specify a "functions" runtime without a full semver version', () => {
    const functions = vercelConfig['functions'] as Record<string, { runtime?: string }> | undefined;
    if (!functions) return; // no functions section — fine

    for (const [glob, config] of Object.entries(functions)) {
      if (config.runtime !== undefined) {
        expect(
          isValidSemver(config.runtime),
          `functions["${glob}"].runtime "${config.runtime}" must include a full semver version (e.g. "@vercel/node@3.0.0")`
        ).toBe(true);
      }
    }
  });

  it('rewrites are all objects with "source" and "destination" strings', () => {
    const rewrites = vercelConfig['rewrites'] as Array<Record<string, unknown>> | undefined;
    if (!rewrites) return;

    for (const rewrite of rewrites) {
      expect(typeof rewrite.source, `rewrite source must be a string`).toBe('string');
      expect(typeof rewrite.destination, `rewrite destination must be a string`).toBe('string');
    }
  });

  it('headers are all objects with "source" and non-empty "headers" array', () => {
    const headers = vercelConfig['headers'] as Array<Record<string, unknown>> | undefined;
    if (!headers) return;

    for (const entry of headers) {
      expect(typeof entry.source, `header source must be a string`).toBe('string');
      expect(Array.isArray(entry.headers), `header entries must be an array`).toBe(true);
      expect((entry.headers as unknown[]).length, `header entries must not be empty`).toBeGreaterThan(0);
    }
  });

  it('crons have valid "path" and "schedule" strings', () => {
    const crons = vercelConfig['crons'] as Array<Record<string, unknown>> | undefined;
    if (!crons) return;

    for (const cron of crons) {
      expect(typeof cron.path, `cron path must be a string`).toBe('string');
      expect(typeof cron.schedule, `cron schedule must be a string`).toBe('string');
      // cron expression: 5 space-separated fields
      const fields = (cron.schedule as string).trim().split(/\s+/);
      expect(fields.length, `cron schedule "${cron.schedule}" must have 5 fields`).toBe(5);
    }
  });

  it('aggregates charts after the ISO week voting window closes', () => {
    const crons = vercelConfig['crons'] as Array<{ path: string; schedule: string }>;
    const chartCron = crons.find((cron) => cron.path === '/api/cron/aggregate-charts');
    expect(chartCron?.schedule).toBe('5 0 * * 1');
  });
});
