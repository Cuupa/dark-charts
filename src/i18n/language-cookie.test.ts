import { describe, expect, it } from 'vitest';
import { parseLangCookie, LANG_COOKIE } from './cookie';

describe('parseLangCookie', () => {
  it('reads de and en and ignores junk', () => {
    expect(parseLangCookie(`${LANG_COOKIE}=en; path=/`)).toBe('en');
    expect(parseLangCookie(`${LANG_COOKIE}=de`)).toBe('de');
    expect(parseLangCookie('lang=fr')).toBeNull();
    expect(parseLangCookie('')).toBeNull();
    expect(parseLangCookie(undefined)).toBeNull();
  });
});
