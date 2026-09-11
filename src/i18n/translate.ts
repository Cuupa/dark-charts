export type Language = 'de' | 'en';

export type MessageVars = Record<string, string | number>;

export function interpolate(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    vars[key] === undefined ? match : String(vars[key])
  );
}

export function lookupMessage(
  catalog: Record<Language, Record<string, string>>,
  language: Language,
  key: string,
  vars?: MessageVars
): string {
  const table = catalog[language] ?? catalog.de;
  const raw = table[key] ?? catalog.de[key] ?? key;
  return interpolate(raw, vars);
}

export function isLanguage(value: string | undefined | null): value is Language {
  return value === 'de' || value === 'en';
}
