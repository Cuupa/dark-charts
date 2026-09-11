import { Suspense } from 'react';
import { CentralLoginForm } from './_components/CentralLoginForm';
import { getTranslator } from '@/i18n/server';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const t = await getTranslator();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('ui.loading')}</p>
        </div>
      }
    >
      <CentralLoginForm />
    </Suspense>
  );
}
