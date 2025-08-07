'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { deviceSyncService, type UserDevice, type SecurityAlert, type SyncEvent, type SyncConfig } from '@/lib/device-sync'

export interface DeviceSyncState {
  devices: UserDevice[]
  currentDevice: UserDevice | null
  securityAlerts: SecurityAlert[]
  pendingEvents: SyncEvent[]
  syncConfig: SyncConfig | null
  loading: boolean
  error: string | null
}

export interface DeviceSyncActions {
  refreshDevices: () => Promise<void>
  logoutDevice: (deviceId: string) => Promise<void>
  logoutOtherDevices: () => Promise<number | undefined>
  acknowledgeAlert: (alertId: string) => Promise<void>
  resolveAlert: (alertId: string) => Promise<void>
  updateSyncConfig: (config: Partial<SyncConfig>) => Promise<void>
  processPendingEvents: () => Promise<void>
}

export interface UseDeviceSyncReturn extends DeviceSyncState, DeviceSyncActions {
  isCurrentDevice: (deviceId: string) => boolean
  getDeviceDisplayName: (device: UserDevice) => string
  getAlertMessage: (alert: SecurityAlert) => string
  hasUnacknowledgedAlerts: boolean
  activeSessions: number
}

export function useDeviceSync(): UseDeviceSyncReturn {
  const { user, isAuthenticated } = useAuth()
  const [state, setState] = useState<DeviceSyncState>({
    devices: [],
    currentDevice: null,
    securityAlerts: [],
    pendingEvents: [],
    syncConfig: null,
    loading: false,
    error: null,
  })

  const currentDeviceIdRef = useRef<string | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 初始化当前设备
  const initializeCurrentDevice = useCallback(async () => {
    if (!user?.id) return

    try {
      const deviceInfo = await deviceSyncService.getCurrentDeviceInfo()
      const deviceId = await deviceSyncService.registerDevice(user.id, deviceInfo)
      currentDeviceIdRef.current = deviceId

      // 检测登录冲突
      const conflicts = await deviceSyncService.detectLoginConflicts(user.id, deviceId)
      if (conflicts.hasConflicts) {
        await deviceSyncService.handleLoginConflicts(user.id, deviceId)
      }

      // 创建登录事件
      await deviceSyncService.createSyncEvent(user.id, deviceId, 'login', {
        device_info: deviceInfo,
        conflicts_detected: conflicts.hasConflicts,
        active_sessions: conflicts.activeSessions,
      })
    } catch (error) {
      console.error('Failed to initialize current device:', error)
      setState(prev => ({ ...prev, error: '设备初始化失败' }))
    }
  }, [user?.id])

  // 刷新设备列表
  const refreshDevices = useCallback(async () => {
    if (!user?.id) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const [devices, alerts, events, config] = await Promise.all([
        deviceSyncService.getUserDevices(user.id),
        deviceSyncService.getSecurityAlerts(user.id),
        deviceSyncService.getPendingSyncEvents(user.id),
        deviceSyncService.getSyncConfig(user.id),
      ])

      const currentDevice = currentDeviceIdRef.current 
        ? devices.find(d => d.id === currentDeviceIdRef.current) || null
        : null

      setState(prev => ({
        ...prev,
        devices,
        currentDevice,
        securityAlerts: alerts,
        pendingEvents: events,
        syncConfig: config,
        loading: false,
      }))
    } catch (error) {
      console.error('Failed to refresh devices:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: '刷新设备列表失败' 
      }))
    }
  }, [user?.id])

  // 登出设备
  const logoutDevice = useCallback(async (deviceId: string) => {
    if (!user?.id) return

    try {
      await deviceSyncService.logoutDevice(deviceId, 'user_initiated')
      
      // 创建登出事件
      await deviceSyncService.createSyncEvent(user.id, deviceId, 'logout', {
        reason: 'user_initiated',
        initiated_by: currentDeviceIdRef.current,
      })

      await refreshDevices()
    } catch (error) {
      console.error('Failed to logout device:', error)
      setState(prev => ({ ...prev, error: '设备登出失败' }))
    }
  }, [user?.id, refreshDevices])

  // 登出其他设备
  const logoutOtherDevices = useCallback(async () => {
    if (!user?.id || !currentDeviceIdRef.current) return

    try {
      const loggedOutCount = await deviceSyncService.logoutOtherDevices(
        user.id, 
        currentDeviceIdRef.current
      )

      if (loggedOutCount > 0) {
        await refreshDevices()
      }

      return loggedOutCount
    } catch (error) {
      console.error('Failed to logout other devices:', error)
      setState(prev => ({ ...prev, error: '登出其他设备失败' }))
      return 0
    }
  }, [user?.id, refreshDevices])

  // 确认安全警报
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await deviceSyncService.acknowledgeSecurityAlert(alertId)
      await refreshDevices()
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
      setState(prev => ({ ...prev, error: '确认警报失败' }))
    }
  }, [refreshDevices])

  // 解决安全警报
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await deviceSyncService.resolveSecurityAlert(alertId)
      await refreshDevices()
    } catch (error) {
      console.error('Failed to resolve alert:', error)
      setState(prev => ({ ...prev, error: '解决警报失败' }))
    }
  }, [refreshDevices])

  // 更新同步配置
  const updateSyncConfig = useCallback(async (config: Partial<SyncConfig>) => {
    if (!user?.id) return

    try {
      await deviceSyncService.updateSyncConfig(user.id, config)
      await refreshDevices()
    } catch (error) {
      console.error('Failed to update sync config:', error)
      setState(prev => ({ ...prev, error: '更新同步配置失败' }))
    }
  }, [user?.id, refreshDevices])

  // 处理待处理事件
  const processPendingEvents = useCallback(async () => {
    if (!user?.id || state.pendingEvents.length === 0) return

    try {
      for (const event of state.pendingEvents) {
        // 根据事件类型处理
        switch (event.eventType) {
          case 'login':
            // 处理新设备登录通知
            console.log('New device login detected:', event.eventData)
            break
          case 'logout':
            // 处理设备登出通知
            console.log('Device logout detected:', event.eventData)
            break
          case 'conflict':
            // 处理登录冲突
            console.log('Login conflict detected:', event.eventData)
            break
          case 'security_alert':
            // 处理安全警报
            console.log('Security alert:', event.eventData)
            break
          case 'sync':
            // 处理同步事件
            console.log('Sync event:', event.eventData)
            break
        }

        // 标记事件为已处理
        await deviceSyncService.markSyncEventProcessed(event.id)
      }

      // 刷新事件列表
      await refreshDevices()
    } catch (error) {
      console.error('Failed to process pending events:', error)
    }
  }, [user?.id, state.pendingEvents, refreshDevices])

  // 辅助方法
  const isCurrentDevice = useCallback((deviceId: string) => {
    return deviceId === currentDeviceIdRef.current
  }, [])

  const getDeviceDisplayName = useCallback((device: UserDevice) => {
    if (isCurrentDevice(device.id)) {
      return `${device.deviceName} (当前设备)`
    }
    return device.deviceName
  }, [isCurrentDevice])

  const getAlertMessage = useCallback((alert: SecurityAlert) => {
    switch (alert.alertType) {
      case 'new_device':
        return `检测到新设备登录: ${alert.alertData.device_name}`
      case 'suspicious_login':
        return '检测到可疑登录活动'
      case 'concurrent_sessions':
        return '检测到多个并发会话'
      case 'location_change':
        return '检测到登录位置变化'
      default:
        return '安全警报'
    }
  }, [])

  // 计算派生状态
  const hasUnacknowledgedAlerts = state.securityAlerts.some(alert => !alert.isAcknowledged)
  const activeSessions = state.devices.filter(device => device.isActive).length

  // 设置定期同步
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // 清理定时器
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
      return
    }

    // 初始化
    initializeCurrentDevice().then(() => {
      refreshDevices()
    })

    // 设置定期同步（每30秒）
    syncIntervalRef.current = setInterval(() => {
      refreshDevices()
      processPendingEvents()
    }, 30000)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
    }
  }, [isAuthenticated, user?.id, initializeCurrentDevice, refreshDevices, processPendingEvents])

  // 页面可见性变化时同步
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user?.id) {
        refreshDevices()
        processPendingEvents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, user?.id, refreshDevices, processPendingEvents])

  // 窗口焦点变化时同步
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user?.id) {
        refreshDevices()
        processPendingEvents()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [isAuthenticated, user?.id, refreshDevices, processPendingEvents])

  return {
    ...state,
    refreshDevices,
    logoutDevice,
    logoutOtherDevices,
    acknowledgeAlert,
    resolveAlert,
    updateSyncConfig,
    processPendingEvents,
    isCurrentDevice,
    getDeviceDisplayName,
    getAlertMessage,
    hasUnacknowledgedAlerts,
    activeSessions,
  }
}