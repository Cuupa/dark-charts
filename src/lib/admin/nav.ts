import { ROUTES } from '@/lib/routes';

export interface AdminNavItem {
  label: string;
  href: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_DASHBOARD_HREF = ROUTES.admin;

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'CONTENT',
    items: [
      { label: 'Artists', href: ROUTES.adminArtists },
      { label: 'Releases', href: ROUTES.adminReleases },
    ],
  },
  {
    label: 'CHARTS',
    items: [
      { label: 'Chart Control', href: ROUTES.adminCharts },
      { label: 'Anomalies', href: ROUTES.adminAnomalies },
      { label: 'Votes', href: ROUTES.adminVotes },
      { label: 'Radio Monitor', href: ROUTES.adminRadio },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { label: 'Users', href: ROUTES.adminUsers },
      { label: 'Spotlight', href: ROUTES.adminSpotlight },
      { label: 'Analytics', href: ROUTES.adminAnalytics },
      { label: 'Badges', href: ROUTES.adminBadges },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Settings', href: ROUTES.adminSettings },
      { label: 'Features', href: ROUTES.adminFeatures },
      { label: 'Colors', href: ROUTES.adminColors },
      { label: 'API Keys', href: ROUTES.adminApiKeys },
      { label: 'System', href: ROUTES.adminSystem },
    ],
  },
];

export const ADMIN_SECTION_LINKS = [
  { label: 'Artists', description: 'Catalog sync, blacklist, visibility', href: ROUTES.adminArtists },
  { label: 'Chart Control', description: 'Voting pause, weekly recalculation', href: ROUTES.adminCharts },
  { label: 'Users', description: 'Roles, suspension, DJ expert status', href: ROUTES.adminUsers },
  { label: 'Spotlight', description: 'Promotion booking approvals', href: ROUTES.adminSpotlight },
  { label: 'Analytics', description: 'Metrics, API health, audit log', href: ROUTES.adminAnalytics },
  { label: 'Settings', description: 'Chart weights and credit budget', href: ROUTES.adminSettings },
] as const;