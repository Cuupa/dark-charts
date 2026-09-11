'use client';
import { useState } from 'react';
import { MusicNote } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
interface SafeImageProps { src?: string; alt: string; className?: string; width?: number; height?: number; onLoad?: () => void; onError?: () => void; priority?: boolean; }
export function SafeImage(props: SafeImageProps) { return <ImageContent key={props.src ?? 'empty'} {...props} />; }
function ImageContent({ src, alt, className, width = 200, height = 200, onLoad, onError, priority = false }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  return <div className={cn('artwork-frame', className)} style={{ width, height, aspectRatio: '1' }}>
    {src && !failed ? <img src={src} alt={alt} width={width} height={height} onLoad={onLoad} onError={() => { setFailed(true); onError?.(); }} loading={priority ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover" /> : <div role={alt ? 'img' : undefined} aria-label={alt || undefined} className="artwork-fallback"><MusicNote size={Math.min(width / 3, 48)} aria-hidden="true" /></div>}
  </div>;
}
