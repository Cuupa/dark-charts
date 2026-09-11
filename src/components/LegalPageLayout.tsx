'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLegalConfig } from '@/lib/legal-config';
import type { LegalPageContent } from '@/lib/legal-content';

interface LegalPageLayoutProps {
  content: LegalPageContent;
  showOperatorAddress?: boolean;
}

export function LegalPageLayout({ content, showOperatorAddress = false }: LegalPageLayoutProps) {
  const legal = getLegalConfig();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl uppercase text-foreground">{content.title}</h1>
        {content.updated && (
          <p className="text-muted-foreground text-sm font-ui">{content.updated}</p>
        )}
        {!legal.isConfigured && content.configWarning && (
          <p className="text-amber-500 text-xs font-ui border border-amber-500/30 bg-amber-500/10 p-3 rounded">
            {content.configWarning}
          </p>
        )}
      </div>

      <Card className="p-6 bg-card border-border">
        <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">
          {showOperatorAddress && (
            <>
              <section>
                <address className="not-italic space-y-1">
                  <p className="text-foreground font-medium">{legal.name}</p>
                  <p>{legal.legalForm}</p>
                  <p>{legal.street}</p>
                  <p>{legal.zip} {legal.city}</p>
                  <p>{legal.country}</p>
                </address>
                <p className="mt-3">
                  <a href={`mailto:${legal.privacyEmail}`} className="text-accent underline">
                    {legal.privacyEmail}
                  </a>
                </p>
              </section>
              <Separator />
            </>
          )}

          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-xl uppercase text-foreground mb-3">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mb-3">{paragraph}</p>
              ))}
              {section.list && (
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <p className="text-xs">
            <Link href="/imprint" className="text-accent underline">Imprint</Link>
            {' · '}
            <Link href="/privacy" className="text-accent underline">Privacy</Link>
            {' · '}
            <Link href="/terms" className="text-accent underline">Terms</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}