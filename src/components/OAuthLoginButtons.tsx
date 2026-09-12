import { useState, useEffect } from 'react';
import Link from 'next/link';
import { oauthService, OAuthUser } from '@/services/oauthService';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';

interface OAuthLoginButtonsProps {
  onSuccess?: () => void;
}

export function OAuthLoginButtons({ onSuccess }: OAuthLoginButtonsProps) {
  const { t } = useLanguage();
  const { login: authContextLogin, loginDemo } = useAuth();
  const [isLoading, setIsLoading] = useState<'spotify' | 'google' | 'email' | `demo-${'FAN' | 'DJ' | 'BAND' | 'LABEL' | 'ADMIN'}` | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<OAuthUser | null>(null);
  const [googleUser, setGoogleUser] = useState<OAuthUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FAN');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const [spotify, google] = await Promise.all([
      oauthService.getUser('spotify'),
      oauthService.getUser('google'),
    ]);
    setSpotifyUser(spotify);
    setGoogleUser(google);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedLegal) {
      toast.error(t('oauth.acceptLegal'));
      return;
    }
    try {
      setIsLoading('email');

      if (isRegistering) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t('oauth.registerFailed'));
        }
        toast.success(data.message || t('oauth.registerSuccess'));
        setIsRegistering(false);
      } else {
        await authContextLogin('email', { email, password });
        toast.success(t('oauth.loginSuccess'));
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Email auth failed:', error);
      toast.error(error instanceof Error ? error.message : t('oauth.authFailed'));
    } finally {
      setIsLoading(null);
    }
  };

  const handleDemoLogin = async (demoRole: 'FAN' | 'DJ' | 'BAND' | 'LABEL' | 'ADMIN') => {
    try {
      setIsLoading(`demo-${demoRole}`);
      await loginDemo(demoRole);
      toast.success(t('oauth.demoSuccess', { role: demoRole }));
      if (demoRole === 'ADMIN') {
        window.location.assign('/admin');
        return;
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Demo login failed:', error);
      toast.error(t('oauth.demoFailed'));
    } finally {
      setIsLoading(null);
    }
  };

  const handleSpotifyLogin = async () => {
    if (!acceptedLegal) {
      toast.error(t('oauth.acceptLegal'));
      return;
    }
    try {
      setIsLoading('spotify');
      await oauthService.initiateSpotifyAuth();
    } catch (error) {
      console.error('Spotify login failed:', error);
      toast.error(t('oauth.loginFailed'));
      setIsLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    if (!acceptedLegal) {
      toast.error(t('oauth.acceptLegal'));
      return;
    }
    try {
      setIsLoading('google');
      await oauthService.initiateGoogleAuth();
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error(t('oauth.loginFailed'));
      setIsLoading(null);
    }
  };

  const handleSpotifyLogout = async () => {
    try {
      await oauthService.logout('spotify');
      setSpotifyUser(null);
      toast.success(t('oauth.loggedOut'));
    } catch (error) {
      console.error('Spotify logout failed:', error);
      toast.error(t('oauth.logoutFailed'));
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await oauthService.logout('google');
      setGoogleUser(null);
      toast.success(t('oauth.loggedOut'));
    } catch (error) {
      console.error('Google logout failed:', error);
      toast.error(t('oauth.logoutFailed'));
    }
  };

  const demoRoles = [
    { role: 'FAN' as const, label: 'Fan', description: 'Abstimmen & Charts entdecken' },
    { role: 'DJ' as const, label: 'DJ', description: 'Experten-Rankings vergeben' },
    { role: 'BAND' as const, label: 'Band', description: 'Artist-Profil verwalten' },
    { role: 'LABEL' as const, label: 'Label', description: 'Label-Dashboard nutzen' },
    { role: 'ADMIN' as const, label: 'Admin', description: 'Admin-Bereich ansehen' },
  ];

  return (
    <div className="space-y-4">
      {/* Email / Password Login & Registration */}
      <div className="space-y-2 bg-card p-4 border border-border">
        <h3 className="display-font text-sm uppercase tracking-wider text-muted-foreground">
          {isRegistering ? 'Neues Konto erstellen' : 'Mit E-Mail anmelden'}
        </h3>
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border text-sm"
            required
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border text-sm"
            required
          />
          {isRegistering && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border text-sm"
            >
              <option value="FAN">Fan</option>
              <option value="DJ">DJ</option>
              <option value="LABEL">Label</option>
              <option value="BAND">Band</option>
            </select>
          )}
          <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <Checkbox
              checked={acceptedLegal}
              onCheckedChange={(v) => setAcceptedLegal(v === true)}
              className="mt-0.5"
            />
            <span>
              Ich habe die{' '}
              <Link href="/terms" className="text-accent underline hover:text-primary">AGB</Link>
              {' '}gelesen und die{' '}
              <Link href="/privacy" className="text-accent underline hover:text-primary">Datenschutzerklärung</Link>
              {' '}zur Kenntnis genommen.
            </span>
          </label>
          <button
            type="submit"
            disabled={isLoading === 'email' || !acceptedLegal}
            className="w-full py-2 bg-primary text-primary-foreground font-medium disabled:opacity-50"
          >
            {isLoading === 'email' ? t('oauth.wait') : (isRegistering ? t('oauth.register') : t('auth.signIn'))}
          </button>
        </form>
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {isRegistering ? t('oauth.hasAccount') : t('oauth.noAccount')}
          </button>
        </div>
      </div>

      {/* Demo Login */}
      <div className="space-y-2 bg-card p-4 border border-dashed border-muted">
        <button
          type="button"
          onClick={() => setShowDemoPanel(!showDemoPanel)}
          className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="display-font uppercase tracking-wider text-xs">Demo-Anmeldung</span>
          <span className="text-xs">{showDemoPanel ? '▲' : '▼'}</span>
        </button>
        {showDemoPanel && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Teste alle Funktionen ohne echten Account. Demo-Daten werden nicht dauerhaft gespeichert.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoRoles.map(({ role: demoRole, label, description }) => (
                <button
                  key={demoRole}
                  type="button"
                  onClick={() => handleDemoLogin(demoRole)}
                  disabled={!!isLoading}
                  className="flex flex-col items-start p-3 bg-background border border-border hover:border-primary transition-colors text-left disabled:opacity-50"
                >
                  <span className="font-medium text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground mt-1 leading-tight">{description}</span>
                  {isLoading === `demo-${demoRole}` && (
                    <span className="text-xs text-primary mt-1">{t('oauth.signingIn')}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="display-font text-sm uppercase tracking-wider text-muted-foreground">
          {t('oauth.connectServices')}
        </h3>
        
        {!spotifyUser ? (
          <button
            onClick={handleSpotifyLogin}
            disabled={!!isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === 'spotify' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('oauth.connecting')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                {t('oauth.connectSpotify')}
              </>
            )}
          </button>
        ) : (
          <div className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">{spotifyUser.name}</p>
                <p className="text-xs text-muted-foreground">{spotifyUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleSpotifyLogout}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              {t('oauth.disconnect')}
            </button>
          </div>
        )}

        {!googleUser ? (
          <button
            onClick={handleGoogleLogin}
            disabled={!!isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === 'google' ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                {t('oauth.connecting')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('oauth.connectGoogle')}
              </>
            )}
          </button>
        ) : (
          <div className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border">
            <div className="flex items-center gap-3">
              {googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {googleUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{googleUser.name}</p>
                <p className="text-xs text-muted-foreground">{googleUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleGoogleLogout}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              {t('oauth.disconnect')}
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {t('oauth.privacyNote')}
        </p>
      </div>
    </div>
  );
}

