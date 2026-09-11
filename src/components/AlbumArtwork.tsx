import { SafeImage } from '@/components/SafeImage';
interface AlbumArtworkProps { src?: string; alt: string; artist: string; title: string; size?: 'small' | 'medium' | 'large' | 'podium'; glowColor?: string; showLoadingIndicator?: boolean; priority?: number; }
export function AlbumArtwork({ src, alt, size = 'medium', priority = 5 }: AlbumArtworkProps) {
  const dimension = size === 'small' ? 56 : size === 'large' || size === 'podium' ? 128 : 64;
  return <SafeImage src={src} alt={alt} width={dimension} height={dimension} priority={priority < 3} />;
}
