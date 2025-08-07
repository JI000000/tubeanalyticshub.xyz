'use client'

import { useEffect, useState } from 'react'
import { useSessionManager } from '@/hooks/useSessionManager'
import { signOut } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react'

interface SessionExpiryModalProps {
  autoShowThreshold?: number // Minutes before expiry to auto-show modal
  autoRefreshThreshold?: number // Minutes before expiry to auto-refresh
}

export function SessionExpiryModal({ 
  autoShowThreshold = 3,
  autoRefreshThreshold = 1,
}: SessionExpiryModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(0)

  const {
    status,
    sessionStatus,
    refreshSession,
    minutesUntilExpiry,
    isRefreshing,
  } = useSessionManager({
    refreshThreshold: autoRefreshThreshold,
    warningThreshold: autoShowThreshold,
    onSessionExpired: () => {
      setIsOpen(false)
      // Redirect to sign in page
      window.location.href = '/auth/signin'
    },
    onSessionWarning: (minutesLeft) => {
      if (minutesLeft <= autoShowThreshold) {
        setIsOpen(true)
        setCountdown(minutesLeft * 60) // Convert to seconds
      }
    },
    onSessionRefreshed: () => {
      setIsOpen(false)
      setCountdown(0)
      setAutoRefreshCountdown(0)
    },
  })

  // Countdown timer
  useEffect(() => {
    if (!isOpen || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev - 1
        if (newCount <= 0) {
          setIsOpen(false)
          return 0
        }
        return newCount
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, countdown])

  // Auto-refresh countdown
  useEffect(() => {
    if (!isOpen || minutesUntilExpiry > autoRefreshThreshold) return

    const secondsUntilAutoRefresh = autoRefreshThreshold * 60
    setAutoRefreshCountdown(secondsUntilAutoRefresh)

    const timer = setInterval(() => {
      setAutoRefreshCountdown(prev => {
        const newCount = prev - 1
        if (newCount <= 0) {
          refreshSession()
          return 0
        }
        return newCount
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, minutesUntilExpiry, autoRefreshThreshold, refreshSession])

  const handleRefresh = async () => {
    await refreshSession()
  }

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressValue = () => {
    if (countdown <= 0) return 0
    const totalSeconds = autoShowThreshold * 60
    return ((totalSeconds - countdown) / totalSeconds) * 100
  }

  if (status !== 'authenticated') {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e: Event) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            会话即将过期
          </DialogTitle>
          <DialogDescription>
            您的登录会话即将过期。请选择延长会话或重新登录。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Countdown display */}
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-red-600">
              {formatTime(countdown)}
            </div>
            <p className="text-sm text-muted-foreground">剩余时间</p>
          </div>

          {/* Progress bar */}
          <Progress value={getProgressValue()} className="w-full" />

          {/* Auto-refresh countdown */}
          {autoRefreshCountdown > 0 && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                将在 <span className="font-mono font-bold">{formatTime(autoRefreshCountdown)}</span> 后自动延长会话
              </p>
            </div>
          )}

          {/* Session info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 延长会话将保持您的登录状态</p>
            <p>• 重新登录将清除当前会话数据</p>
            <p>• 会话过期后将自动跳转到登录页面</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            重新登录
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                延长中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                延长会话
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}