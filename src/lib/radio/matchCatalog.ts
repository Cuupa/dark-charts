import { normalizeName } from './normalizeTitle';

export interface CatalogArtist {
  id: string;
  name: string;
}

export interface CatalogRelease {
  id: string;
  artistId: string;
  title: string;
}

export interface CatalogIndex {
  artists: CatalogArtist[];
  releases: CatalogRelease[];
}

export interface CatalogMatch {
  artistId: string;
  releaseId: string | null;
  confidence: number;
}

const MIN_ARTIST_SIMILARITY = 0.8;
const MIN_TITLE_SIMILARITY = 0.9;

export function matchCatalog(
  input: { artist: string; title: string },
  catalog: CatalogIndex
): CatalogMatch | null {
  const artistNorm = normalizeName(input.artist);
  const titleNorm = normalizeName(input.title);
  if (!artistNorm || !titleNorm) return null;

  let bestArtist: { id: string; similarity: number } | null = null;
  for (const artist of catalog.artists) {
    const similarity = stringSimilarity(artistNorm, normalizeName(artist.name));
    if (!bestArtist || similarity > bestArtist.similarity) {
      bestArtist = { id: artist.id, similarity };
    }
  }
  if (!bestArtist || bestArtist.similarity < MIN_ARTIST_SIMILARITY) return null;

  const artistReleases = catalog.releases.filter((release) => release.artistId === bestArtist.id);
  let bestRelease: { id: string; similarity: number } | null = null;
  for (const release of artistReleases) {
    const similarity = stringSimilarity(titleNorm, normalizeName(release.title));
    if (!bestRelease || similarity > bestRelease.similarity) {
      bestRelease = { id: release.id, similarity };
    }
  }

  const artistExact = bestArtist.similarity === 1;
  const titleExact = bestRelease?.similarity === 1;
  if (artistExact && titleExact && bestRelease) {
    return { artistId: bestArtist.id, releaseId: bestRelease.id, confidence: 1 };
  }
  if (artistExact && bestRelease && bestRelease.similarity >= MIN_TITLE_SIMILARITY) {
    return { artistId: bestArtist.id, releaseId: bestRelease.id, confidence: 0.92 };
  }
  if (
    bestArtist.similarity >= 0.9 &&
    bestRelease &&
    bestRelease.similarity >= MIN_TITLE_SIMILARITY
  ) {
    return { artistId: bestArtist.id, releaseId: bestRelease.id, confidence: 0.85 };
  }
  if (artistExact) {
    return { artistId: bestArtist.id, releaseId: null, confidence: 0.85 };
  }
  return null;
}

export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  return Math.max(tokenJaccard(a, b), diceBigrams(a, b));
}

function tokenJaccard(a: string, b: string): number {
  const aTokens = new Set(a.split(' ').filter(Boolean));
  const bTokens = new Set(b.split(' ').filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }
  return intersection / (aTokens.size + bTokens.size - intersection);
}

function diceBigrams(a: string, b: string): number {
  const aGrams = bigrams(a);
  const bGrams = bigrams(b);
  if (aGrams.length === 0 || bGrams.length === 0) return 0;
  const bCounts = new Map<string, number>();
  for (const gram of bGrams) {
    bCounts.set(gram, (bCounts.get(gram) ?? 0) + 1);
  }
  let intersection = 0;
  for (const gram of aGrams) {
    const count = bCounts.get(gram) ?? 0;
    if (count > 0) {
      intersection += 1;
      bCounts.set(gram, count - 1);
    }
  }
  return (2 * intersection) / (aGrams.length + bGrams.length);
}

function bigrams(value: string): string[] {
  const compact = value.replace(/\s+/g, '');
  if (compact.length < 2) return compact ? [compact] : [];
  const grams: string[] = [];
  for (let i = 0; i < compact.length - 1; i += 1) {
    grams.push(compact.slice(i, i + 2));
  }
  return grams;
}
