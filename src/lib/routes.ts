import { ChartType, Genre, MainGenre, ViewType } from '@/types';
import { mainGenreMap } from '@/lib/config/genres';

export const ROUTES = {
  home: '/',
  voting: '/voting',
  votingConfirmation: '/voting/confirmation',
  history: '/history',
  archive: '/charts/archive',
  profile: '/profile',
  customCharts: '/custom-charts',
  about: '/about',
  oauthCallback: '/oauth/callback',
  privacy: '/privacy',
  terms: '/terms',
  imprint: '/imprint',
  methodology: '/methodology',
  spotlight: '/spotlight',
  search: '/search',
  djs: '/djs',
  admin: '/admin',
  adminAnalytics: '/admin/analytics',
  adminMetrics: '/admin/metrics',
  adminUsers: '/admin/users',
  adminArtists: '/admin/artists',
  adminReleases: '/admin/releases',
  adminCharts: '/admin/charts',
  adminAnomalies: '/admin/anomalies',
  adminVotes: '/admin/votes',
  adminSpotlight: '/admin/spotlight',
  adminPromotions: '/admin/promotions',
  adminBadges: '/admin/badges',
  adminSettings: '/admin/settings',
  adminFeatures: '/admin/features',
  adminColors: '/admin/colors',
  adminApiKeys: '/admin/api-keys',
  adminSystem: '/admin/system',
  adminRadio: '/admin/radio',
  airplay: '/airplay',
} as const;

const MAIN_GENRE_SLUGS: Record<MainGenre, string> = {
  Gothic: 'gothic',
  Metal: 'metal',
  'Dark Electro': 'dark-electro',
  Crossover: 'crossover',
};

const SLUG_TO_MAIN_GENRE = Object.fromEntries(
  Object.entries(MAIN_GENRE_SLUGS).map(([genre, slug]) => [slug, genre as MainGenre])
) as Record<string, MainGenre>;

/** Public chart mode slugs (URL). `club` maps to expert data internally. */
export type PillarSlug = 'fan' | 'club' | 'streaming';

const PILLAR_SLUGS: PillarSlug[] = ['fan', 'club', 'streaming'];

export function artistPath(id: string): string {
  return `/artist/${id}`;
}

export function releasePath(id: string): string {
  return `/release/${id}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mainGenreToSlug(genre: MainGenre): string {
  return MAIN_GENRE_SLUGS[genre];
}

export function slugToMainGenre(slug: string): MainGenre | null {
  return SLUG_TO_MAIN_GENRE[slug] ?? null;
}

export function subGenreToSlug(genre: Genre): string {
  return slugify(genre);
}

export function slugToSubGenre(slug: string, mainGenre?: MainGenre): Genre | null {
  if (!mainGenre) return null;
  const subGenres = mainGenreMap[mainGenre] ?? [];
  return subGenres.find((g) => subGenreToSlug(g) === slug) ?? null;
}

export type ChartListPillar = PillarSlug | 'overview';

export function pillarChartPath(pillar: PillarSlug | ChartType | 'overview'): string {
  if (pillar === 'expert') return '/charts/club';
  if (pillar === 'overall' || pillar === 'overview') return ROUTES.home;
  return `/charts/${pillar}`;
}

export function chartListPath(pillar: ChartListPillar, genre?: MainGenre | null): string {
  const base = pillarChartPath(pillar);
  if (!genre) return base;
  return `${base}?genre=${mainGenreToSlug(genre)}`;
}

export function genreFromQuery(value: string | null | undefined): MainGenre | null {
  if (!value) return null;
  return slugToMainGenre(value);
}

export function isValidPillarSlug(slug: string): slug is PillarSlug {
  return PILLAR_SLUGS.includes(slug as PillarSlug);
}

/** Map URL pillar slug to underlying chart data type */
export function pillarSlugToChartType(slug: PillarSlug): ChartType {
  if (slug === 'club') return 'expert';
  if (slug === 'streaming') return 'streaming';
  return 'fan';
}

export function mainGenrePath(mainGenre: MainGenre, subGenre?: Genre): string {
  const base = `/genre/${mainGenreToSlug(mainGenre)}`;
  return subGenre ? `${base}/${subGenreToSlug(subGenre)}` : base;
}

export function viewToPath(view: ViewType): string {
  switch (view) {
    case 'home':
      return ROUTES.home;
    case 'voting':
      return ROUTES.voting;
    case 'voting-confirmation':
      return ROUTES.votingConfirmation;
    case 'history':
      return ROUTES.history;
    case 'archive':
      return ROUTES.archive;
    case 'profile':
      return ROUTES.profile;
    case 'custom-charts':
      return ROUTES.customCharts;
    case 'about':
      return ROUTES.about;
    case 'search':
      return ROUTES.search;
    case 'oauth-callback':
      return ROUTES.oauthCallback;
    case 'privacy':
      return ROUTES.privacy;
    case 'terms':
      return ROUTES.terms;
    case 'imprint':
      return ROUTES.imprint;
    case 'admin':
      return ROUTES.admin;
    case 'admin-metrics':
    case 'admin-analytics':
      return ROUTES.adminAnalytics;
    case 'admin-users':
      return ROUTES.adminUsers;
    case 'admin-artists':
      return ROUTES.adminArtists;
    case 'admin-charts':
      return ROUTES.adminCharts;
    case 'admin-promotions':
    case 'admin-spotlight':
      return ROUTES.adminSpotlight;
    case 'admin-settings':
      return ROUTES.adminSettings;
    case 'admin-anomalies':
      return ROUTES.adminAnomalies;
    default:
      return ROUTES.home;
  }
}

export function pathToView(pathname: string): ViewType | null {
  const path = pathname.replace(/\/$/, '') || '/';

  const exact: Record<string, ViewType> = {
    '/': 'home',
    [ROUTES.voting]: 'voting',
    [ROUTES.votingConfirmation]: 'voting-confirmation',
    [ROUTES.history]: 'history',
    [ROUTES.archive]: 'archive',
    [ROUTES.profile]: 'profile',
    [ROUTES.customCharts]: 'custom-charts',
    [ROUTES.about]: 'about',
    [ROUTES.search]: 'search',
    [ROUTES.oauthCallback]: 'oauth-callback',
    [ROUTES.privacy]: 'privacy',
    [ROUTES.terms]: 'terms',
    [ROUTES.imprint]: 'imprint',
    [ROUTES.admin]: 'admin',
    [ROUTES.adminAnalytics]: 'admin-analytics',
    [ROUTES.adminMetrics]: 'admin-metrics',
    [ROUTES.adminUsers]: 'admin-users',
    [ROUTES.adminArtists]: 'admin-artists',
    [ROUTES.adminCharts]: 'admin-charts',
    [ROUTES.adminSpotlight]: 'admin-spotlight',
    [ROUTES.adminPromotions]: 'admin-promotions',
    [ROUTES.adminSettings]: 'admin-settings',
    [ROUTES.adminAnomalies]: 'admin-anomalies',
  };

  if (exact[path]) return exact[path];
  if (path.startsWith('/charts/')) return 'home';
  if (path.startsWith('/genre/')) return 'main-genre';
  return null;
}

export function navigateToChart(
  router: { push: (href: string) => void },
  chartType?: ChartType,
  mainGenre?: MainGenre,
  subGenre?: Genre
): void {
  if (mainGenre) {
    router.push(mainGenrePath(mainGenre, subGenre));
    return;
  }
  if (chartType === 'fan') {
    router.push(pillarChartPath('fan'));
    return;
  }
  if (chartType === 'expert') {
    router.push(pillarChartPath('club'));
    return;
  }
  router.push(ROUTES.home);
}

export const NAV_ITEMS: { view: ViewType; href: string; labelKey: string; fallback: string }[] = [
  { view: 'home', href: ROUTES.home, labelKey: 'nav.home', fallback: 'Charts' },
  { view: 'search', href: ROUTES.search, labelKey: 'nav.search', fallback: 'Search' },
  { view: 'custom-charts', href: ROUTES.customCharts, labelKey: 'nav.custom', fallback: 'Custom' },
  { view: 'voting', href: ROUTES.voting, labelKey: 'nav.voting', fallback: 'Vote' },
  { view: 'history', href: ROUTES.history, labelKey: 'nav.history', fallback: 'History' },
  { view: 'about', href: ROUTES.about, labelKey: 'nav.about', fallback: 'About' },
];

/** @deprecated Use ADMIN_NAV_GROUPS from @/lib/admin/nav */
export const ADMIN_NAV_ITEMS = [
  { id: 'admin', href: ROUTES.admin, label: 'Dashboard' },
  { id: 'admin-users', href: ROUTES.adminUsers, label: 'Users' },
  { id: 'admin-artists', href: ROUTES.adminArtists, label: 'Artists' },
  { id: 'admin-charts', href: ROUTES.adminCharts, label: 'Charts Control' },
  { id: 'admin-spotlight', href: ROUTES.adminSpotlight, label: 'Spotlight' },
  { id: 'admin-analytics', href: ROUTES.adminAnalytics, label: 'Analytics' },
  { id: 'admin-settings', href: ROUTES.adminSettings, label: 'Settings' },
] as const;