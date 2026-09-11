import type { Language } from './translate';

export const LANG_COOKIE = 'lang';

export function langCookieValue(language: Language): string {
  return `${LANG_COOKIE}=${language};path=/;max-age=31536000;samesite=lax`;
}

export function parseLangCookie(cookieHeader: string | undefined | null): Language | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)lang=(de|en)(?:;|$)/);
  return match ? (match[1] as Language) : null;
}

export function readLangCookie(): Language | null {
  if (typeof document === 'undefined') return null;
  return parseLangCookie(document.cookie);
}

export function writeLangCookie(language: Language): void {
  if (typeof document === 'undefined') return;
  document.cookie = langCookieValue(language);
}
