export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          passwordHash: string | null
          role: string
          isSuspended: boolean
          isPublicProfile: boolean
          emailVerified: boolean
          emailVerificationToken: string | null
          emailVerificationExpires: string | null
          trustLevel: number
          authProvider: string | null
          oauthProviderId: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          passwordHash?: string | null
          role?: string
          isSuspended?: boolean
          isPublicProfile?: boolean
          emailVerified?: boolean
          emailVerificationToken?: string | null
          emailVerificationExpires?: string | null
          trustLevel?: number
          authProvider?: string | null
          oauthProviderId?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          passwordHash?: string | null
          role?: string
          isSuspended?: boolean
          isPublicProfile?: boolean
          emailVerified?: boolean
          emailVerificationToken?: string | null
          emailVerificationExpires?: string | null
          trustLevel?: number
          authProvider?: string | null
          oauthProviderId?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      fan_profiles: {
        Row: {
          id: string
          userId: string
          nickname: string
          avatarUrl: string | null
          credits: number
          remainingCredits: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          nickname: string
          avatarUrl?: string | null
          credits?: number
          remainingCredits?: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          nickname?: string
          avatarUrl?: string | null
          credits?: number
          remainingCredits?: number
          createdAt?: string
          updatedAt?: string
        }
      }
      dj_profiles: {
        Row: {
          id: string
          userId: string
          bio: string | null
          displayName: string | null
          soundcloudLink: string | null
          expertStatus: boolean
          expertRequested: boolean
          reputationScore: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          bio?: string | null
          displayName?: string | null
          soundcloudLink?: string | null
          expertStatus?: boolean
          expertRequested?: boolean
          reputationScore?: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          bio?: string | null
          displayName?: string | null
          soundcloudLink?: string | null
          expertStatus?: boolean
          expertRequested?: boolean
          reputationScore?: number
          createdAt?: string
          updatedAt?: string
        }
      }
      band_profiles: {
        Row: {
          id: string
          userId: string
          artistId: string | null
          members: string[]
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          artistId?: string | null
          members?: string[]
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          artistId?: string | null
          members?: string[]
          createdAt?: string
          updatedAt?: string
        }
      }
      label_profiles: {
        Row: {
          id: string
          userId: string
          companyName: string
          website: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          companyName: string
          website?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          companyName?: string
          website?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      artists: {
        Row: {
          id: string
          name: string
          spotifyId: string | null
          genres: string[]
          bio: string | null
          profileLink: string | null
          imageUrl: string | null
          status: string
          labelId: string | null
          country: string | null
          foundedYear: number | null
          verified: boolean
          isVisible: boolean
          socialLinks: Json | null
          itunesId: string | null
          appleMusicUrl: string | null
          lastSyncedAt: string | null
          source: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          spotifyId?: string | null
          genres?: string[]
          bio?: string | null
          profileLink?: string | null
          imageUrl?: string | null
          status?: string
          labelId?: string | null
          country?: string | null
          foundedYear?: number | null
          verified?: boolean
          isVisible?: boolean
          socialLinks?: Json | null
          itunesId?: string | null
          appleMusicUrl?: string | null
          lastSyncedAt?: string | null
          source?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          spotifyId?: string | null
          genres?: string[]
          bio?: string | null
          profileLink?: string | null
          imageUrl?: string | null
          status?: string
          labelId?: string | null
          country?: string | null
          foundedYear?: number | null
          verified?: boolean
          isVisible?: boolean
          socialLinks?: Json | null
          itunesId?: string | null
          appleMusicUrl?: string | null
          lastSyncedAt?: string | null
          source?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      releases: {
        Row: {
          id: string
          title: string
          releaseType: string
          releaseDate: string
          spotifyId: string | null
          odesliLinks: Json | null
          itunesArtworkUrl: string | null
          vercelBlobUrl: string | null
          r2ArtworkUrl: string | null
          artistId: string
          albumType: 'album' | 'single' | 'ep' | 'compilation' | null
          totalTracks: number | null
          spotifyUrl: string | null
          artworkUrl: string | null
          highResArtworkUrl: string | null
          platformLinks: Json | null
          genres: string[]
          label: string | null
          isVisible: boolean
          itunesId: string | null
          appleMusicUrl: string | null
          syncPolicy: string
          source: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title: string
          releaseType?: string
          releaseDate: string
          spotifyId?: string | null
          odesliLinks?: Json | null
          itunesArtworkUrl?: string | null
          vercelBlobUrl?: string | null
          r2ArtworkUrl?: string | null
          artistId: string
          albumType?: 'album' | 'single' | 'ep' | 'compilation' | null
          totalTracks?: number | null
          spotifyUrl?: string | null
          artworkUrl?: string | null
          highResArtworkUrl?: string | null
          platformLinks?: Json | null
          genres?: string[]
          label?: string | null
          isVisible?: boolean
          itunesId?: string | null
          appleMusicUrl?: string | null
          syncPolicy?: string
          source?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          releaseType?: string
          releaseDate?: string
          spotifyId?: string | null
          odesliLinks?: Json | null
          itunesArtworkUrl?: string | null
          vercelBlobUrl?: string | null
          r2ArtworkUrl?: string | null
          artistId?: string
          albumType?: 'album' | 'single' | 'ep' | 'compilation' | null
          totalTracks?: number | null
          spotifyUrl?: string | null
          artworkUrl?: string | null
          highResArtworkUrl?: string | null
          platformLinks?: Json | null
          genres?: string[]
          label?: string | null
          isVisible?: boolean
          itunesId?: string | null
          appleMusicUrl?: string | null
          syncPolicy?: string
          source?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      sync_queue: {
        Row: {
          id: string
          artistId: string | null
          jobType: string
          status: string
          scheduledAt: string
          startedAt: string | null
          finishedAt: string | null
          lockedUntil: string | null
          cancelRequestedAt: string | null
          cancelledAt: string | null
          errorMessage: string | null
          attemptCount: number
          createdAt: string
        }
        Insert: {
          id?: string
          artistId?: string | null
          jobType?: string
          status?: string
          scheduledAt?: string
          startedAt?: string | null
          finishedAt?: string | null
          lockedUntil?: string | null
          cancelRequestedAt?: string | null
          cancelledAt?: string | null
          errorMessage?: string | null
          attemptCount?: number
          createdAt?: string
        }
        Update: {
          id?: string
          artistId?: string | null
          jobType?: string
          status?: string
          scheduledAt?: string
          startedAt?: string | null
          finishedAt?: string | null
          lockedUntil?: string | null
          cancelRequestedAt?: string | null
          cancelledAt?: string | null
          errorMessage?: string | null
          attemptCount?: number
          createdAt?: string
        }
      }
      sync_logs: {
        Row: {
          id: string
          artistId: string | null
          status: string
          message: string | null
          releasesSynced: number
          errors: Json
          apiSource: string | null
          durationMs: number | null
          metadata: Json | null
          createdAt: string
        }
        Insert: {
          id?: string
          artistId?: string | null
          status: string
          message?: string | null
          releasesSynced?: number
          errors?: Json
          apiSource?: string | null
          durationMs?: number | null
          metadata?: Json | null
          createdAt?: string
        }
        Update: {
          id?: string
          artistId?: string | null
          status?: string
          message?: string | null
          releasesSynced?: number
          errors?: Json
          apiSource?: string | null
          durationMs?: number | null
          metadata?: Json | null
          createdAt?: string
        }
      }
      chart_entries: {
        Row: {
          id: string
          placement: number
          score: number
          fanScore: number
          expertScore: number
          communityPower: number
          releaseId: string | null
          chartType: string
          genre: string | null
          weekStart: string
          movement: number
          trackId: string | null
          artistId: string | null
          weekNumber: number | null
          year: number | null
          createdAt: string
        }
        Insert: {
          id?: string
          placement: number
          score: number
          fanScore?: number
          expertScore?: number
          communityPower?: number
          releaseId?: string | null
          chartType: string
          genre?: string | null
          weekStart: string
          movement?: number
          trackId?: string | null
          artistId?: string | null
          weekNumber?: number | null
          year?: number | null
          createdAt?: string
        }
        Update: {
          id?: string
          placement?: number
          score?: number
          fanScore?: number
          expertScore?: number
          communityPower?: number
          releaseId?: string | null
          chartType?: string
          genre?: string | null
          weekStart?: string
          movement?: number
          trackId?: string | null
          artistId?: string | null
          weekNumber?: number | null
          year?: number | null
          createdAt?: string
        }
      }
      votes: {
        Row: {
          id: string
          fanId: string
          releaseId: string
          credits: number
          votes: number
          allocatedVotes: number
          cost: number
          weekStart: string
          createdAt: string
        }
        Insert: {
          id?: string
          fanId: string
          releaseId: string
          credits: number
          votes: number
          allocatedVotes?: number
          cost?: number
          weekStart: string
          createdAt?: string
        }
        Update: {
          id?: string
          fanId?: string
          releaseId?: string
          credits?: number
          votes?: number
          allocatedVotes?: number
          cost?: number
          weekStart?: string
          createdAt?: string
        }
      }
      expert_votes: {
        Row: {
          id: string
          djId: string
          releaseId: string
          rating: number
          rank: number
          weekStart: string
          createdAt: string
        }
        Insert: {
          id?: string
          djId: string
          releaseId: string
          rating: number
          rank?: number
          weekStart: string
          createdAt?: string
        }
        Update: {
          id?: string
          djId?: string
          releaseId?: string
          rating?: number
          rank?: number
          weekStart?: string
          createdAt?: string
        }
      }
      streaming_snapshots: {
        Row: {
          id: string
          artistId: string
          spotifyPopularity: number
          youtubePopularity: number
          followerCount: number
          topTrackPopularity: number
          weekStart: string
          createdAt: string
        }
        Insert: {
          id?: string
          artistId: string
          spotifyPopularity?: number
          youtubePopularity?: number
          followerCount?: number
          topTrackPopularity?: number
          weekStart: string
          createdAt?: string
        }
        Update: {
          id?: string
          artistId?: string
          spotifyPopularity?: number
          youtubePopularity?: number
          followerCount?: number
          topTrackPopularity?: number
          weekStart?: string
          createdAt?: string
        }
      }
      tracked_playlists: {
        Row: {
          id: string
          platform: string
          externalId: string
          name: string
          curatorName: string | null
          followerCount: number
          url: string | null
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          platform: string
          externalId: string
          name: string
          curatorName?: string | null
          followerCount?: number
          url?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          platform?: string
          externalId?: string
          name?: string
          curatorName?: string | null
          followerCount?: number
          url?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      radio_stations: {
        Row: {
          id: string
          name: string
          streamUrl: string | null
          nowPlayingUrl: string | null
          nowPlayingFormat: string | null
          country: string | null
          isActive: boolean
          discoverySource: string
          externalId: string | null
          homepageUrl: string | null
          tags: string[]
          bitrate: number | null
          codec: string | null
          monitorEnabled: boolean
          legalHold: boolean
          healthStatus: string
          lastProbeAt: string | null
          lastMetadataAt: string | null
          lastError: string | null
          consecutiveFailures: number
          priority: number
          probeIntervalSeconds: number
          metadataMode: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          streamUrl?: string | null
          nowPlayingUrl?: string | null
          nowPlayingFormat?: string | null
          country?: string | null
          isActive?: boolean
          discoverySource?: string
          externalId?: string | null
          homepageUrl?: string | null
          tags?: string[]
          bitrate?: number | null
          codec?: string | null
          monitorEnabled?: boolean
          legalHold?: boolean
          healthStatus?: string
          lastProbeAt?: string | null
          lastMetadataAt?: string | null
          lastError?: string | null
          consecutiveFailures?: number
          priority?: number
          probeIntervalSeconds?: number
          metadataMode?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          streamUrl?: string | null
          nowPlayingUrl?: string | null
          nowPlayingFormat?: string | null
          country?: string | null
          isActive?: boolean
          discoverySource?: string
          externalId?: string | null
          homepageUrl?: string | null
          tags?: string[]
          bitrate?: number | null
          codec?: string | null
          monitorEnabled?: boolean
          legalHold?: boolean
          healthStatus?: string
          lastProbeAt?: string | null
          lastMetadataAt?: string | null
          lastError?: string | null
          consecutiveFailures?: number
          priority?: number
          probeIntervalSeconds?: number
          metadataMode?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      airplay_events: {
        Row: {
          id: string
          releaseId: string | null
          artistId: string | null
          source: string
          sourcePlaylistId: string | null
          sourceStationId: string | null
          sourceLabel: string | null
          position: number | null
          reach: number
          weight: number
          idempotencyKey: string | null
          observedAt: string
          weekStart: string
          rawArtist: string | null
          rawTitle: string | null
          detectionMethod: string
          confidence: number
          streamHost: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          releaseId?: string | null
          artistId?: string | null
          source: string
          sourcePlaylistId?: string | null
          sourceStationId?: string | null
          sourceLabel?: string | null
          position?: number | null
          reach?: number
          weight?: number
          idempotencyKey?: string | null
          observedAt?: string
          weekStart: string
          rawArtist?: string | null
          rawTitle?: string | null
          detectionMethod?: string
          confidence?: number
          streamHost?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          releaseId?: string | null
          artistId?: string | null
          source?: string
          sourcePlaylistId?: string | null
          sourceStationId?: string | null
          sourceLabel?: string | null
          position?: number | null
          reach?: number
          weight?: number
          idempotencyKey?: string | null
          observedAt?: string
          weekStart?: string
          rawArtist?: string | null
          rawTitle?: string | null
          detectionMethod?: string
          confidence?: number
          streamHost?: string | null
          createdAt?: string
        }
      }
      airplay_snapshots: {
        Row: {
          id: string
          releaseId: string
          weekStart: string
          playlistAddCount: number
          playlistReach: number
          radioSpinCount: number
          radioStationCount: number
          djSpinCount: number
          totalReach: number
          score: number
          createdAt: string
        }
        Insert: {
          id?: string
          releaseId: string
          weekStart: string
          playlistAddCount?: number
          playlistReach?: number
          radioSpinCount?: number
          radioStationCount?: number
          djSpinCount?: number
          totalReach?: number
          score?: number
          createdAt?: string
        }
        Update: {
          id?: string
          releaseId?: string
          weekStart?: string
          playlistAddCount?: number
          playlistReach?: number
          radioSpinCount?: number
          radioStationCount?: number
          djSpinCount?: number
          totalReach?: number
          score?: number
          createdAt?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          adminId: string
          action: string
          details: Json | null
          createdAt: string
        }
        Insert: {
          id?: string
          adminId: string
          action: string
          details?: Json | null
          createdAt?: string
        }
        Update: {
          id?: string
          adminId?: string
          action?: string
          details?: Json | null
          createdAt?: string
        }
      }
      bookings: {
        Row: {
          id: string
          userId: string
          slotDate: string
          slotType: string
          status: string
          stripeSessionId: string | null
          stripePaymentId: string | null
          amountCents: number | null
          currency: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          slotDate: string
          slotType: string
          status?: string
          stripeSessionId?: string | null
          stripePaymentId?: string | null
          amountCents?: number | null
          currency?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          slotDate?: string
          slotType?: string
          status?: string
          stripeSessionId?: string | null
          stripePaymentId?: string | null
          amountCents?: number | null
          currency?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          iconUrl: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          iconUrl?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          iconUrl?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          userId: string
          badgeId: string
          earnedAt: string
        }
        Insert: {
          id?: string
          userId: string
          badgeId: string
          earnedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          badgeId?: string
          earnedAt?: string
        }
      }
      system_settings: {
        Row: {
          id: string
          isVotingPaused: boolean
          voiceCreditsBudget: number
          chartWeights: Json
          featureFlags: Json
          themeConfig: Json
          radioMonitor: Json
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          isVotingPaused?: boolean
          voiceCreditsBudget?: number
          chartWeights?: Json
          featureFlags?: Json
          themeConfig?: Json
          radioMonitor?: Json
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          isVotingPaused?: boolean
          voiceCreditsBudget?: number
          chartWeights?: Json
          featureFlags?: Json
          themeConfig?: Json
          radioMonitor?: Json
          createdAt?: string
          updatedAt?: string
        }
      }
      radio_monitor_heartbeat: {
        Row: {
          id: string
          seenAt: string
          workerVersion: string | null
          probesLastMinute: number
          error: string | null
        }
        Insert: {
          id?: string
          seenAt?: string
          workerVersion?: string | null
          probesLastMinute?: number
          error?: string | null
        }
        Update: {
          id?: string
          seenAt?: string
          workerVersion?: string | null
          probesLastMinute?: number
          error?: string | null
        }
      }
    }
    Views: never
    Functions: never
    Enums: never
    CompositeTypes: never
  }
}
