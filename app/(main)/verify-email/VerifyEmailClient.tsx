'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Kein Verifizierungstoken in der URL.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Verifizierung fehlgeschlagen');
        }
        setStatus('success');
        setMessage('E-Mail erfolgreich bestätigt. Du kannst jetzt abstimmen.');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Verifizierung fehlgeschlagen');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="max-w-lg mx-auto">
      <Card className="p-8 text-center space-y-4 border border-border bg-card">
        <h1 className="display-font text-2xl uppercase text-foreground font-semibold">
          E-Mail-Verifizierung
        </h1>
        {status === 'loading' && (
          <p className="font-ui text-sm text-muted-foreground">Verifiziere deine E-Mail…</p>
        )}
        {status !== 'loading' && (
          <p className={`font-ui text-sm ${status === 'success' ? 'text-primary' : 'text-destructive'}`}>
            {message}
          </p>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href="/profile">Zum Profil</Link>
        </Button>
      </Card>
    </div>
  );
}