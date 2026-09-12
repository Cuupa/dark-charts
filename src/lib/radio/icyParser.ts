const STREAM_TITLE_RE = /StreamTitle='([^']*)'/i;

export function extractIcyStreamTitle(bytes: Uint8Array, metaint: number): string | null {
  if (metaint <= 0 || bytes.length <= metaint) return null;
  const lengthByte = bytes[metaint];
  if (lengthByte === undefined || lengthByte === 0) return null;
  const metaBytes = lengthByte * 16;
  const start = metaint + 1;
  const end = Math.min(start + metaBytes, bytes.length);
  if (end <= start) return null;
  const text = new TextDecoder('latin1').decode(bytes.subarray(start, end));
  const match = STREAM_TITLE_RE.exec(text);
  const title = match?.[1]?.trim();
  return title ? title : null;
}
