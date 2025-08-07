import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createSupabaseServiceClient } from '@/lib/supabase'
import type { Session } from 'next-auth'

export interface SessionInfo {
  session: Session | null
  isValid: boolean
  isExpiring: boolean
  minutesUntilExpiry: number
  needsRefresh: boolean
}

/**
 * Get enhanced session information on the server side
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return {
      session: null,
      isValid: false,
      isExpiring: false,
      minutesUntilExpiry: 0,
      needsRefresh: false,
    }
  }

  const expiryTime = new Date(session.expires).getTime()
  const currentTime = new Date().getTime()
  const minutesUntilExpiry = Math.max(0, Math.floor((expiryTime - currentTime) / (1000 * 60)))
  
  const isValid = minutesUntilExpiry > 0
  const isExpiring = minutesUntilExpiry <= 10 // Consider expiring if less than 10 minutes
  const needsRefresh = minutesUntilExpiry <= 60 // Needs refresh if less than 1 hour

  return {
    session,
    isValid,
    isExpiring,
    minutesUntilExpiry,
    needsRefresh,
  }
}

/**
 * Validate session and throw error if invalid
 */
export async function requireValidSession(): Promise<Session> {
  const sessionInfo = await getSessionInfo()
  
  if (!sessionInfo.isValid || !sessionInfo.session) {
    throw new Error('Session expired or invalid')
  }
  
  return sessionInfo.session
}

/**
 * Log session activity to database
 */
export async function logSessionActivity(
  userId: string,
  activity: string,
  metadata?: any
): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient()
    
    await supabase
      .from('yt_login_analytics')
      .insert({
        user_id: userId,
        event_type: 'session_activity',
        context: {
          activity,
          metadata,
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })
  } catch (error) {
    console.error('Failed to log session activity:', error)
  }
}

/**
 * Clean up expired sessions from database
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient()
    
    // Clean up expired NextAuth sessions
    await supabase
      .from('sessions')
      .delete()
      .lt('expires', new Date().toISOString())
    
    // Clean up expired custom user sessions if they exist
    await supabase
      .from('yt_user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      
    console.log('Cleaned up expired sessions')
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error)
  }
}

/**
 * Get session statistics for analytics
 */
export async function getSessionStats(userId?: string) {
  try {
    const supabase = createSupabaseServiceClient()
    
    let query = supabase
      .from('yt_login_analytics')
      .select('event_type, created_at, context')
      .in('event_type', ['login_success', 'session_activity', 'signout'])
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data: activities, error } = await query
    
    if (error) {
      console.error('Failed to get session stats:', error)
      return null
    }
    
    // Calculate statistics
    const stats = {
      totalSessions: activities?.filter(a => a.event_type === 'login_success').length || 0,
      totalActivities: activities?.filter(a => a.event_type === 'session_activity').length || 0,
      totalSignouts: activities?.filter(a => a.event_type === 'signout').length || 0,
      averageSessionDuration: 0, // Could be calculated if we track session start/end times
      mostActiveHours: [] as number[],
    }
    
    // Calculate most active hours
    const hourCounts: { [hour: number]: number } = {}
    activities?.forEach(activity => {
      const hour = new Date(activity.created_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    stats.mostActiveHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))
    
    return stats
  } catch (error) {
    console.error('Failed to get session stats:', error)
    return null
  }
}

/**
 * Middleware helper to check session validity
 */
export async function validateSessionMiddleware(request: Request): Promise<{
  isValid: boolean
  session: Session | null
  response?: Response
}> {
  try {
    const sessionInfo = await getSessionInfo()
    
    if (!sessionInfo.isValid) {
      return {
        isValid: false,
        session: null,
        response: new Response(
          JSON.stringify({ 
            error: 'Session expired',
            code: 'SESSION_EXPIRED',
            message: '会话已过期，请重新登录'
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    // Log activity if session is valid
    if (sessionInfo.session?.user?.id) {
      await logSessionActivity(
        sessionInfo.session.user.id,
        'api_request',
        {
          url: request.url,
          method: request.method,
          userAgent: request.headers.get('user-agent'),
        }
      )
    }
    
    return {
      isValid: true,
      session: sessionInfo.session,
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      isValid: false,
      session: null,
      response: new Response(
        JSON.stringify({ 
          error: 'Session validation failed',
          code: 'SESSION_ERROR',
          message: '会话验证失败'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}