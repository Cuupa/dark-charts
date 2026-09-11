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
    expect(messages.de['about.principle3']).not.toMatch(/steht offen da/i);
    expect(messages.de['about.clubChartsText']).not.toMatch(/kippt die Woche/i);
    expect(messages.de['methodology.fanDetail'].length).toBeGreaterThan(80);
    expect(messages.de['methodology.clubDetail'].length).toBeGreaterThan(80);
  });

  it('keeps the same keys in de and en', () => {
    expect(Object.keys(messages.de).sort()).toEqual(Object.keys(messages.en).sort());
  });

  it('keeps custom-charts copy in one language per catalog', () => {
    expect(messages.de['custom.title']).toBe('Eigene Charts');
    expect(messages.en['custom.title']).toBe('Custom Charts');
    expect(messages.de['custom.noCharts']).toBe('Noch keine eigenen Charts');
    expect(messages.en['custom.noCharts']).toBe('No Custom Charts Yet');
    expect(messages.de['custom.createFirstCta']).toBe('Erste Chart erstellen');
    expect(messages.en['custom.createFirstCta']).toBe('Create your first chart');
  });

  it('does not mix German and English in one string', () => {
    const bilingual = /\/\s*(accept all|essential only|cookie notice|loading)/i;
    for (const lang of ['de', 'en'] as const) {
      for (const [key, value] of Object.entries(messages[lang])) {
        expect(value, `${lang} ${key}`).not.toMatch(bilingual);
        expect(value, `${lang} ${key}`).not.toMatch(/\bCookie-Hinweis \/ Cookie Notice\b/);
      }
    }
  });

  it('does not leak spec or privacy constraints into public copy', () => {
    const skip = /^(admin|oauth|profile|error|catalog)\./;
    const leak = /keine e-?mails?|never e-?mails?|no e-?mails?|anzeigenamen|display names, never|sybil|quadratic|steht offen da|kippt die woche/i;
    for (const lang of ['de', 'en'] as const) {
      for (const [key, value] of Object.entries(messages[lang])) {
        if (skip.test(key)) continue;
        expect(value, `${lang} ${key}`).not.toMatch(leak);
      }
    }
  });
});
