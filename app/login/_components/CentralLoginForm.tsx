'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartLine, Warning } from '@phosphor-icons/react';
import { tryCreateBrowserSupabaseClient } from '@/lib/supabase/client';
import { resolveRedirectPath } from '@/lib/auth/resolveRedirectPath';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export function CentralLoginForm() {
  const { t } = useLanguage();
  const { loginDemo } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const errorParam = searchParams.get('error');
  const returnTo = searchParams.get('returnTo');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = tryCreateBrowserSupabaseClient();

      if (!supabase) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          toast.error(t('auth.loginFailed'));
          return;
        }

        const payload = await response.json();
        window.location.assign(resolveRedirectPath(payload.user?.role ?? payload.role, returnTo));
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(t('auth.loginFailed'));
        return;
      }

      let role: string | null = null;
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        role = profile?.role ?? null;
      }

      window.location.assign(resolveRedirectPath(role, returnTo));
    } catch {
      toast.error(t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAdmin = async () => {
    setDemoLoading(true);
    try {
      await loginDemo('ADMIN');
      window.location.assign(resolveRedirectPath('ADMIN', returnTo));
    } catch {
      toast.error(t('oauth.demoFailed'));
    } finally {
      setDemoLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      toast.error(t('auth.emailRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const supabase = tryCreateBrowserSupabaseClient();
      if (!supabase) {
        toast.error(t('auth.resetFailed'));
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?recovery=1`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) {
        toast.error(t('auth.resetFailed'));
      } else {
        toast.success(t('auth.resetSent'));
      }
    } catch {
      toast.error(t('auth.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <ChartLine size={40} weight="bold" className="text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('auth.loginTitle')}
          </CardTitle>
          <CardDescription>
            {t('auth.loginDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorParam === 'unauthorized' && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <Warning size={18} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{t('auth.unauthorized')}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-muted border-border"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={handleForgot}
                  disabled={isLoading}
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-muted border-border"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || demoLoading} size="lg">
              {isLoading ? (t('auth.signingIn')) : (t('auth.signIn'))}
            </Button>
          </form>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">{t('auth.demoDivider')}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading || demoLoading}
            onClick={() => void handleDemoAdmin()}
          >
            {demoLoading ? t('auth.signingIn') : t('auth.demoAdmin')}
          </Button>
          <p className="text-xs text-muted-foreground text-center">{t('auth.demoAdminHint')}</p>
        </CardContent>
      </Card>
    </div>
  );
}