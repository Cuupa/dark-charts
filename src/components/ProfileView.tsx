import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client-fetch';
import { 
  User, SignOut,
  PencilSimple, FloppyDisk, X, Trophy,
  MusicNotes, DownloadSimple, Trash, Megaphone
} from '@phosphor-icons/react';
import { FanProfile, BandProfile, DJProfile, LabelProfile, UserType } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { OAuthLoginButtons } from '@/components/OAuthLoginButtons';
import { BandClaimCard } from '@/components/BandClaimCard';
import { LabelRosterCard } from '@/components/LabelRosterCard';
import { DjExpertCard } from '@/components/DjExpertCard';
import { oauthService } from '@/services/oauthService';
import { ProfileStatsSkeleton, ProfileActivitySkeleton } from '@/components/skeletons';

function LoginView() {
  const { t } = useLanguage();

  return (
    <Card className="bg-card border border-accent p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, var(--border) 8px, var(--border) 16px)`
        }} />
      </div>
      <div className="relative">
        <User weight="duotone" className="w-24 h-24 mx-auto text-muted-foreground mb-6 opacity-40" />
        <h2 className="display-font text-3xl md:text-4xl uppercase text-foreground mb-4 tracking-tight font-semibold">
          {t('profile.signIn')}
        </h2>
        <p className="font-ui text-muted-foreground uppercase tracking-[0.2em] text-xs mb-8">
          {t('profile.signInDescription')}
        </p>

        <div className="max-w-md mx-auto">
          <OAuthLoginButtons />
        </div>
      </div>
    </Card>
  );
}

function EmailVerificationBanner({
  emailVerified,
  authProvider,
}: {
  emailVerified?: boolean;
  authProvider?: string | null;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isResending, setIsResending] = useState(false);

  if (emailVerified || authProvider !== 'email') {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await authFetch('/api/auth/verify-email/resend', { method: 'POST' });
      if (!res.ok) throw new Error('Resend failed');
      toast.success(t('profile.verificationResent'));
    } catch {
      toast.error(t('profile.verificationResendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="bg-destructive/10 border border-destructive/40 p-4">
      <p className="font-ui text-sm text-foreground">{t('profile.verificationRequired')}</p>
      <p className="font-ui text-xs text-muted-foreground mt-2">
        {t('profile.verificationHint')}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 font-ui text-[10px] uppercase"
        onClick={handleResend}
        disabled={isResending}
      >
        {isResending ? t('profile.verificationSending') : t('profile.verificationResend')}
      </Button>
    </Card>
  );
}

function TrustBoostCard({ trustLevel }: { trustLevel?: number }) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  if ((trustLevel ?? 0) >= 3) {
    return null;
  }

  const handleTrustBoost = async () => {
    setIsLoading(true);
    try {
      await oauthService.initiateSpotifyTrustBoost();
    } catch {
      toast.error(t('profile.trustBoostFailed'));
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border border-border p-6">
      <h3 className="display-font text-xl uppercase tracking-tight text-foreground font-semibold mb-2">
        {t('profile.trustBoostTitle')}
      </h3>
      <p className="font-ui text-sm text-muted-foreground mb-4">
        {t('profile.trustBoostDescription')}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleTrustBoost}
        disabled={isLoading}
        className="font-ui text-[10px] uppercase"
      >
        {isLoading ? '…' : t('profile.trustBoostAction')}
      </Button>
    </Card>
  );
}

function AccountSettingsCard() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await authFetch('/api/auth/export');
      if (!res.ok) {
        throw new Error('Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dark-charts-export-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('profile.exportSuccess'));
    } catch {
      toast.error(t('profile.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error(t('profile.deleteConfirmError'));
      return;
    }

    setIsDeleting(true);
    try {
      const res = await authFetch('/api/auth/account', { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Delete failed');
      }
      toast.success(t('profile.deleteSuccess'));
      await logout();
    } catch {
      toast.error(t('profile.deleteFailed'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <Card className="bg-card border border-border p-6">
      <h3 className="display-font text-xl uppercase tracking-tight text-foreground font-semibold mb-4">
        {t('profile.accountSettings')}
      </h3>
      <p className="font-ui text-sm text-muted-foreground mb-6">
        {t('profile.accountSettingsDescription')}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="font-ui text-[10px] uppercase"
        >
          <DownloadSimple weight="bold" className="w-4 h-4 mr-1" />
          {isExporting ? t('profile.exporting') : t('profile.exportData')}
        </Button>

        {!showDeleteConfirm ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="font-ui text-[10px] uppercase"
          >
            <Trash weight="bold" className="w-4 h-4 mr-1" />
            {t('profile.deleteAccount')}
          </Button>
        ) : (
          <div className="flex flex-col gap-2 w-full max-w-md">
            <p className="font-ui text-xs text-destructive uppercase tracking-wider">
              {t('profile.deleteWarning')}
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={t('profile.deleteConfirmPlaceholder')}
              className="bg-background border-border font-ui text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="font-ui text-[10px] uppercase"
              >
                {isDeleting ? t('profile.deleting') : t('profile.confirmDelete')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="font-ui text-[10px] uppercase"
              >
                {t('profile.cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function FanProfileView({
  profile,
  emailVerified,
  authProvider,
  trustLevel,
}: {
  profile: FanProfile;
  emailVerified?: boolean;
  authProvider?: string | null;
  trustLevel?: number;
}) {
  const { updateProfile, logout } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [biography, setBiography] = useState(profile.biography || '');
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingStats(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    try {
      await updateProfile({ username, biography });
      setIsEditing(false);
      toast.success(t('profile.saveChanges') || 'Profile updated successfully!');
    } catch (error) {
      toast.error(t('oauth.loginFailed') || 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      <EmailVerificationBanner
        emailVerified={emailVerified}
        authProvider={authProvider}
      />
      <Card className="bg-card border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary border-2 border-primary flex items-center justify-center">
              <User weight="bold" className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              {!isEditing ? (
                <>
                  <h2 className="display-font text-2xl uppercase tracking-tight text-foreground font-semibold">
                    {profile.username}
                  </h2>
                  <Badge className="mt-2 bg-primary text-primary-foreground font-ui text-[10px] uppercase">
                    <MusicNotes weight="bold" className="w-3 h-3 mr-1" />
                    {t('profile.fan')}
                  </Badge>
                </>
              ) : (
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-border font-ui text-lg font-bold uppercase"
                />
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="snap-transition font-ui text-[10px] uppercase"
                >
                  <PencilSimple weight="bold" className="w-4 h-4 mr-1" />
                  {t('profile.edit')}
                </Button>
                <Button
                  onClick={logout}
                  size="sm"
                  variant="outline"
                  className="snap-transition font-ui text-[10px] uppercase"
                >
                  <SignOut weight="bold" className="w-4 h-4 mr-1" />
                  {t('profile.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-primary hover:bg-primary/80 snap-transition font-ui text-[10px] uppercase"
                >
                  <FloppyDisk weight="bold" className="w-4 h-4 mr-1" />
                  {t('profile.save')}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  size="sm"
                  variant="outline"
                  className="snap-transition font-ui text-[10px] uppercase"
                >
                  <X weight="bold" className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          {!isEditing ? (
            <p className="font-ui text-sm text-muted-foreground leading-relaxed">
              {profile.biography || t('profile.noBio')}
            </p>
          ) : (
            <Textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              className="bg-background border-border font-ui min-h-[100px]"
            />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border border-border p-6">
          <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {t('profile.votingCredits')}
          </p>
          <p className="data-font text-4xl font-bold text-primary">
            {profile.votingCredits}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            {t('profile.availableForVoting')}
          </p>
        </Card>

        <Card className="bg-card border border-border p-6">
          <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {t('profile.votingHistory')}
          </p>
          <p className="data-font text-4xl font-bold text-accent">
            {profile.votingHistory.length}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            {t('profile.totalVotesCast')}
          </p>
        </Card>

        <Card className="bg-card border border-border p-6">
          <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {t('profile.favorites')}
          </p>
          <p className="data-font text-4xl font-bold text-foreground">
            {profile.favoritesList.length}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            {t('profile.savedTracks')}
          </p>
        </Card>
      </div>

      {profile.allBadges.length > 0 && (
        <Card className="bg-card border border-border p-6">
          <h3 className="display-font text-xl uppercase tracking-tight text-foreground font-semibold mb-4">
            <Trophy weight="bold" className="w-5 h-5 inline mr-2" />
            {t('profile.earnedBadges')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {profile.allBadges.map(badge => (
              <div
                key={badge.id}
                className="border border-border bg-secondary/10 p-4 text-center snap-transition hover:border-accent"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className="font-ui text-[10px] uppercase tracking-[0.12em] font-bold text-foreground">
                  {badge.name}
                </p>
                <p className="font-ui text-[8px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <TrustBoostCard trustLevel={trustLevel} />
      <AccountSettingsCard />
    </div>
  );
}

function BandLabelProfileView({ userType }: { userType: 'band' | 'label' }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {t('profile.profileType')}
            </p>
            <h2 className="display-font text-2xl uppercase tracking-tight text-foreground font-semibold">
              {userType === 'band' ? 'Band' : 'Label'}
            </h2>
            <p className="font-ui text-sm text-muted-foreground mt-2">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={() => logout()} className="font-ui text-[10px] uppercase">
            <SignOut weight="bold" className="w-4 h-4 mr-1" />
            {t('profile.signOut') || 'Sign out'}
          </Button>
        </div>
      </Card>

      {userType === 'band' ? <BandClaimCard /> : null}
      {userType === 'label' ? <LabelRosterCard /> : null}

      <Card className="bg-card border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border border-accent bg-accent/10 flex items-center justify-center shrink-0">
            <Megaphone weight="fill" className="w-6 h-6 text-accent" />
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="display-font text-xl uppercase tracking-tight text-foreground font-semibold">
              {t('spotlight.booking.title')}
            </h3>
            <p className="font-ui text-sm text-muted-foreground">{t('spotlight.booking.subtitle')}</p>
            <Button asChild className="font-ui text-[10px] uppercase">
              <Link href="/spotlight">{t('spotlight.booking.checkout')}</Link>
            </Button>
          </div>
        </div>
      </Card>

      <AccountSettingsCard />
    </div>
  );
}

export function ProfileView() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
          {t('profile.title')}
        </h1>
        <Card className="bg-card border border-border p-12 text-center">
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-secondary mx-auto mb-4" />
            <div className="h-6 bg-secondary w-48 mx-auto mb-2" />
            <div className="h-4 bg-secondary w-32 mx-auto" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
        {t('profile.title')}
      </h1>

      {!user?.isAuthenticated ? (
        <LoginView />
      ) : user.profile?.userType === 'fan' ? (
        <FanProfileView
          profile={user.profile as FanProfile}
          emailVerified={user.emailVerified}
          authProvider={user.authProvider}
          trustLevel={user.trustLevel}
        />
      ) : user.profile?.userType === 'dj' ? (
        <DjExpertCard
          expertStatus={(user.profile as DJProfile).expertStatus}
          expertRequested={(user.profile as DJProfile).expertRequested}
          reputationScore={(user.profile as DJProfile).reputation}
          displayName={(user.profile as DJProfile).username}
        />
      ) : user.profile?.userType === 'band' || user.profile?.userType === 'label' ? (
        <BandLabelProfileView userType={user.profile.userType} />
      ) : (
        <Card className="bg-card border border-border p-8">
          <div className="text-center">
            <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {t('profile.profileType')}: Unknown
            </p>
            <p className="font-ui text-xs text-muted-foreground mt-4">
              {t('profile.comingSoon')}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
