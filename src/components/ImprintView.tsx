'use client';

import { Card } from '@/components/ui/card';
import { Envelope, MapPin, IdentificationCard, Warning } from '@phosphor-icons/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLegalConfig } from '@/lib/legal-config';
import { getImprintContent } from '@/lib/legal-content';
export function ImprintView() {
  const { language } = useLanguage();
  const legal = getLegalConfig();
  const content = getImprintContent(language);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {!legal.isConfigured && content.configWarning && (
        <div className="flex items-start gap-3 border border-amber-500/40 bg-amber-500/10 p-4 rounded text-sm text-amber-200">
          <Warning size={20} weight="fill" className="shrink-0" />
          <p className="font-ui text-xs leading-relaxed">{content.configWarning}</p>
        </div>
      )}

      <Card className="bg-card border border-border p-8">
        <h1 className="font-display text-3xl uppercase text-foreground mb-8 tracking-tight">
          {content.title}
        </h1>

        <div className="space-y-8 font-ui text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4 flex items-center gap-3">
              <IdentificationCard size={24} weight="bold" className="text-accent" />
              {content.sections[0]?.title}
            </h2>
            <div className="space-y-2">
              <p className="font-data text-foreground">
                <strong>{language === 'en' ? 'Operator:' : 'Betreiber:'}</strong> {legal.name}
              </p>
              <p className="font-data">
                <strong>{language === 'en' ? 'Legal form:' : 'Rechtsform:'}</strong> {legal.legalForm}
              </p>
              <p className="font-data flex items-start gap-2">
                <MapPin size={16} className="text-accent mt-0.5 shrink-0" />
                <span>{legal.street}, {legal.zip} {legal.city}, {legal.country}</span>
              </p>
              <p className="font-data flex items-center gap-2">
                <Envelope size={16} className="text-accent shrink-0" />
                <a href={`mailto:${legal.email}`} className="text-accent hover:text-primary transition-colors">
                  {legal.email}
                </a>
              </p>
            </div>
          </section>

          {content.sections.slice(1).map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-xl uppercase text-foreground mb-4">{section.title}</h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="mb-2">{p}</p>
              ))}
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}