import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { SupabaseAdapter } from '@next-auth/supabase-adapter'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : undefined,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced for better security)
    updateAge: 60 * 60, // 1 hour (refresh session every hour)
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Persist the OAuth access_token and user info to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token
        token.provider = account.provider
        token.username = (user as any).username || (profile as any)?.login
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.sub!
        session.user.provider = token.provider as string
        session.user.username = token.username as string
        session.accessToken = token.accessToken as string
      }
      
      // Enhanced user data sync with yt_users table
      if (session.user?.email) {
        try {
          const { getUserFullData, syncUserProfile, updateUserActivity } = await import('@/lib/user-sync')
          
          // Get user data from database
          const userResult = await getUserFullData(session.user.id)
          
          if (userResult.success && userResult.userData) {
            // Add user data to session for client access
            ;(session.user as any).plan = userResult.userData.plan
            ;(session.user as any).quota_used = userResult.userData.quota_used
            ;(session.user as any).quota_limit = userResult.userData.quota_limit
            ;(session.user as any).preferences = userResult.userData.preferences
            
            // Sync profile data if it has changed
            await syncUserProfile(session.user.id, {
              name: session.user.name || undefined,
              image: session.user.image || undefined,
              email: session.user.email,
            })
            
            // Update user activity
            await updateUserActivity(session.user.id)
          } else {
            // User doesn't exist in yt_users table, will be initialized on first API call
            console.log('User not found in yt_users table, will be initialized on first sync')
          }
        } catch (error) {
          console.error('Error in enhanced session callback:', error)
        }
      }
      
      return session
    },
    async signIn() {
      // Allow sign in
      return true
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Track sign in event for analytics
      try {
        const { createSupabaseServiceClient } = await import('@/lib/supabase')
        const supabase = createSupabaseServiceClient()
        
        await supabase
          .from('yt_login_analytics')
          .insert({
            user_id: user.id,
            event_type: 'login_success',
            provider: account?.provider,
            context: {
              isNewUser,
              userAgent: (profile as any)?.user_agent,
            },
            created_at: new Date().toISOString(),
          })
      } catch (error) {
        console.error('Error tracking sign in event:', error)
      }
    },
    async signOut({ session, token }) {
      // Track sign out event
      try {
        const { createSupabaseServiceClient } = await import('@/lib/supabase')
        const supabase = createSupabaseServiceClient()
        
        await supabase
          .from('yt_login_analytics')
          .insert({
            user_id: session?.user?.id || token?.sub,
            event_type: 'signout',
            created_at: new Date().toISOString(),
          })
      } catch (error) {
        console.error('Error tracking sign out event:', error)
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}