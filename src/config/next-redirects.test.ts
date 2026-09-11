import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('next.config redirects', () => {
  const source = readFileSync(resolve(__dirname, '../../next.config.ts'), 'utf-8');

  it('does not send /charts/streaming back to home', () => {
    expect(source).not.toMatch(/source:\s*['"]\/charts\/streaming['"]/);
  });
});
