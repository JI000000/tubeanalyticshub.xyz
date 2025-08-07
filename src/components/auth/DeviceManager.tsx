'use client'

import React, { useState } from 'react'
import { useDeviceSync } from '@/hooks/useDeviceSync'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Chrome,
  Globe,
  Shield,
  ShieldCheck,
  LogOut,
  Settings,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface DeviceManagerProps {
  className?: string
}

export function DeviceManager({ className }: DeviceManagerProps) {
  const {
    devices,
    currentDevice,
    securityAlerts,
    syncConfig,
    loading,
    error,
    refreshDevices,
    logoutDevice,
    logoutOtherDevices,
    acknowledgeAlert,
    resolveAlert,
    isCurrentDevice,
    getDeviceDisplayName,
    getAlertMessage,
    hasUnacknowledgedAlerts,
    activeSessions,
  } = useDeviceSync()

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // 获取设备图标
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  // 获取浏览器图标
  const getBrowserIcon = (browserName: string) => {
    switch (browserName.toLowerCase()) {
      case 'chrome':
        return <Chrome className="h-4 w-4" />
      case 'firefox':
        return <Globe className="h-4 w-4" />
      case 'safari':
        return <Globe className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  // 获取警报严重程度颜色
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  // 处理设备登出
  const handleLogoutDevice = async (deviceId: string) => {
    if (isCurrentDevice(deviceId)) {
      if (!confirm('确定要登出当前设备吗？这将结束您的会话。')) {
        return
      }
    }

    setActionLoading(`logout-${deviceId}`)
    try {
      await logoutDevice(deviceId)
    } finally {
      setActionLoading(null)
    }
  }

  // 处理登出其他设备
  const handleLogoutOtherDevices = async () => {
    if (!confirm('确定要登出所有其他设备吗？这将结束其他设备上的所有会话。')) {
      return
    }

    setActionLoading('logout-others')
    try {
      await logoutOtherDevices()
    } finally {
      setActionLoading(null)
    }
  }

  // 处理确认警报
  const handleAcknowledgeAlert = async (alertId: string) => {
    setActionLoading(`ack-${alertId}`)
    try {
      await acknowledgeAlert(alertId)
    } finally {
      setActionLoading(null)
    }
  }

  // 处理解决警报
  const handleResolveAlert = async (alertId: string) => {
    setActionLoading(`resolve-${alertId}`)
    try {
      await resolveAlert(alertId)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && devices.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">活跃设备</p>
                <p className="text-2xl font-bold">{activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">受信任设备</p>
                <p className="text-2xl font-bold">
                  {devices.filter(d => d.isTrusted).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`h-5 w-5 ${hasUnacknowledgedAlerts ? 'text-red-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium">安全警报</p>
                <p className="text-2xl font-bold">{securityAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 安全警报 */}
      {securityAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>安全警报</span>
            </CardTitle>
            <CardDescription>
              需要您注意的安全相关事件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {securityAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant={getAlertSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm font-medium">
                      {getAlertMessage(alert)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(alert.createdAt), {
                      addSuffix: true,
                      locale: zhCN
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!alert.isAcknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      disabled={actionLoading === `ack-${alert.id}`}
                    >
                      {actionLoading === `ack-${alert.id}` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={actionLoading === `resolve-${alert.id}`}
                  >
                    {actionLoading === `resolve-${alert.id}` ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 设备列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>登录设备</CardTitle>
              <CardDescription>
                管理您的登录设备和会话
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshDevices}
                disabled={loading}
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : (
                  '刷新'
                )}
              </Button>
              {devices.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutOtherDevices}
                  disabled={actionLoading === 'logout-others'}
                >
                  {actionLoading === 'logout-others' ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  ) : (
                    '登出其他设备'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无登录设备</p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className={`p-4 border rounded-lg ${
                  isCurrentDevice(device.id) ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center space-x-1">
                      {getDeviceIcon(device.deviceType)}
                      {getBrowserIcon(device.browserName)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">
                          {getDeviceDisplayName(device)}
                        </h4>
                        {isCurrentDevice(device.id) && (
                          <Badge variant="default">当前设备</Badge>
                        )}
                        {device.isTrusted && (
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                        )}
                        {!device.isActive && (
                          <Badge variant="secondary">已离线</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{device.browserName} {device.browserVersion}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Monitor className="h-3 w-3" />
                            <span>{device.osName} {device.osVersion}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              最后活动: {formatDistanceToNow(new Date(device.lastSeenAt), {
                                addSuffix: true,
                                locale: zhCN
                              })}
                            </span>
                          </span>
                          {device.ipAddress && (
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{device.ipAddress}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {device.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLogoutDevice(device.id)}
                        disabled={actionLoading === `logout-${device.id}`}
                      >
                        {actionLoading === `logout-${device.id}` ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 mr-1" />
                            登出
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 同步配置 */}
      {syncConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>同步设置</span>
            </CardTitle>
            <CardDescription>
              配置设备同步和安全选项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">最大并发会话数</label>
                <p className="text-sm text-gray-600">
                  {syncConfig.maxConcurrentSessions} 个设备
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">会话超时时间</label>
                <p className="text-sm text-gray-600">
                  {Math.floor(syncConfig.inactiveSessionTimeout / 86400)} 天
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">自动登出非活跃会话</label>
                <p className="text-sm text-gray-600">
                  {syncConfig.autoLogoutInactiveSessions ? '已启用' : '已禁用'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">安全警报</label>
                <p className="text-sm text-gray-600">
                  {syncConfig.enableSecurityAlerts ? '已启用' : '已禁用'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}