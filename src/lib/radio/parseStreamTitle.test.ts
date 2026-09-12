import { describe, expect, it } from 'vitest';
import { parseStreamTitle } from './parseStreamTitle';

describe('parseStreamTitle', () => {
  it('splits Artist - Title on a hyphen with spaces', () => {
    expect(parseStreamTitle('NEUROKLAST - GODSLAYER')).toEqual({
      artist: 'NEUROKLAST',
      title: 'GODSLAYER',
    });
  });

  it('splits on an en-dash with spaces', () => {
    expect(parseStreamTitle('Artist – Title')).toEqual({
      artist: 'Artist',
      title: 'Title',
    });
  });

  it('keeps extra hyphen segments in the title', () => {
    expect(parseStreamTitle('Band - Song - Live')).toEqual({
      artist: 'Band',
      title: 'Song - Live',
    });
  });

  it('returns null for a DJ mix without a separator', () => {
    expect(parseStreamTitle('DJ Mix Hour')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseStreamTitle('   ')).toBeNull();
  });
});
