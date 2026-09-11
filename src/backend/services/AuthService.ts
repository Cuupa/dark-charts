import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildVerificationUrl,
  generateEmailVerificationToken,
  hashVerificationToken,
} from '@/lib/email-verification'
import { sendVerificationEmail } from '@/lib/email'
import { trustLevelForProvider } from '@/lib/trust-level'
import { logger } from '@/lib/logger'

type AuthSupabaseClient = SupabaseClient<any, 'public', any>

const JWT_EXPIRES_IN = '7d'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable must be set')
  }
  return secret
}

export interface RegisterUserData {
  email: string
  password: string
  role: 'ADMIN' | 'LABEL' | 'BAND' | 'DJ' | 'FAN'
  profileData?: {
    nickname?: string
    bio?: string
    soundcloudLink?: string
    artistId?: string
    companyName?: string
    website?: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  token: string
  user: {
    id: string
    email: string
    role: string
    emailVerified?: boolean
    trustLevel?: number
  }
}

export class AuthService {
  private supabasePromise: Promise<AuthSupabaseClient> | null = null

  private async getSupabase(): Promise<AuthSupabaseClient> {
    if (!this.supabasePromise) {
      this.supabasePromise = import('@/lib/supabase/server').then(
        ({ createServiceRoleSupabaseClient }) =>
          createServiceRoleSupabaseClient()
      )
    }
    return this.supabasePromise
  }

  async register(userData: RegisterUserData): Promise<AuthResult> {
    if (userData.role === 'ADMIN') {
      throw new Error('Admin registration is not allowed.')
    }

    const supabase = await this.getSupabase()

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle()
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const { token: verificationToken, tokenHash, expiresAt } =
      generateEmailVerificationToken()

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: false,
      user_metadata: {
        role: userData.role,
        nickname: userData.profileData?.nickname,
      },
    })

    if (authError || !authUser.user) {
      throw new Error(authError?.message || 'Failed to create auth user')
    }

    const userId = authUser.user.id

    const { data: user, error } = await supabase
      .from('users')
      .update({
        role: userData.role,
        emailVerified: false,
        trustLevel: trustLevelForProvider('email', false),
        authProvider: 'email',
        emailVerificationToken: tokenHash,
        emailVerificationExpires: expiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error || !user) {
      throw new Error(error?.message || 'Failed to create user profile')
    }

    if (userData.role !== 'FAN') {
      await this.createRoleProfile(
        supabase,
        userId,
        userData.role,
        userData.profileData
      )
    } else if (userData.profileData?.nickname) {
      await supabase
        .from('fan_profiles')
        .update({ nickname: userData.profileData.nickname })
        .eq('userId', userId)
    }

    try {
      await sendVerificationEmail(
        userData.email,
        buildVerificationUrl(verificationToken)
      )
    } catch (emailError) {
      logger.error('Failed to send verification email', { error: emailError })
    }

    const token = this.generateToken(user.id, user.email, user.role)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: false,
        trustLevel: user.trustLevel ?? 0,
      },
    }
  }

  async loginOrRegisterOAuth(data: {
    email: string
    name: string
    provider: 'spotify' | 'google'
    providerId: string
  }): Promise<AuthResult> {
    const supabase = await this.getSupabase()

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', data.email)
      .maybeSingle()

    if (existingUser?.isSuspended) {
      throw new Error('Account suspended')
    }

    if (existingUser) {
      const trustLevel = Math.max(
        existingUser.trustLevel ?? 0,
        trustLevelForProvider(data.provider, true)
      )

      await supabase
        .from('users')
        .update({
          authProvider: data.provider,
          oauthProviderId: data.providerId,
          emailVerified: true,
          trustLevel,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingUser.id)

      const token = this.generateToken(
        existingUser.id,
        existingUser.email,
        existingUser.role
      )
      return {
        token,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          emailVerified: true,
          trustLevel,
        },
      }
    }

    const trustLevel = trustLevelForProvider(data.provider, true)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        passwordHash: null,
        role: 'FAN',
        emailVerified: true,
        trustLevel,
        authProvider: data.provider,
        oauthProviderId: data.providerId,
      })
      .select()
      .single()

    if (error || !user) {
      throw new Error(error?.message || 'Failed to create user')
    }

    await this.createRoleProfile(supabase, user.id, 'FAN', {
      nickname: data.name || `OAuth-${data.provider}`,
    })

    const token = this.generateToken(user.id, user.email, user.role)
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: true,
        trustLevel,
      },
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    const supabase = await this.getSupabase()
    const tokenHash = hashVerificationToken(token)

    const { data: user, error } = await supabase
      .from('users')
      .select('id, emailVerificationExpires')
      .eq('emailVerificationToken', tokenHash)
      .maybeSingle()

    if (error || !user) {
      throw new Error('Invalid or expired verification token')
    }

    if (
      user.emailVerificationExpires &&
      new Date(user.emailVerificationExpires) < new Date()
    ) {
      throw new Error('Verification token expired')
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        emailVerified: true,
        trustLevel: trustLevelForProvider('email', true),
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return { success: true }
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, emailVerified, authProvider')
      .eq('id', userId)
      .maybeSingle()

    if (error || !user) {
      throw new Error('User not found')
    }

    if (user.emailVerified || user.authProvider !== 'email') {
      throw new Error('Email already verified')
    }

    const { token, tokenHash, expiresAt } = generateEmailVerificationToken()
    const { error: updateError } = await supabase
      .from('users')
      .update({
        emailVerificationToken: tokenHash,
        emailVerificationExpires: expiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    await sendVerificationEmail(user.email, buildVerificationUrl(token))
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const supabase = await this.getSupabase()

    const { data: legacyUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', credentials.email)
      .maybeSingle()

    if (!legacyUser?.passwordHash) {
      throw new Error('Invalid credentials')
    }

    if (legacyUser.isSuspended) {
      throw new Error('Account suspended')
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      legacyUser.passwordHash
    )

    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    const token = this.generateToken(legacyUser.id, legacyUser.email, legacyUser.role)
    return {
      token,
      user: {
        id: legacyUser.id,
        email: legacyUser.email,
        role: legacyUser.role,
        emailVerified: legacyUser.emailVerified ?? false,
        trustLevel: legacyUser.trustLevel ?? 0,
      },
    }
  }

  async verifyToken(
    token: string
  ): Promise<{ userId: string; email: string; role: string; isDemo?: boolean } | null> {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as {
        userId: string
        email: string
        role: string
        isDemo?: boolean
      }

      return decoded
    } catch {
      return null
    }
  }

  async registerAdmin(email: string, password: string): Promise<AuthResult> {
    const supabase = await this.getSupabase()

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'ADMIN' },
    })

    if (authError || !authUser.user) {
      throw new Error(authError?.message || 'Failed to create admin auth user')
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        role: 'ADMIN',
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', authUser.user.id)
      .select()
      .single()

    if (error || !user) {
      throw new Error(error?.message || 'Failed to create admin user')
    }

    const token = this.generateToken(user.id, user.email, user.role)
    return { token, user: { id: user.id, email: user.email, role: user.role } }
  }

  private generateToken(
    userId: string,
    email: string,
    role: string,
    isDemo?: boolean
  ): string {
    return jwt.sign(
      { userId, email, role, ...(isDemo ? { isDemo: true } : {}) },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    )
  }

  private async createRoleProfile(
    supabase: AuthSupabaseClient,
    userId: string,
    role: string,
    profileData?: RegisterUserData['profileData']
  ): Promise<void> {
    switch (role) {
      case 'FAN': {
        const { error } = await supabase.from('fan_profiles').insert({
          userId,
          nickname: profileData?.nickname || 'Anonymous Fan',
          credits: 150,
          remainingCredits: 150,
        })
        if (error) {
          throw new Error(error.message)
        }
        break
      }

      case 'DJ': {
        const { error } = await supabase.from('dj_profiles').insert({
          userId,
          bio: profileData?.bio ?? null,
          soundcloudLink: profileData?.soundcloudLink ?? null,
          expertStatus: false,
          reputationScore: 1,
        })
        if (error) {
          throw new Error(error.message)
        }
        break
      }

      case 'BAND': {
        const { error } = await supabase.from('band_profiles').insert({
          userId,
          artistId: profileData?.artistId ?? null,
          members: [],
        })
        if (error) {
          throw new Error(error.message)
        }
        break
      }

      case 'LABEL': {
        const { error } = await supabase.from('label_profiles').insert({
          userId,
          companyName: profileData?.companyName || 'Unnamed Label',
          website: profileData?.website ?? null,
        })
        if (error) {
          throw new Error(error.message)
        }
        break
      }

      default:
        break
    }
  }
}

export const authService = new AuthService()