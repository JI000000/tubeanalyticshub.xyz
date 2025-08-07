'use client'

import { useSessionManager } from '@/hooks/useSessionManager'
import { Clock, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SessionStatusIndicatorProps {
  className?: string
  showDetails?: boolean
  compact?: boolean
}

export function SessionStatusIndicator({ 
  className, 
  showDetails = false,
  compact = false 
}: SessionStatusIndicatorProps) {
  const {
    status,
    sessionStatus,
    refreshSession,
    isExpiring,
    minutesUntilExpiry,
    isRefreshing,
    lastRefresh,
  } = useSessionManager({
    refreshThreshold: 5,
    warningThreshold: 10,
    enableCrossTabSync: true,
  })

  if (status !== 'authenticated') {
    return null
  }

  const getStatusColor = () => {
    if (isRefreshing) return 'blue'
    if (isExpiring) return 'yellow'
    if (minutesUntilExpiry <= 5) return 'red'
    return 'green'
  }

  const getStatusIcon = () => {
    if (isRefreshing) return <RefreshCw className="h-3 w-3 animate-spin" />
    if (isExpiring) return <AlertTriangle className="h-3 w-3" />
    if (minutesUntilExpiry <= 5) return <AlertTriangle className="h-3 w-3" />
    return <CheckCircle className="h-3 w-3" />
  }

  const getStatusText = () => {
    if (isRefreshing) return '刷新中...'
    if (minutesUntilExpiry <= 0) return '会话已过期'
    if (minutesUntilExpiry <= 5) return `${minutesUntilExpiry}分钟后过期`
    if (minutesUntilExpiry <= 10) return `${minutesUntilExpiry}分钟后过期`
    if (minutesUntilExpiry < 60) return `${minutesUntilExpiry}分钟后过期`
    const hours = Math.floor(minutesUntilExpiry / 60)
    const minutes = minutesUntilExpiry % 60
    return `${hours}小时${minutes}分钟后过期`
  }

  const formatLastRefresh = () => {
    if (!lastRefresh) return '未刷新'
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)
    
    if (diff < 60) return `${diff}秒前刷新`
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前刷新`
    return `${Math.floor(diff / 3600)}小时前刷新`
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={getStatusColor() === 'green' ? 'default' : 'destructive'}
              className={cn('cursor-help', className)}
            >
              {getStatusIcon()}
              <span className="ml-1">{minutesUntilExpiry}分钟</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">会话状态</p>
              <p>{getStatusText()}</p>
              {lastRefresh && <p className="text-xs text-muted-foreground">{formatLastRefresh()}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={cn('flex items-center gap-2 p-2 rounded-lg border', className)}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <div className="flex flex-col">
          <span className="text-sm font-medium">会话状态</span>
          <span className="text-xs text-muted-foreground">{getStatusText()}</span>
        </div>
      </div>

      {showDetails && (
        <div className="flex flex-col text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatLastRefresh()}</span>
          </div>
        </div>
      )}

      {(isExpiring || minutesUntilExpiry <= 10) && !isRefreshing && (
        <Button
          size="sm"
          variant="outline"
          onClick={refreshSession}
          disabled={isRefreshing}
          className="ml-auto"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              刷新中
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              延长会话
            </>
          )}
        </Button>
      )}
    </div>
  )
}