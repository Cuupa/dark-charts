'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { authFetch } from '@/lib/auth/client-fetch';
import { logger } from '@/lib/logger';

interface DjExpertCardProps {
  expertStatus?: boolean;
  expertRequested?: boolean;
  reputationScore?: number;
  displayName?: string;
}

export function DjExpertCard({
  expertStatus = false,
  expertRequested = false,
  reputationScore = 1,
  displayName = '',
}: DjExpertCardProps) {
  const { t } = useLanguage();
  const [requested, setRequested] = useState(expertRequested);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(displayName);

  const apply = async () => {
    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/dj/apply', { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? t('profile.djApplyFailed'));
        return;
      }
      setRequested(true);
      toast.success(t('profile.djApplySuccess'));
    } catch (error) {
      logger.error('DJ expert apply failed', { error });
      toast.error(t('profile.djApplyFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="space-y-4 border border-border bg-card p-6">
      <h3 className="display-font text-xl font-semibold uppercase tracking-tight text-foreground">
        {t('profile.djExpertTitle')}
      </h3>
      <p className="font-ui text-sm text-muted-foreground">{t('profile.djExpertDescription')}</p>
      <p className="font-ui text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {t('profile.djReputation')}: {reputationScore.toFixed(2)}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder={t('profile.djDisplayName')}
          aria-label={t('profile.djDisplayName')}
        />
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            try {
              const res = await authFetch('/api/dj/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName: name.trim() || null }),
              });
              if (!res.ok) throw new Error('save failed');
              toast.success(t('profile.djDisplaySaved'));
            } catch (error) {
              logger.error('DJ display name save failed', { error });
              toast.error(t('profile.djApplyFailed'));
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="font-ui text-[10px] uppercase"
        >
          {t('profile.djDisplaySave')}
        </Button>
      </div>
      {expertStatus ? (
        <p className="font-ui text-sm text-accent">{t('profile.djIsExpert')}</p>
      ) : requested ? (
        <p className="font-ui text-sm text-muted-foreground">{t('profile.djApplyPending')}</p>
      ) : (
        <Button
          onClick={apply}
          disabled={isSubmitting}
          className="font-ui text-[10px] uppercase"
        >
          {t('profile.djApplyAction')}
        </Button>
      )}
    </Card>
  );
}
