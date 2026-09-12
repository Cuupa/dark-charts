import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AuthUser, UserProfile } from '@/types';
import { logger } from '@/lib/logger';
import { asyncStorage } from '@/lib/storage/asyncStorage';
import { tryCreateBrowserSupabaseClient } from '@/lib/supabase/client';
import { authFetch } from '@/lib/auth/client-fetch';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (provider: 'spotify' | 'apple' | 'email', credentials?: LoginCredentials) => Promise<void>;
  loginDemo: (role: 'FAN' | 'DJ' | 'BAND' | 'LABEL' | 'ADMIN') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function roleToUserType(role?: string): 'fan' | 'dj' | 'band' | 'label' {
  switch (role) {
    case 'DJ':
      return 'dj';
    case 'BAND':
      return 'band';
    case 'LABEL':
      return 'label';
    default:
      return 'fan';
  }
}

function buildProfileFromRole(data: any): UserProfile | undefined {
  const user = data.user ?? data;
  const role = user?.role ?? data.role;

  if (user?.fanProfile) {
    return {
      userType: 'fan',
      id: user.fanProfile.id,
      username: user.fanProfile.nickname,
      biography: '',
      externalLinks: [],
      displayedBadges: [],
      allBadges: [],
      isPublicProfile: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      votingCredits: user.fanProfile.remainingCredits ?? 150,
      votingHistory: [],
      favoritesList: [],
      personalCharts: [],
    } as any;
  }

  if (user?.djProfile) {
    return {
      userType: 'dj',
      id: user.djProfile.id,
      username: user.djProfile.displayName || user.email?.split('@')[0] || 'DJ',
      biography: user.djProfile.bio ?? '',
      externalLinks: [],
      displayedBadges: [],
      allBadges: [],
      isPublicProfile: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expertStatus: user.djProfile.expertStatus,
      expertRequested: user.djProfile.expertRequested,
      reputation: Number(user.djProfile.reputationScore ?? 1),
    } as any;
  }

  if (user?.bandProfile) {
    return {
      userType: 'band',
      id: user.bandProfile.id,
      username: user.email?.split('@')[0] ?? 'Band',
      biography: '',
      externalLinks: [],
      displayedBadges: [],
      allBadges: [],
      isPublicProfile: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      genres: [],
      latestReleases: [],
    } as any;
  }

  if (user?.labelProfile) {
    return {
      userType: 'label',
      id: user.labelProfile.id,
      username: user.labelProfile.companyName ?? 'Label',
      biography: '',
      externalLinks: [],
      displayedBadges: [],
      allBadges: [],
      isPublicProfile: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;
  }

  if (role) {
    return {
      userType: roleToUserType(role),
      id: user?.id ?? data.id,
      username: user?.email?.split('@')[0] ?? 'User',
      biography: '',
      externalLinks: [],
      displayedBadges: [],
      allBadges: [],
      isPublicProfile: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;
  }

  return undefined;
}

function buildAuthUser(data: any, provider: AuthUser['provider'] = 'email'): AuthUser {
  const user = data.user ?? data;
  return {
    id: user?.id ?? data.id,
    email: user?.email ?? data.email,
    provider,
    isAuthenticated: true,
    isDemo: user?.isDemo ?? data.isDemo ?? false,
    role: user?.role ?? data.role,
    emailVerified: user?.emailVerified ?? data.emailVerified,
    trustLevel: user?.trustLevel ?? data.trustLevel,
    authProvider: user?.authProvider ?? data.authProvider,
    profile: buildProfileFromRole(data),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authFetch('/api/auth/me');

      if (!response.ok) {
        await asyncStorage.delete('auth-token');
        await asyncStorage.delete('auth-user');
        setUser(null);
        return;
      }

      const data = await response.json();
      const authUser = buildAuthUser(data);
      await asyncStorage.set('auth-user', authUser);
      setUser(authUser);
      setError(null);
    } catch (err) {
      const refreshError = err instanceof Error ? err : new Error('Failed to refresh user');
      logger.error('Failed to refresh user', { error: refreshError });
      setError(refreshError);
    }
  }, []);

  useEffect(() => {
    const supabase = tryCreateBrowserSupabaseClient();

    const subscription = supabase?.auth.onAuthStateChange(() => {
      void refreshUser();
    }).data.subscription;

    refreshUser().finally(() => setIsLoading(false));

    return () => subscription?.unsubscribe();
  }, [refreshUser]);

  const login = async (
    provider: 'spotify' | 'apple' | 'email',
    credentials?: LoginCredentials
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      if (provider === 'email') {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const supabase = tryCreateBrowserSupabaseClient();
        let signInError: Error | null = null;
        let sessionData: Awaited<
          ReturnType<NonNullable<typeof supabase>['auth']['signInWithPassword']>
        >['data'] | null = null;

        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });
          signInError = error;
          sessionData = data;
        } else {
          signInError = new Error('Supabase not configured');
        }

        if (signInError) {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Authentication failed');
          }

          const payload = await response.json();
          if (payload.token) {
            await asyncStorage.set('auth-token', payload.token);
          }
          const authUser = buildAuthUser(payload);
          await asyncStorage.set('auth-user', authUser);
          setUser(authUser);
          return;
        }

        if (sessionData?.session?.access_token) {
          await asyncStorage.set('auth-token', sessionData.session.access_token);
        }
        await refreshUser();
        return;
      }

      if (provider === 'spotify' || provider === 'apple') {
        throw new Error(`OAuth for ${provider} is initiated via the OAuth buttons`);
      }
    } catch (err) {
      const loginError = err instanceof Error ? err : new Error('Login failed');
      logger.error('Login failed', { error: loginError });
      setError(loginError);
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async (role: 'FAN' | 'DJ' | 'BAND' | 'LABEL' | 'ADMIN') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Demo login failed');
      }

      const data = await response.json();
      if (data.token) {
        await asyncStorage.set('auth-token', data.token);
      }
      const authUser = buildAuthUser(data, 'demo');
      await asyncStorage.set('auth-user', authUser);
      setUser(authUser);
    } catch (err) {
      const demoError = err instanceof Error ? err : new Error('Demo login failed');
      logger.error('Demo login failed', { error: demoError });
      setError(demoError);
      throw demoError;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = tryCreateBrowserSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      await asyncStorage.delete('auth-token');
      await asyncStorage.delete('auth-user');
      await fetch('/api/auth/demo-login', { method: 'DELETE', credentials: 'include' });
      setUser(null);
    } catch (err) {
      const logoutError = err instanceof Error ? err : new Error('Logout failed');
      logger.error('Logout failed', { error: logoutError });
      setError(logoutError);
      throw logoutError;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      const updatedProfile = { ...user.profile, ...updates } as UserProfile;
      const updatedUser = { ...user, profile: updatedProfile };

      await asyncStorage.set('auth-user', updatedUser);
      setUser(updatedUser);
      setError(null);
    } catch (err) {
      const updateError = err instanceof Error ? err : new Error('Profile update failed');
      logger.error('Profile update failed', { error: updateError });
      setError(updateError);
      throw updateError;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    const supabase = tryCreateBrowserSupabaseClient();
    if (supabase) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) return session.access_token;
      } catch {
        // Fall through to legacy token
      }
    }
    return asyncStorage.get<string>('auth-token');
  };

  const getToken = getAuthToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        loginDemo,
        logout,
        updateProfile,
        refreshUser,
        getAuthToken,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}