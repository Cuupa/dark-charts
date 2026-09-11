import type { Language } from './translate';

export const LANG_COOKIE = 'lang';

export function langCookieValue(language: Language): string {
  return `${LANG_COOKIE}=${language};path=/;max-age=31536000;samesite=lax`;
}

export function writeLangCookie(language: Language): void {
  if (typeof document === 'undefined') return;
  document.cookie = langCookieValue(language);
}
