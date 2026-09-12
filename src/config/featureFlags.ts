export interface FeatureFlagDefinition {
  key: string;
  label: string;
  description: string;
  defaultValue: boolean;
}

export const FEATURE_FLAG_DEFINITIONS: FeatureFlagDefinition[] = [
  {
    key: 'spotlightEnabled',
    label: 'Spotlight bookings',
    description: 'Allow artists to book spotlight promotion slots.',
    defaultValue: true,
  },
  {
    key: 'expertVotingEnabled',
    label: 'Expert voting',
    description: 'Enable DJ expert chart ratings.',
    defaultValue: true,
  },
  {
    key: 'fanVotingEnabled',
    label: 'Fan voting',
    description: 'Allow fans to cast weekly votes.',
    defaultValue: true,
  },
  {
    key: 'publicProfilesEnabled',
    label: 'Public profiles',
    description: 'Show user profile pages and badges publicly.',
    defaultValue: true,
  },
  {
    key: 'maintenanceMode',
    label: 'Maintenance mode',
    description: 'Show a maintenance notice and block non-admin actions.',
    defaultValue: false,
  },
  {
    key: 'radioMonitorEnabled',
    label: 'Radio monitor',
    description: 'Allow the passive radio worker to probe public streams for now-playing metadata.',
    defaultValue: false,
  },
];

export type FeatureFlagKey = (typeof FEATURE_FLAG_DEFINITIONS)[number]['key'];

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export function mergeFeatureFlags(overrides: Record<string, unknown> | null | undefined): FeatureFlags {
  const merged = {} as FeatureFlags;
  for (const def of FEATURE_FLAG_DEFINITIONS) {
    const override = overrides?.[def.key];
    merged[def.key as FeatureFlagKey] =
      typeof override === 'boolean' ? override : def.defaultValue;
  }
  return merged;
}