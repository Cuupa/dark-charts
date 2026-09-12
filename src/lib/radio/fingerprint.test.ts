import { describe, expect, it } from 'vitest';
import { fingerprintAudio } from './fingerprint';

describe('fingerprintAudio', () => {
  it('is not implemented in the metadata-only MVP', () => {
    expect(() => fingerprintAudio(new Uint8Array([1, 2, 3]))).toThrow(
      'Fingerprinting is not enabled in MVP'
    );
  });
});
