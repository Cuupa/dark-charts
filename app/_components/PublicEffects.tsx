'use client';

import { VisualEffectsOverlay } from '@/components/VisualEffectsOverlay';
import { NavHidingWrapper } from './NavHidingWrapper';

export function PublicEffects() {
  return (
    <NavHidingWrapper>
      <VisualEffectsOverlay
        noiseOpacity={0.02}
        crtScanlinesEnabled={false}
        vignetteIntensity={0.28}
      />
    </NavHidingWrapper>
  );
}
