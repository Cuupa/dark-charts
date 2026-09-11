'use client';
import { useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, X } from '@phosphor-icons/react';
import type { Track } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlbumArtwork } from './AlbumArtwork';
interface MusicPlayerProps { currentTrack: Track | null; onNext?: () => void; onPrevious?: () => void; allTracks?: Track[]; onClose?: () => void; }
export function MusicPlayer(props: MusicPlayerProps) {
  return props.currentTrack ? <ActivePlayer key={props.currentTrack.id} {...props} track={props.currentTrack} /> : null;
}
function ActivePlayer({ track, onNext, onPrevious, allTracks = [], onClose }: MusicPlayerProps & { track: Track }) {
  const { t } = useLanguage();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const index = allTracks.findIndex(item => item.id === track.id);
  const toggle = () => { if (!audio.current) return; if (playing) audio.current.pause(); else void audio.current.play().catch(() => setError(true)); };
  return <aside className="music-player" aria-label={t('ui.listen')}><div className="music-player-inner">
    <AlbumArtwork src={track.albumArt} alt="" artist={track.artist} title={track.title} size="small" />
    <div className="min-w-0 flex-1"><strong className="block truncate">{track.title}</strong><span className="text-sm text-muted-foreground">{track.artist}</span></div>
    <div className="flex items-center gap-2">
      <button className="chart-play" disabled={index <= 0} onClick={onPrevious} aria-label={t('ui.previous')}><SkipBack /></button>
      {track.previewUrl && loaded && <button className="chart-play" onClick={toggle} aria-label={t(playing ? 'ui.pause' : 'ui.play')}>{playing ? <Pause /> : <Play />}</button>}
      <button className="chart-play" disabled={index < 0 || index >= allTracks.length - 1} onClick={onNext} aria-label={t('ui.next')}><SkipForward /></button>
    </div>
    <div className="player-media">{!track.previewUrl ? <span>{t('ui.noPreview')}</span> : !loaded ? <button className="text-link" onClick={() => setLoaded(true)}>{t('ui.loadMedia')}</button> : <audio ref={audio} src={track.previewUrl} controls preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError(true)} />}{error && <span role="alert">{t('ui.mediaError')}</span>}</div>
    <button className="chart-play" onClick={onClose} aria-label={t('ui.close')}><X /></button>
  </div></aside>;
}
