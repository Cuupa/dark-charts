'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { Language } from '@/i18n/translate';

const OPTIONS: { code: Language; label: string; ariaKey: 'a11y.langDe' | 'a11y.langEn' }[] = [
  { code: 'de', label: 'DE', ariaKey: 'a11y.langDe' },
  { code: 'en', label: 'EN', ariaKey: 'a11y.langEn' },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const select = (next: Language) => {
    if (next === language) return;
    setLanguage(next);
    router.refresh();
  };

  return (
    <div role="group" aria-label={t('a11y.langGroup')} className="flex items-center gap-1">
      {OPTIONS.map((option) => {
        const active = language === option.code;
        return (
          <button
            key={option.code}
            type="button"
            aria-pressed={active}
            aria-label={t(option.ariaKey)}
            onClick={() => select(option.code)}
            className={cn(
              'min-h-[44px] min-w-[44px] px-2 text-sm font-semibold tracking-wide',
              active ? 'text-foreground underline decoration-secondary underline-offset-8' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
