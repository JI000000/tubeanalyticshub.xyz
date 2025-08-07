'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef, useCallback, useState } from 'react'
import { toast } from 'sonner'

interface SessionManagerOptions {
  refreshThreshold?: number // Minutes before expiry to refresh
  warningThreshold?: number // Minutes before expiry to show warning
  enableCrossTabSync?: boolean
  onSessionExpired?: () => void
  onSessionRefreshed?: () => void
  onSessionWarning?: (minutesLeft: number) => void
}

interface SessionStatus {
  isExpiring: boolean
  minutesUntilExpiry: number
  lastRefresh: Date | null
  isRefreshing: boolean
}

export function useSessionManager(options: SessionManagerOptions = {}) {
  const {
    refreshThreshold = 5, // Refresh 5 minutes before expiry
    warningThreshold = 10, // Warn 10 minutes before expiry
    enableCrossTabSync = true,
    onSessionExpired,
    onSessionRefreshed,
    onSessionWarning,
  } = options

  const { data: session, status, update } = useSession()
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({
    isExpiring: false,
    minutesUntilExpiry: 0,
    lastRefresh: null,
    isRefreshing: false,
  })

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<Date>(new Date())
  const isRefreshingRef = useRef(false)

  // Calculate minutes until session expiry
  const getMinutesUntilExpiry = useCallback(() => {
    if (!session?.expires) return 0
    const expiryTime = new Date(session.expires).getTime()
    const currentTime = new Date().getTime()
    return Math.max(0, Math.floor((expiryTime - currentTime) / (1000 * 60)))
  }, [session?.expires])

  // Refresh session
  const refreshSession = useCallback(async () => {
    if (isRefreshingRef.current || status !== 'authenticated') return

    try {
      isRefreshingRef.current = true
      setSessionStatus(prev => ({ ...prev, isRefreshing: true }))

      console.log('Refreshing session...')
      await update()

      setSessionStatus(prev => ({
        ...prev,
        lastRefresh: new Date(),
        isRefreshing: false,
      }))

      onSessionRefreshed?.()
      
      // Show success toast
      toast.success('会话已刷新', {
        description: '您的登录状态已更新',
        duration: 2000,
      })

    } catch (error) {
      console.error('Failed to refresh session:', error)
      setSessionStatus(prev => ({ ...prev, isRefreshing: false }))
      
      // Show error toast
      toast.error('会话刷新失败', {
        description: '请重新登录',
        duration: 5000,
      })
    } finally {
      isRefreshingRef.current = false
    }
  }, [update, status, onSessionRefreshed])

  // Handle session expiry
  const handleSessionExpiry = useCallback(() => {
    console.log('Session expired')
    onSessionExpired?.()
    
    toast.error('会话已过期', {
      description: '请重新登录以继续使用',
      duration: 0, // Don't auto-dismiss
      action: {
        label: '重新登录',
        onClick: () => {
          window.location.href = '/auth/signin'
        },
      },
    })
  }, [onSessionExpired])

  // Show session expiry warning
  const showExpiryWarning = useCallback((minutesLeft: number) => {
    console.log(`Session expiring in ${minutesLeft} minutes`)
    setSessionStatus(prev => ({ 
      ...prev, 
      isExpiring: true,
      minutesUntilExpiry: minutesLeft,
    }))

    onSessionWarning?.(minutesLeft)

    toast.warning('会话即将过期', {
      description: `您的登录状态将在 ${minutesLeft} 分钟后过期`,
      duration: 10000,
      action: {
        label: '延长会话',
        onClick: refreshSession,
      },
    })
  }, [onSessionWarning, refreshSession])

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = new Date()
  }, [])

  // Setup session monitoring
  useEffect(() => {
    if (status !== 'authenticated' || !session?.expires) {
      return
    }

    const checkSession = () => {
      const minutesLeft = getMinutesUntilExpiry()
      
      setSessionStatus(prev => ({
        ...prev,
        minutesUntilExpiry: minutesLeft,
      }))

      // Clear existing timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }

      if (minutesLeft <= 0) {
        // Session expired
        handleSessionExpiry()
      } else if (minutesLeft <= refreshThreshold) {
        // Auto-refresh session
        refreshSession()
      } else if (minutesLeft <= warningThreshold) {
        // Show warning
        if (!sessionStatus.isExpiring) {
          showExpiryWarning(minutesLeft)
        }
      } else {
        // Schedule warning
        const warningDelay = (minutesLeft - warningThreshold) * 60 * 1000
        warningTimeoutRef.current = setTimeout(() => {
          showExpiryWarning(warningThreshold)
        }, warningDelay)

        // Schedule refresh
        const refreshDelay = (minutesLeft - refreshThreshold) * 60 * 1000
        refreshTimeoutRef.current = setTimeout(() => {
          refreshSession()
        }, refreshDelay)
      }
    }

    // Initial check
    checkSession()

    // Check every minute
    const interval = setInterval(checkSession, 60 * 1000)

    return () => {
      clearInterval(interval)
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
    }
  }, [
    session?.expires,
    status,
    refreshThreshold,
    warningThreshold,
    getMinutesUntilExpiry,
    refreshSession,
    handleSessionExpiry,
    showExpiryWarning,
    sessionStatus.isExpiring,
  ])

  // Cross-tab session synchronization
  useEffect(() => {
    if (!enableCrossTabSync || typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'session-refresh') {
        console.log('Session refreshed in another tab')
        // Trigger session update in this tab
        update()
      } else if (e.key === 'session-expired') {
        console.log('Session expired in another tab')
        handleSessionExpiry()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, check if session needs refresh
        const minutesLeft = getMinutesUntilExpiry()
        if (minutesLeft <= refreshThreshold && minutesLeft > 0) {
          refreshSession()
        }
      }
    }

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Listen for user activity to update activity timestamp
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
    }
  }, [
    enableCrossTabSync,
    update,
    handleSessionExpiry,
    getMinutesUntilExpiry,
    refreshSession,
    refreshThreshold,
    updateActivity,
  ])

  // Broadcast session events to other tabs
  useEffect(() => {
    if (!enableCrossTabSync || typeof window === 'undefined') return

    if (sessionStatus.lastRefresh) {
      localStorage.setItem('session-refresh', Date.now().toString())
    }
  }, [sessionStatus.lastRefresh, enableCrossTabSync])

  return {
    session,
    status,
    sessionStatus,
    refreshSession,
    updateActivity,
    isExpiring: sessionStatus.isExpiring,
    minutesUntilExpiry: sessionStatus.minutesUntilExpiry,
    isRefreshing: sessionStatus.isRefreshing,
    lastRefresh: sessionStatus.lastRefresh,
  }
}