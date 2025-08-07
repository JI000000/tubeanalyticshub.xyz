import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import type { Session } from 'next-auth'

export { authOptions }

/**
 * Get the current session on the server side
 */
export const getServerAuthSession = () => {
  return getServerSession(authOptions)
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (session: Session | null): boolean => {
  return !!session?.user?.id
}

/**
 * Get user ID from session
 */
export const getUserId = (session: Session | null): string | null => {
  return session?.user?.id || null
}

/**
 * Get user provider from session
 */
export const getUserProvider = (session: Session | null): string | null => {
  return session?.user?.provider || null
}

/**
 * Check if user is a new user (signed up within last 24 hours)
 */
export const isNewUser = async (userId: string): Promise<boolean> => {
  try {
    const { createSupabaseServiceClient } = await import('@/lib/supabase')
    const supabase = createSupabaseServiceClient()
    
    const { data: user } = await supabase
      .from('yt_users')
      .select('created_at')
      .eq('nextauth_user_id', userId)
      .single()
    
    if (!user?.created_at) return false
    
    const createdAt = new Date(user.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    
    return hoursDiff <= 24
  } catch (error) {
    console.error('Error checking if user is new:', error)
    return false
  }
}

/**
 * Get user data from yt_users table
 */
export const getUserData = async (userId: string) => {
  try {
    const { createSupabaseServiceClient } = await import('@/lib/supabase')
    const supabase = createSupabaseServiceClient()
    
    const { data: user, error } = await supabase
      .from('yt_users')
      .select('*')
      .eq('nextauth_user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user data:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error in getUserData:', error)
    return null
  }
}