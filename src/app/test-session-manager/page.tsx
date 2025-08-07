'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useSessionManager } from '@/hooks/useSessionManager'
import { SessionStatusIndicator } from '@/components/auth/SessionStatusIndicator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, LogOut, LogIn, Clock, Activity, AlertTriangle } from 'lucide-react'

export default function TestSessionManagerPage() {
  const { data: session, status } = useSession()
  const [sessionStats, setSessionStats] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const {
    sessionStatus,
    refreshSession,
    updateActivity,
    isExpiring,
    minutesUntilExpiry,
    isRefreshing,
    lastRefresh,
  } = useSessionManager({
    refreshThreshold: 5,
    warningThreshold: 10,
    enableCrossTabSync: true,
    onSessionExpired: () => {
      console.log('Session expired callback triggered')
    },
    onSessionRefreshed: () => {
      console.log('Session refreshed callback triggered')
    },
    onSessionWarning: (minutesLeft) => {
      console.log(`Session warning: ${minutesLeft} minutes left`)
    },
  })

  // Load session statistics
  const loadSessionStats = async () => {
    if (!session?.user?.id) return

    setIsLoadingStats(true)
    try {
      const response = await fetch('/api/session/stats')
      if (response.ok) {
        const stats = await response.json()
        setSessionStats(stats)
      }
    } catch (error) {
      console.error('Failed to load session stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      loadSessionStats()
    }
  }, [status])

  // Simulate user activity
  const simulateActivity = () => {
    updateActivity()
    console.log('User activity simulated')
  }

  // Force session expiry for testing
  const forceExpiry = async () => {
    try {
      await fetch('/api/session/expire', { method: 'POST' })
      console.log('Session expiry forced')
    } catch (error) {
      console.error('Failed to force session expiry:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>会话管理测试</CardTitle>
            <CardDescription>
              请先登录以测试会话管理功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => signIn()} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">会话管理测试</h1>
        <Button variant="outline" onClick={() => signOut()}>
          <LogOut className="h-4 w-4 mr-2" />
          登出
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <img 
              src={session?.user?.image || '/default-avatar.png'} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{session?.user?.provider}</Badge>
            <Badge variant="outline">ID: {session?.user?.id}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            会话状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SessionStatusIndicator showDetails={true} />
          
          <Separator />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">剩余时间</p>
              <p className="text-muted-foreground">{minutesUntilExpiry} 分钟</p>
            </div>
            <div>
              <p className="font-medium">状态</p>
              <p className="text-muted-foreground">
                {isRefreshing ? '刷新中' : isExpiring ? '即将过期' : '正常'}
              </p>
            </div>
            <div>
              <p className="font-medium">上次刷新</p>
              <p className="text-muted-foreground">
                {lastRefresh ? lastRefresh.toLocaleTimeString() : '未刷新'}
              </p>
            </div>
            <div>
              <p className="font-medium">会话过期时间</p>
              <p className="text-muted-foreground">
                {session?.expires ? new Date(session.expires).toLocaleString() : '未知'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            会话控制
          </CardTitle>
          <CardDescription>
            测试会话管理功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={refreshSession}
              disabled={isRefreshing}
              variant="outline"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  刷新中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  手动刷新会话
                </>
              )}
            </Button>
            
            <Button 
              onClick={simulateActivity}
              variant="outline"
            >
              <Activity className="h-4 w-4 mr-2" />
              模拟用户活动
            </Button>
            
            <Button 
              onClick={forceExpiry}
              variant="destructive"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              强制会话过期
            </Button>
            
            <Button 
              onClick={loadSessionStats}
              disabled={isLoadingStats}
              variant="outline"
            >
              {isLoadingStats ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              刷新统计
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Statistics */}
      {sessionStats && (
        <Card>
          <CardHeader>
            <CardTitle>会话统计</CardTitle>
            <CardDescription>
              过去7天的会话活动统计
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{sessionStats.totalSessions}</p>
                <p className="text-sm text-muted-foreground">总登录次数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{sessionStats.totalActivities}</p>
                <p className="text-sm text-muted-foreground">活动次数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{sessionStats.totalSignouts}</p>
                <p className="text-sm text-muted-foreground">登出次数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {sessionStats.mostActiveHours.length > 0 ? sessionStats.mostActiveHours[0] : '-'}
                </p>
                <p className="text-sm text-muted-foreground">最活跃时段</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>测试说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• 会话将在过期前10分钟显示警告</p>
          <p>• 会话将在过期前5分钟自动刷新</p>
          <p>• 会话将在过期前3分钟显示过期模态框</p>
          <p>• 会话将在过期前1分钟自动尝试刷新</p>
          <p>• 跨标签页会话状态会自动同步</p>
          <p>• 用户活动会更新活动时间戳</p>
        </CardContent>
      </Card>
    </div>
  )
}