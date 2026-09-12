export function parseStreamTitle(raw: string): { artist: string; title: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/\s[-–:]\s/);
  if (parts.length < 2) return null;
  const artist = parts[0]?.trim() ?? '';
  const title = parts.slice(1).join(' - ').trim();
  if (!artist || !title) return null;
  return { artist, title };
}
