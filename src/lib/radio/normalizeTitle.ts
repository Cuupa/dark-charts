export function normalizeName(value: string): string {
  let next = value.normalize('NFKC').trim().toLowerCase();
  next = next.replace(/[\u0300-\u036f]/g, '');
  next = next.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  next = next.replace(/\s+/g, ' ');
  next = next.replace(/\s*\(([^)]*remix[^)]*)\)\s*/gi, ' ');
  next = next.replace(/\s+(feat\.|ft\.|featuring)\s+.+$/i, '');
  next = next.replace(/^the\s+/, '');
  return next.trim();
}
