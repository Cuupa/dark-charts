import { Suspense } from 'react';
import { VerifyEmailClient } from './VerifyEmailClient';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto text-center font-ui text-sm text-muted-foreground">
          Verifiziere deine E-Mail…
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}