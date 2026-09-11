import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CustomChartsView } from './CustomChartsView';

function renderCustomCharts(language: 'de' | 'en') {
  return render(
    <LanguageProvider initialLanguage={language}>
      <CustomChartsView />
    </LanguageProvider>
  );
}

describe('CustomChartsView i18n', () => {
  it('shows only German copy when DE is active', () => {
    renderCustomCharts('de');
    expect(screen.getByRole('heading', { name: 'Eigene Charts' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /chart erstellen/i }).length).toBeGreaterThan(0);
    expect(screen.getByText('Noch keine eigenen Charts')).toBeTruthy();
    expect(screen.queryByText('Custom Charts')).toBeNull();
    expect(screen.queryByText('No Custom Charts Yet')).toBeNull();
    expect(screen.queryByText(/create your first custom chart/i)).toBeNull();
  });

  it('shows only English copy when EN is active', () => {
    renderCustomCharts('en');
    expect(screen.getByRole('heading', { name: 'Custom Charts' })).toBeTruthy();
    expect(screen.getByText('No Custom Charts Yet')).toBeTruthy();
    expect(screen.queryByText('Eigene Charts')).toBeNull();
    expect(screen.queryByText('Noch keine eigenen Charts')).toBeNull();
  });
});
