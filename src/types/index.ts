export type MainGenre = 'Gothic' | 'Metal' | 'Dark Electro' | 'Crossover';

export type Genre = 
  | 'Gothic Rock' | 'Dark Wave' | 'Post Punk' | 'Deathrock' | 'Cold Wave' 
  | 'Ethereal Wave' | 'Neoklassik' | 'Neue Deutsche Todeskunst' | 'Batcave' 
  | 'Neofolk' | 'Pagan Folk' | 'Nordic Folk' | 'Ritual Ambient'
  | 'Gothic Metal' | 'Dark Metal' | 'Symphonic Metal' | 'Doom Metal' 
  | 'Symphonic Black Metal' | 'Atmospheric Black Metal' | 'Death Doom' | 'Pagan Metal' | 'Melodic Death Metal'
  | 'Electronic Body Music' | 'Dark Electro' | 'Electro Industrial' | 'Aggrotech' 
  | 'Future Pop' | 'Industrial' | 'Rhythmic Noise' | 'Dark Synthpop' | 'Harsh EBM'
  | 'Industrial Metal' | 'Neue Deutsche Härte' | 'Mittelalter Rock' | 'Darksynth' 
  | 'Cybergoth' | 'Death Industrial' | 'Folk Metal' | 'Dark Techno' 
  | 'Industrial Techno' | 'Darkstep' | 'Crossbreed' | 'Techstep' | 'Neurofunk';

export type ChartType = 'fan' | 'expert' | 'streaming' | 'overall';

export type ViewType = 'home' | 'main-genre' | 'sub-genre' | 'profile' | 'custom-charts' | 'about' | 'voting' | 'voting-confirmation' | 'history' | 'admin' | 'admin-metrics' | 'admin-analytics' | 'admin-users' | 'admin-artists' | 'admin-charts' | 'admin-promotions' | 'admin-spotlight' | 'admin-anomalies' | 'admin-settings' | 'oauth-callback' | 'profiles-demo' | 'privacy' | 'terms' | 'imprint' | 'archive' | 'search';

export interface Track {
  artistId?: string;
  chartEntryId?: string;
  score?: number;
  source?: "demo" | "database" | "itunes";
  releaseType?: string;
  id: string;
  rank: number;
  artist: string;
  title: string;
  genres: Genre[];
  movement?: number;
  previousRank?: number;
  chartType: ChartType;
  fanScore?: number;
  expertScore?: number;
  streamingScore?: number;
  albumArt?: string;
  spotifyUri?: string;
  votes?: number;
  weeksInChart?: number;
  album?: string;
  releaseDate?: string;
  label?: string;
  appleMusicUrl?: string;
  amazonMusicUrl?: string;
  youtubeUrl?: string;
  overallRank?: number;
  subGenreRanks?: Record<Genre, number>;
  previewUrl?: string;
  isrc?: string;
  artworkHighRes?: string;
  odesliData?: OdesliData;
  community_power?: number;
  trend_direction?: 'up' | 'down' | 'stable' | 'new';
  topSupporters?: TrackSupporter[];
}

export interface TrackSupporter {
  userId: string;
  username: string;
  avatarUrl?: string;
  voteCount: number;
  userType: 'fan' | 'dj';
}

export interface OdesliData {
  id: string;
  entityUniqueId: string;
  userCountry: string;
  pageUrl: string;
  linksByPlatform: {
    [key: string]: {
      url: string;
      nativeAppUriMobile?: string;
      nativeAppUriDesktop?: string;
    };
  };
  entitiesByUniqueId: {
    [key: string]: {
      id: string;
      type: string;
      title?: string;
      artistName?: string;
      thumbnailUrl?: string;
      thumbnailWidth?: number;
      thumbnailHeight?: number;
      apiProvider: string;
      platforms: string[];
    };
  };
}

export interface CachedTrackData {
  trackId: string;
  odesliData?: OdesliData;
  artworkUrl?: string;
  previewUrl?: string;
  lastUpdated: number;
}

export interface ApiThrottleState {
  requestCount: number;
  windowStart: number;
  queue: Array<() => Promise<void>>;
}

export interface ChartWeights {
  fan: number;
  expert: number;
  streaming: number;
}

export interface ChartEdition {
  weekStart: string;
  publishedAt?: string;
  status: "demo" | "published" | "unavailable";
  source: "demo" | "database" | "itunes";
  rulesVersion?: string;
  weights?: ChartWeights;
}

export interface ChartData {
  edition?: ChartEdition;
  fanCharts: Track[];
  expertCharts: Track[];
  streamingCharts: Track[];
  combinedCharts?: Track[];
}

export interface Vote {
  trackId: string;
  credits: number;
  timestamp: number;
}

export interface IDataService {
  getAllCharts(): Promise<ChartData>;
  getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]>;
  calculateOverallChart(): Track[];
  vote(trackId: string, direction: 'up' | 'down'): Promise<void>;
  getVotes(trackId: string): Promise<number>;
  getUserVotesForTrack(trackId: string): Promise<number>;
  getNextChartPublicationDate(): Date;
}

export type UserType = 'fan' | 'band' | 'dj' | 'label';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
}

export interface ExternalLink {
  platform: string;
  url: string;
  verified: boolean;
}

export interface BaseUserProfile {
  id: string;
  userType: UserType;
  username: string;
  biography?: string;
  avatarUrl?: string;
  externalLinks: ExternalLink[];
  displayedBadges: string[];
  allBadges: Badge[];
  isPublicProfile: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FanProfile extends BaseUserProfile {
  userType: 'fan';
  votingCredits: number;
  votingHistory: Vote[];
  favoritesList: string[];
  personalCharts: string[];
  curatedCharts: CuratedChart[];
  followingIds: string[];
  followerIds: string[];
  engagementStats?: {
    votingStreak: number;
    genreAffinity: Record<Genre, number>;
    totalVotesLifetime: number;
    weeklyActivity: number;
  };
  tasteProfile?: {
    genreScores: Record<Genre, number>;
    topGenres: Genre[];
  };
  roadToSuperfan?: {
    artistId: string;
    artistName: string;
    currentLevel: number;
    maxLevel: number;
    progress: number;
  }[];
  schemaOrgData?: SchemaOrgPerson;
}

export interface BandProfile extends BaseUserProfile {
  userType: 'band';
  genres: Genre[];
  spotifyArtistId?: string;
  bannerUrl?: string;
  isVerified?: boolean;
  latestReleases: {
    title: string;
    releaseDate: number;
    spotifyUri?: string;
    previewUrl?: string;
    albumArt?: string;
  }[];
  isPremium: boolean;
  analytics?: {
    totalVotes: number;
    chartPositions: { chartType: ChartType; position: number; peakPosition?: number }[];
    demographics: Record<string, number>;
    weeksInChart: number;
    peakPosition: number;
  };
  bookingInfo?: {
    available: boolean;
    regions: string[];
    contactEmail?: string;
  };
  followerIds: string[];
  topSupporters?: {
    userId: string;
    username: string;
    avatarUrl?: string;
    voteCount: number;
    userType: 'fan' | 'dj';
  }[];
  upcomingEvents?: MusicEvent[];
  mediaGallery?: {
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }[];
  schemaOrgData?: SchemaOrgMusicGroup;
}

export interface DJProfile extends BaseUserProfile {
  userType: 'dj';
  expertStatus?: boolean;
  expertRequested?: boolean;
  expertWeight: number;
  references: string[];
  curatedPlaylists: {
    name: string;
    trackIds: string[];
    createdAt: number;
  }[];
  supportedTracks: string[];
  reputation: number;
  followerIds: string[];
  followingIds: string[];
  predictivePower?: {
    correctPredictions: number;
    totalPredictions: number;
    accuracy: number;
    earlyPredictions: EarlyPrediction[];
  };
  subgenreAccuracy?: Record<Genre, GenreAccuracy>;
  curatedCharts: CuratedChart[];
  earnedBadges: Badge[];
  nextBadgeProgress?: {
    badgeId: string;
    badgeName: string;
    currentProgress: number;
    requiredProgress: number;
    percentageComplete: number;
  };
  schemaOrgData?: SchemaOrgPerson;
}

export interface EarlyPrediction {
  trackId: string;
  trackTitle: string;
  artistName: string;
  supportedAt: number;
  enteredTop10At: number;
  weeksBeforeEntry: number;
  finalPosition: number;
  genres: Genre[];
}

export interface GenreAccuracy {
  totalVotes: number;
  successfulVotes: number;
  accuracy: number;
  lastUpdated: number;
}

export interface LabelProfile extends BaseUserProfile {
  userType: 'label';
  logoUrl?: string;
  bannerUrl?: string;
  businessLinks?: {
    websiteUrl?: string;
    shopUrl?: string;
    contactEmail?: string;
  };
  managedBands: string[];
  roster?: {
    bandId: string;
    bandName: string;
    avatarUrl?: string;
    genres: Genre[];
    chartRelevance: number;
  }[];
  aggregatedAnalytics?: {
    totalVotes: number;
    totalStreams: number;
    chartWeeks: number;
    top10Placements: number;
    topBands: { bandId: string; bandName: string; performance: number }[];
  };
  latestRosterReleases?: {
    bandId: string;
    bandName: string;
    releaseTitle: string;
    releaseDate: number;
    albumArt?: string;
  }[];
  scoutingNotes: {
    bandId: string;
    note: string;
    timestamp: number;
  }[];
  schemaOrgData?: SchemaOrgOrganization;
}

export type UserProfile = FanProfile | BandProfile | DJProfile | LabelProfile;

export interface AuthUser {
  id: string;
  email?: string;
  provider?: 'spotify' | 'apple' | 'email' | 'demo';
  isAuthenticated: boolean;
  isDemo?: boolean;
  role?: string;
  emailVerified?: boolean;
  trustLevel?: number;
  authProvider?: string | null;
  profile?: UserProfile;
}

export interface IAuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  login(provider: 'spotify' | 'apple' | 'email' | 'demo', credentials?: { email: string; password: string }): Promise<AuthUser>;
  loginDemo(role: 'FAN' | 'DJ' | 'BAND' | 'LABEL'): Promise<AuthUser>;
  logout(): Promise<void>;
  updateProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
}

export interface ChartSnapshot {
  week: number;
  date: number;
  fanCharts: Track[];
  expertCharts: Track[];
  /** @deprecated Legacy field kept for older stored snapshots */
  streamingCharts?: Track[];
  overallCharts?: Track[];
}

export interface TrackHistory {
  trackId: string;
  artist: string;
  title: string;
  history: {
    week: number;
    date: number;
    rank: number;
    chartType: ChartType;
    movement: number;
  }[];
}

export interface WeeklyMovement {
  week: number;
  date: number;
  movers: {
    biggest: Track[];
    risers: Track[];
    fallers: Track[];
    newEntries: Track[];
    reEntries: Track[];
  };
}

export interface Artist {
  id: string;
  name: string;
  spotifyId?: string;
  appleMusicId?: string;
  genres: Genre[];
  artwork?: string;
  bio?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Release {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  releaseDate: string;
  albumArt?: string;
  spotifyUri?: string;
  appleMusicUrl?: string;
  type: 'album' | 'single' | 'ep';
  tracks?: ReleaseTrack[];
  createdAt: number;
  lastCached: number;
}

export interface ReleaseTrack {
  id: string;
  title: string;
  duration: number;
  trackNumber: number;
  spotifyUri?: string;
  previewUrl?: string;
}

export interface ArtistCacheStatus {
  artistId: string;
  lastSync: number;
  nextSync: number;
  releaseCount: number;
  status: 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export interface CuratedChart {
  id: string;
  userId: string;
  title: string;
  description?: string;
  trackIds: string[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  followerCount: number;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: number;
}

export interface MusicEvent {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
  };
  url?: string;
  description?: string;
}

export interface SchemaOrgPerson {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  image?: string;
  description?: string;
  url?: string;
  sameAs?: string[];
}

export interface SchemaOrgMusicGroup {
  '@context': 'https://schema.org';
  '@type': 'MusicGroup';
  name: string;
  image?: string;
  description?: string;
  genre?: string[];
  url?: string;
  sameAs?: string[];
  member?: string[];
  event?: MusicEvent[];
  foundingDate?: string;
  albumRelease?: {
    '@type': 'MusicAlbum';
    name: string;
    datePublished: string;
  }[];
}

export interface SchemaOrgOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization' | 'RecordLabel';
  name: string;
  logo?: string;
  image?: string;
  description?: string;
  url?: string;
  sameAs?: string[];
  email?: string;
  member?: string[];
}

export interface ActivityFeedItem {
  id: string;
  type: 'follow' | 'chart_created' | 'milestone' | 'prediction' | 'badge_earned';
  userId: string;
  username: string;
  avatarUrl?: string;
  timestamp: number;
  data: Record<string, any>;
}

export type UserRole = 'user' | 'moderator' | 'admin';

export type UserStatus = 'active' | 'restricted' | 'banned';

export type AuditAction =
  | 'user_banned'
  | 'user_restricted'
  | 'user_activated'
  | 'user_deleted'
  | 'genre_created'
  | 'genre_updated'
  | 'genre_deactivated'
  | 'genre_activated'
  | 'track_approved'
  | 'track_rejected'
  | 'verification_approved'
  | 'verification_rejected'
  | 'report_resolved'
  | 'report_dismissed';

export interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: AuditAction;
  targetType: 'user' | 'genre' | 'track' | 'verification' | 'report';
  targetId: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  lastLogin?: number;
  votingHistory: Vote[];
  reportCount: number;
}

export interface GenreDefinition {
  id: string;
  name: Genre;
  mainGenre: MainGenre;
  keywords: string[];
  isActive: boolean;
  trackCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  username: string;
  userType: 'dj' | 'band' | 'label';
  socialProofLinks: string[];
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: number;
  notes?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: 'user' | 'track' | 'profile';
  targetId: string;
  reason: 'spam' | 'harassment' | 'fake_profile' | 'inappropriate_content' | 'other';
  description: string;
  submittedAt: number;
  status: 'pending' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: number;
  resolution?: string;
}

export interface SpotlightBooking {
  id: string;
  userId: string;
  artistName: string;
  trackId?: string;
  startDate: number;
  endDate: number;
  position: 'hero' | 'sidebar' | 'featured';
  amount: number;
  isPaid: boolean;
  stripePaymentId?: string;
  createdAt: number;
}
