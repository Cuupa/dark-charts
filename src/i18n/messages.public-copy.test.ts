import { describe, expect, it } from 'vitest';
import { messages } from './messages';

describe('public chart copy', () => {
  it('uses Fan / Club / Charts naming in German', () => {
    expect(messages.de['nav.home']).toBe('Charts');
    expect(messages.de['pillar.overall']).toBe('Gesamtcharts');
    expect(messages.de['pillar.fan']).toBe('Fan');
    expect(messages.de['pillar.club']).toBe('Club');
    expect(messages.de['pillar.streaming']).toBe('Streaming');
    expect(messages.de['chart.hybridTitle']).toBe('Gesamtcharts');
  });

  it('uses Fan / Club / Charts naming in English', () => {
    expect(messages.en['nav.home']).toBe('Charts');
    expect(messages.en['pillar.overall']).toBe('Overall');
    expect(messages.en['pillar.fan']).toBe('Fan');
    expect(messages.en['pillar.club']).toBe('Club');
    expect(messages.en['chart.hybridTitle']).toBe('Overall charts');
  });

  it('explains how the charts work instead of barking', () => {
    expect(messages.de['chart.whyThisWeekBody'].length).toBeGreaterThan(80);
    expect(messages.de['methodology.lead'].length).toBeGreaterThan(40);
    expect(messages.de['voting.description'].length).toBeGreaterThan(60);
    expect(messages.de['pillar.fanLead'].length).toBeGreaterThan(60);
    expect(messages.de['voting.description']).not.toMatch(/Hau rauf/i);
    expect(messages.de['methodology.lead']).not.toMatch(/Kein Deal/i);
  });
});
