'use client'

import React, { useState } from 'react'
import { DeviceManager } from '@/components/auth/DeviceManager'
import { DeviceSyncNotifications, DeviceSyncIndicator } from '@/components/auth/DeviceSyncNotifications'
import { useDeviceSync } from '@/hooks/useDeviceSync'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Monitor, 
  Shield, 
  Bell, 
  RefreshCw, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Smartphone
} from 'lucide-react'

export default function TestDeviceSyncPage() {
  const { user, isAuthenticated } = useAuth()
  const {
    devices,
    currentDevice,
    securityAlerts,
    pendingEvents,
    syncConfig,
    loading,
    error,
    refreshDevices,
    hasUnacknowledgedAlerts,
    activeSessions,
  } = useDeviceSync()

  const [testLoading, setTestLoading] = useState(false)

  // 模拟创建安全警报（用于测试）
  const simulateSecurityAlert = async () => {
    if (!user?.id) return

    setTestLoading(true)
    try {
      const response = await fetch('/api/device/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_sync_event',
          deviceId: currentDevice?.id,
          eventType: 'security_alert',
          eventData: {
            alert_type: 'new_device',
            severity: 'medium',
            device_name: 'Test Device',
            ip_address: '192.168.1.100',
            timestamp: new Date().toISOString(),
          }
        })
      })

      if (response.ok) {
        await refreshDevices()
      }
    } catch (error) {
      console.error('Failed to simulate security alert:', error)
    } finally {
      setTestLoading(false)
    }
  }

  // 模拟登录冲突
  const simulateLoginConflict = async () => {
    if (!user?.id || !currentDevice?.id) return

    setTestLoading(true)
    try {
      const response = await fetch('/api/device/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'detect_conflicts',
          targetDeviceId: currentDevice.id,
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Conflict detection result:', result.data)
        await refreshDevices()
      }
    } catch (error) {
      console.error('Failed to simulate login conflict:', error)
    } finally {
      setTestLoading(false)
    }
  }

  // 清理过期会话
  const cleanupExpiredSessions = async () => {
    setTestLoading(true)
    try {
      const response = await fetch('/api/device/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cleanup_sessions',
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Cleanup result:', result.data)
        await refreshDevices()
      }
    } catch (error) {
      console.error('Failed to cleanup sessions:', error)
    } finally {
      setTestLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">需要登录</h2>
            <p className="text-gray-600 mb-4">
              请先登录以查看设备同步功能
            </p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              前往登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">设备同步测试</h1>
          <p className="text-gray-600 mt-2">
            测试跨设备登录状态同步机制
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <DeviceSyncIndicator />
          <Button
            variant="outline"
            onClick={refreshDevices}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            刷新
          </Button>
        </div>
      </div>

      {/* 状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">待处理事件</p>
                <p className="text-2xl font-bold">{pendingEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 测试操作 */}
      <Card>
        <CardHeader>
          <CardTitle>测试操作</CardTitle>
          <CardDescription>
            用于测试设备同步功能的操作按钮
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={simulateSecurityAlert}
              disabled={testLoading}
            >
              {testLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              模拟安全警报
            </Button>

            <Button
              variant="outline"
              onClick={simulateLoginConflict}
              disabled={testLoading}
            >
              {testLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              检测登录冲突
            </Button>

            <Button
              variant="outline"
              onClick={cleanupExpiredSessions}
              disabled={testLoading}
            >
              {testLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              清理过期会话
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容 */}
      <Tabs defaultValue="devices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>设备管理</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>通知中心</span>
            {(securityAlerts.length > 0 || pendingEvents.length > 0) && (
              <Badge variant="destructive" className="ml-1">
                {securityAlerts.length + pendingEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>同步配置</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          <DeviceManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>通知中心</CardTitle>
              <CardDescription>
                查看设备同步相关的通知和警报
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceSyncNotifications showAll={true} />
              {securityAlerts.length === 0 && pendingEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无通知</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>同步配置</CardTitle>
              <CardDescription>
                查看和管理设备同步设置
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncConfig ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">最大并发会话数</label>
                      <p className="text-2xl font-bold text-blue-600">
                        {syncConfig.maxConcurrentSessions}
                      </p>
                      <p className="text-sm text-gray-600">
                        允许同时登录的设备数量
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">会话超时时间</label>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.floor(syncConfig.inactiveSessionTimeout / 86400)} 天
                      </p>
                      <p className="text-sm text-gray-600">
                        非活跃会话的超时时间
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">自动登出非活跃会话</p>
                        <p className="text-sm text-gray-600">
                          自动清理长时间未使用的会话
                        </p>
                      </div>
                      <Badge variant={syncConfig.autoLogoutInactiveSessions ? 'default' : 'secondary'}>
                        {syncConfig.autoLogoutInactiveSessions ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">安全警报</p>
                        <p className="text-sm text-gray-600">
                          检测到可疑活动时发送警报
                        </p>
                      </div>
                      <Badge variant={syncConfig.enableSecurityAlerts ? 'default' : 'secondary'}>
                        {syncConfig.enableSecurityAlerts ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">同步偏好设置</p>
                        <p className="text-sm text-gray-600">
                          在设备间同步用户偏好
                        </p>
                      </div>
                      <Badge variant={syncConfig.syncPreferences ? 'default' : 'secondary'}>
                        {syncConfig.syncPreferences ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">同步活动记录</p>
                        <p className="text-sm text-gray-600">
                          在设备间同步用户活动
                        </p>
                      </div>
                      <Badge variant={syncConfig.syncActivity ? 'default' : 'secondary'}>
                        {syncConfig.syncActivity ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>加载配置中...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 当前设备信息 */}
      {currentDevice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>当前设备</span>
            </CardTitle>
            <CardDescription>
              您正在使用的设备信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">设备名称</label>
                <p className="font-medium">{currentDevice.deviceName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">设备类型</label>
                <p className="font-medium">{currentDevice.deviceType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">浏览器</label>
                <p className="font-medium">
                  {currentDevice.browserName} {currentDevice.browserVersion}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">操作系统</label>
                <p className="font-medium">
                  {currentDevice.osName} {currentDevice.osVersion}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">IP地址</label>
                <p className="font-medium">{currentDevice.ipAddress || '未知'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">信任状态</label>
                <Badge variant={currentDevice.isTrusted ? 'default' : 'secondary'}>
                  {currentDevice.isTrusted ? '受信任' : '未信任'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误显示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}