'use client'

import React, { useEffect, useState } from 'react'
import { useDeviceSync } from '@/hooks/useDeviceSync'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Monitor, 
  Smartphone, 
  Shield,
  Bell,
  X,
  CheckCircle,
  Clock,
  MapPin,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface DeviceSyncNotificationsProps {
  className?: string
  showAll?: boolean
  maxItems?: number
}

export function DeviceSyncNotifications({ 
  className, 
  showAll = false, 
  maxItems = 5 
}: DeviceSyncNotificationsProps) {
  const {
    securityAlerts,
    pendingEvents,
    acknowledgeAlert,
    resolveAlert,
    processPendingEvents,
    getAlertMessage,
    hasUnacknowledgedAlerts,
  } = useDeviceSync()

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // 自动处理待处理事件
  useEffect(() => {
    if (pendingEvents.length > 0) {
      processPendingEvents()
    }
  }, [pendingEvents, processPendingEvents])

  // 获取需要显示的通知
  const getNotifications = () => {
    const notifications: Array<{
      id: string
      type: 'alert' | 'event'
      title: string
      message: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      timestamp: string
      data: any
    }> = []

    // 添加安全警报
    securityAlerts
      .filter(alert => !dismissed.has(alert.id))
      .forEach(alert => {
        notifications.push({
          id: alert.id,
          type: 'alert',
          title: getAlertTypeTitle(alert.alertType),
          message: getAlertMessage(alert),
          severity: alert.severity,
          timestamp: alert.createdAt,
          data: alert
        })
      })

    // 添加同步事件
    pendingEvents
      .filter(event => !dismissed.has(event.id))
      .forEach(event => {
        notifications.push({
          id: event.id,
          type: 'event',
          title: getEventTypeTitle(event.eventType),
          message: getEventMessage(event),
          severity: getEventSeverity(event.eventType),
          timestamp: event.createdAt,
          data: event
        })
      })

    // 按时间排序
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // 限制数量
    if (!showAll && maxItems > 0) {
      return notifications.slice(0, maxItems)
    }

    return notifications
  }

  const getAlertTypeTitle = (alertType: string) => {
    switch (alertType) {
      case 'new_device':
        return '新设备登录'
      case 'suspicious_login':
        return '可疑登录'
      case 'concurrent_sessions':
        return '并发会话'
      case 'location_change':
        return '位置变化'
      default:
        return '安全警报'
    }
  }

  const getEventTypeTitle = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return '设备登录'
      case 'logout':
        return '设备登出'
      case 'conflict':
        return '登录冲突'
      case 'sync':
        return '数据同步'
      default:
        return '同步事件'
    }
  }

  const getEventMessage = (event: any) => {
    switch (event.eventType) {
      case 'login':
        return `设备 ${event.eventData.device_info?.device_name || '未知设备'} 已登录`
      case 'logout':
        return `设备已登出 (${event.eventData.reason || '未知原因'})`
      case 'conflict':
        return `检测到登录冲突，已处理 ${event.eventData.terminated_sessions || 0} 个会话`
      case 'sync':
        return `数据同步: ${event.eventData.action || '未知操作'}`
      default:
        return '同步事件'
    }
  }

  const getEventSeverity = (eventType: string): 'low' | 'medium' | 'high' | 'critical' => {
    switch (eventType) {
      case 'conflict':
        return 'high'
      case 'login':
        return 'medium'
      case 'logout':
        return 'low'
      case 'sync':
        return 'low'
      default:
        return 'medium'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <Shield className="h-4 w-4" />
      case 'low':
        return <Bell className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    setActionLoading(`ack-${alertId}`)
    try {
      await acknowledgeAlert(alertId)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    setActionLoading(`resolve-${alertId}`)
    try {
      await resolveAlert(alertId)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDismiss = (notificationId: string) => {
    setDismissed(prev => new Set([...prev, notificationId]))
  }

  const notifications = getNotifications()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {notifications.map((notification) => (
        <Card 
          key={notification.id}
          className={`${getSeverityColor(notification.severity)} border`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {getSeverityIcon(notification.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm">
                      {notification.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {notification.severity}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center space-x-4 text-xs opacity-75">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                          locale: zhCN
                        })}
                      </span>
                    </span>
                    {notification.data.alertData?.ip_address && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{notification.data.alertData.ip_address}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {notification.type === 'alert' && !notification.data.isAcknowledged && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAcknowledgeAlert(notification.id)}
                    disabled={actionLoading === `ack-${notification.id}`}
                    title="确认警报"
                  >
                    {actionLoading === `ack-${notification.id}` ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                  </Button>
                )}
                {notification.type === 'alert' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleResolveAlert(notification.id)}
                    disabled={actionLoading === `resolve-${notification.id}`}
                    title="解决警报"
                  >
                    {actionLoading === `resolve-${notification.id}` ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDismiss(notification.id)}
                  title="忽略通知"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// 简化的通知指示器组件
export function DeviceSyncIndicator({ className }: { className?: string }) {
  const { hasUnacknowledgedAlerts, securityAlerts, pendingEvents } = useDeviceSync()
  
  const totalNotifications = securityAlerts.length + pendingEvents.length

  if (totalNotifications === 0) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <Bell className={`h-5 w-5 ${hasUnacknowledgedAlerts ? 'text-red-500' : 'text-gray-500'}`} />
      {totalNotifications > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {totalNotifications > 9 ? '9+' : totalNotifications}
        </span>
      )}
    </div>
  )
}