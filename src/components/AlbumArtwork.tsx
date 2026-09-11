import { useState } from 'react';
import { SafeImage } from './SafeImage';

interface AlbumArtworkProps {
  src?: string;
  alt: string;
  artist: string;
  title: string;
  size?: 'small' | 'medium' | 'large' | 'podium';
  glowColor?: string;
  showLoadingIndicator?: boolean;
  priority?: number;
}

export function AlbumArtwork({ 
  src, 
  alt, 
  size = 'medium',
  glowColor = 'primary',
  priority = 5
}: AlbumArtworkProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeMap = {
    small: { width: 64, height: 64 },
    medium: { width: 80, height: 80 },
    large: { width: 128, height: 128 },
    podium: { width: 176, height: 176 },
  };

  const { width, height } = sizeMap[size];

  const getGlowClass = () => {
    if (glowColor === 'accent') return 'group-hover:glow-accent';
    if (glowColor === 'violet') return 'group-hover:glow-violet';
    return 'group-hover:glow-primary';
  };

  const getBorderClass = () => {
    if (!isHovered) return 'border-transparent';
    if (glowColor === 'accent') return 'border-accent';
    if (glowColor === 'violet') return 'border-violet';
    return 'border-primary';
  };

  return (
    <div 
      className={`relative flex-shrink-0 group overflow-hidden`}
      style={{ width: `${width}px`, height: `${height}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative w-full h-full ${isHovered ? 'chromatic-hover' : ''}`}>
        <SafeImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`instant-transition ${getGlowClass()} ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          priority={priority < 3}
        />
        <div 
          className={`absolute inset-0 border-2 instant-transition pointer-events-none ${getBorderClass()}`}
        />
      </div>
    </div>
  );
}
