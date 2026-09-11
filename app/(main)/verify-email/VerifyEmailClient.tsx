'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function VerifyEmailClient() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('verify.missingToken'));
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || t('verify.failed'));
        }
        setStatus('success');
        setMessage(t('verify.success'));
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : t('verify.failed'));
      }
    };

    void verify();
  }, [token, t]);

  return (
    <div className="max-w-lg mx-auto">
      <Card className="p-8 text-center space-y-4 border border-border bg-card">
        <h1 className="display-font text-2xl uppercase text-foreground font-semibold">
          {t('verify.title')}
        </h1>
        {status === 'loading' && (
          <p className="font-ui text-sm text-muted-foreground">{t('verify.loading')}</p>
        )}
        {status !== 'loading' && (
          <p className={`font-ui text-sm ${status === 'success' ? 'text-primary' : 'text-destructive'}`}>
            {message}
          </p>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href="/profile">{t('verify.toProfile')}</Link>
        </Button>
      </Card>
    </div>
  );
}
