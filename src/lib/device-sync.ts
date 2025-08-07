import { createSupabaseServiceClient } from '@/lib/supabase'
import { getFingerprint } from '@/lib/fingerprint'

export interface DeviceInfo {
  fingerprint: string
  name?: string
  type: 'desktop' | 'mobile' | 'tablet'
  browserName: string
  browserVersion: string
  osName: string
  osVersion: string
  ipAddress?: string
  userAgent: string
  location?: string
}

export interface UserDevice {
  id: string
  userId: string
  deviceFingerprint: string
  deviceName: string
  deviceType: string
  browserName: string
  browserVersion: string
  osName: string
  osVersion: string
  ipAddress?: string
  userAgent: string
  isTrusted: boolean
  isActive: boolean
  lastSeenAt: string
  firstSeenAt: string
  createdAt: string
}

export interface DeviceSession {
  id: string
  deviceId: string
  sessionToken: string
  nextauthSessionId?: string
  isActive: boolean
  loginMethod: string
  loginAt: string
  lastActivityAt: string
  expiresAt: string
  logoutAt?: string
  logoutReason?: string
}

export interface SyncEvent {
  id: string
  userId: string
  deviceId?: string
  eventType: 'login' | 'logout' | 'conflict' | 'security_alert' | 'sync'
  eventData: any
  sourceDeviceId?: string
  targetDeviceId?: string
  isProcessed: boolean
  processedAt?: string
  createdAt: string
}

export interface SecurityAlert {
  id: string
  userId: string
  deviceId?: string
  alertType: 'new_device' | 'suspicious_login' | 'concurrent_sessions' | 'location_change'
  severity: 'low' | 'medium' | 'high' | 'critical'
  alertData: any
  isAcknowledged: boolean
  acknowledgedAt?: string
  isResolved: boolean
  resolvedAt?: string
  createdAt: string
}

export interface SyncConfig {
  userId: string
  maxConcurrentSessions: number
  autoLogoutInactiveSessions: boolean
  inactiveSessionTimeout: number
  requireDeviceApproval: boolean
  enableSecurityAlerts: boolean
  syncPreferences: boolean
  syncActivity: boolean
}

export class DeviceSyncService {
  private supabase = createSupabaseServiceClient()

  /**
   * 获取当前设备信息
   */
  async getCurrentDeviceInfo(): Promise<DeviceInfo> {
    const fingerprintData = await getFingerprint()
    
    // 获取设备信息
    const deviceInfo: DeviceInfo = {
      fingerprint: fingerprintData.visitorId,
      type: this.detectDeviceType(),
      browserName: this.getBrowserName(),
      browserVersion: this.getBrowserVersion(),
      osName: this.getOSName(),
      osVersion: this.getOSVersion(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    }

    // 尝试获取IP地址（如果可用）
    try {
      const response = await fetch('/api/device/info')
      if (response.ok) {
        const serverInfo = await response.json()
        deviceInfo.ipAddress = serverInfo.ipAddress
        deviceInfo.location = serverInfo.location
      }
    } catch (error) {
      console.warn('Failed to get server device info:', error)
    }

    return deviceInfo
  }

  /**
   * 注册用户设备
   */
  async registerDevice(userId: string, deviceInfo?: DeviceInfo): Promise<string> {
    if (!deviceInfo) {
      deviceInfo = await this.getCurrentDeviceInfo()
    }

    const { data, error } = await this.supabase.rpc('register_user_device', {
      p_user_id: userId,
      p_device_fingerprint: deviceInfo.fingerprint,
      p_device_info: {
        device_name: deviceInfo.name,
        device_type: deviceInfo.type,
        browser_name: deviceInfo.browserName,
        browser_version: deviceInfo.browserVersion,
        os_name: deviceInfo.osName,
        os_version: deviceInfo.osVersion,
        ip_address: deviceInfo.ipAddress,
        user_agent: deviceInfo.userAgent,
        location: deviceInfo.location,
      }
    })

    if (error) {
      console.error('Failed to register device:', error)
      throw new Error('设备注册失败')
    }

    return data
  }

  /**
   * 创建设备会话
   */
  async createDeviceSession(
    deviceId: string,
    sessionToken: string,
    loginMethod: string,
    expiresAt: Date,
    nextauthSessionId?: string
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('yt_device_sessions')
      .insert({
        device_id: deviceId,
        session_token: sessionToken,
        nextauth_session_id: nextauthSessionId,
        login_method: loginMethod,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create device session:', error)
      throw new Error('会话创建失败')
    }

    return data.id
  }

  /**
   * 检测登录冲突
   */
  async detectLoginConflicts(userId: string, deviceId: string): Promise<{
    hasConflicts: boolean
    activeSessions: number
    maxSessions: number
    sessionsToTerminate: number
  }> {
    const { data, error } = await this.supabase.rpc('detect_login_conflicts', {
      p_user_id: userId,
      p_device_id: deviceId,
    })

    if (error) {
      console.error('Failed to detect login conflicts:', error)
      return {
        hasConflicts: false,
        activeSessions: 0,
        maxSessions: 5,
        sessionsToTerminate: 0,
      }
    }

    return {
      hasConflicts: data.has_conflicts,
      activeSessions: data.active_sessions,
      maxSessions: data.max_sessions,
      sessionsToTerminate: data.sessions_to_terminate,
    }
  }

  /**
   * 处理登录冲突
   */
  async handleLoginConflicts(userId: string, deviceId: string): Promise<void> {
    const conflicts = await this.detectLoginConflicts(userId, deviceId)
    
    if (!conflicts.hasConflicts) {
      return
    }

    // 获取最旧的活跃会话
    const { data: oldestSessions, error } = await this.supabase
      .from('yt_device_sessions')
      .select(`
        id,
        device_id,
        login_at,
        yt_user_devices!inner(user_id)
      `)
      .eq('yt_user_devices.user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('login_at', { ascending: true })
      .limit(conflicts.sessionsToTerminate)

    if (error) {
      console.error('Failed to get oldest sessions:', error)
      return
    }

    // 终止最旧的会话
    if (oldestSessions && oldestSessions.length > 0) {
      const sessionIds = oldestSessions.map(s => s.id)
      
      await this.supabase
        .from('yt_device_sessions')
        .update({
          is_active: false,
          logout_at: new Date().toISOString(),
          logout_reason: 'conflict',
        })
        .in('id', sessionIds)

      // 记录冲突处理事件
      await this.createSyncEvent(userId, deviceId, 'conflict', {
        action: 'terminate_sessions',
        terminated_sessions: sessionIds.length,
        reason: 'max_concurrent_sessions_exceeded',
      })
    }
  }

  /**
   * 获取用户设备列表
   */
  async getUserDevices(userId: string): Promise<UserDevice[]> {
    const { data, error } = await this.supabase
      .from('yt_user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false })

    if (error) {
      console.error('Failed to get user devices:', error)
      return []
    }

    return data.map(device => ({
      id: device.id,
      userId: device.user_id,
      deviceFingerprint: device.device_fingerprint,
      deviceName: device.device_name,
      deviceType: device.device_type,
      browserName: device.browser_name,
      browserVersion: device.browser_version,
      osName: device.os_name,
      osVersion: device.os_version,
      ipAddress: device.ip_address,
      userAgent: device.user_agent,
      isTrusted: device.is_trusted,
      isActive: device.is_active,
      lastSeenAt: device.last_seen_at,
      firstSeenAt: device.first_seen_at,
      createdAt: device.created_at,
    }))
  }

  /**
   * 获取设备的活跃会话
   */
  async getDeviceSessions(deviceId: string): Promise<DeviceSession[]> {
    const { data, error } = await this.supabase
      .from('yt_device_sessions')
      .select('*')
      .eq('device_id', deviceId)
      .order('login_at', { ascending: false })

    if (error) {
      console.error('Failed to get device sessions:', error)
      return []
    }

    return data.map(session => ({
      id: session.id,
      deviceId: session.device_id,
      sessionToken: session.session_token,
      nextauthSessionId: session.nextauth_session_id,
      isActive: session.is_active,
      loginMethod: session.login_method,
      loginAt: session.login_at,
      lastActivityAt: session.last_activity_at,
      expiresAt: session.expires_at,
      logoutAt: session.logout_at,
      logoutReason: session.logout_reason,
    }))
  }

  /**
   * 登出设备
   */
  async logoutDevice(deviceId: string, reason: string = 'user_initiated'): Promise<void> {
    // 终止设备的所有活跃会话
    const { error } = await this.supabase
      .from('yt_device_sessions')
      .update({
        is_active: false,
        logout_at: new Date().toISOString(),
        logout_reason: reason,
      })
      .eq('device_id', deviceId)
      .eq('is_active', true)

    if (error) {
      console.error('Failed to logout device:', error)
      throw new Error('设备登出失败')
    }

    // 更新设备状态
    await this.supabase
      .from('yt_user_devices')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId)
  }

  /**
   * 登出其他设备
   */
  async logoutOtherDevices(userId: string, currentDeviceId: string): Promise<number> {
    // 获取其他设备
    const { data: otherDevices, error: devicesError } = await this.supabase
      .from('yt_user_devices')
      .select('id')
      .eq('user_id', userId)
      .neq('id', currentDeviceId)
      .eq('is_active', true)

    if (devicesError) {
      console.error('Failed to get other devices:', devicesError)
      return 0
    }

    if (!otherDevices || otherDevices.length === 0) {
      return 0
    }

    const deviceIds = otherDevices.map(d => d.id)

    // 终止其他设备的会话
    const { error: sessionsError } = await this.supabase
      .from('yt_device_sessions')
      .update({
        is_active: false,
        logout_at: new Date().toISOString(),
        logout_reason: 'logout_other_devices',
      })
      .in('device_id', deviceIds)
      .eq('is_active', true)

    if (sessionsError) {
      console.error('Failed to logout other device sessions:', sessionsError)
    }

    // 更新其他设备状态
    const { error: updateError } = await this.supabase
      .from('yt_user_devices')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', deviceIds)

    if (updateError) {
      console.error('Failed to update other devices:', updateError)
    }

    // 记录事件
    await this.createSyncEvent(userId, currentDeviceId, 'logout', {
      action: 'logout_other_devices',
      affected_devices: deviceIds.length,
    })

    return deviceIds.length
  }

  /**
   * 创建同步事件
   */
  async createSyncEvent(
    userId: string,
    deviceId: string,
    eventType: SyncEvent['eventType'],
    eventData: any,
    sourceDeviceId?: string,
    targetDeviceId?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('yt_device_sync_events')
      .insert({
        user_id: userId,
        device_id: deviceId,
        event_type: eventType,
        event_data: eventData,
        source_device_id: sourceDeviceId,
        target_device_id: targetDeviceId,
      })

    if (error) {
      console.error('Failed to create sync event:', error)
    }
  }

  /**
   * 获取未处理的同步事件
   */
  async getPendingSyncEvents(userId: string): Promise<SyncEvent[]> {
    const { data, error } = await this.supabase
      .from('yt_device_sync_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_processed', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to get pending sync events:', error)
      return []
    }

    return data.map(event => ({
      id: event.id,
      userId: event.user_id,
      deviceId: event.device_id,
      eventType: event.event_type,
      eventData: event.event_data,
      sourceDeviceId: event.source_device_id,
      targetDeviceId: event.target_device_id,
      isProcessed: event.is_processed,
      processedAt: event.processed_at,
      createdAt: event.created_at,
    }))
  }

  /**
   * 标记同步事件为已处理
   */
  async markSyncEventProcessed(eventId: string): Promise<void> {
    const { error } = await this.supabase
      .from('yt_device_sync_events')
      .update({
        is_processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventId)

    if (error) {
      console.error('Failed to mark sync event as processed:', error)
    }
  }

  /**
   * 获取安全警报
   */
  async getSecurityAlerts(userId: string): Promise<SecurityAlert[]> {
    const { data, error } = await this.supabase
      .from('yt_device_security_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to get security alerts:', error)
      return []
    }

    return data.map(alert => ({
      id: alert.id,
      userId: alert.user_id,
      deviceId: alert.device_id,
      alertType: alert.alert_type,
      severity: alert.severity,
      alertData: alert.alert_data,
      isAcknowledged: alert.is_acknowledged,
      acknowledgedAt: alert.acknowledged_at,
      isResolved: alert.is_resolved,
      resolvedAt: alert.resolved_at,
      createdAt: alert.created_at,
    }))
  }

  /**
   * 确认安全警报
   */
  async acknowledgeSecurityAlert(alertId: string): Promise<void> {
    const { error } = await this.supabase
      .from('yt_device_security_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (error) {
      console.error('Failed to acknowledge security alert:', error)
      throw new Error('确认安全警报失败')
    }
  }

  /**
   * 解决安全警报
   */
  async resolveSecurityAlert(alertId: string): Promise<void> {
    const { error } = await this.supabase
      .from('yt_device_security_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (error) {
      console.error('Failed to resolve security alert:', error)
      throw new Error('解决安全警报失败')
    }
  }

  /**
   * 获取用户同步配置
   */
  async getSyncConfig(userId: string): Promise<SyncConfig> {
    const { data, error } = await this.supabase
      .from('yt_device_sync_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Failed to get sync config:', error)
    }

    // 返回默认配置或用户配置
    return {
      userId,
      maxConcurrentSessions: data?.max_concurrent_sessions || 5,
      autoLogoutInactiveSessions: data?.auto_logout_inactive_sessions ?? true,
      inactiveSessionTimeout: data?.inactive_session_timeout || 2592000, // 30 days
      requireDeviceApproval: data?.require_device_approval ?? false,
      enableSecurityAlerts: data?.enable_security_alerts ?? true,
      syncPreferences: data?.sync_preferences ?? true,
      syncActivity: data?.sync_activity ?? false,
    }
  }

  /**
   * 更新用户同步配置
   */
  async updateSyncConfig(userId: string, config: Partial<SyncConfig>): Promise<void> {
    const { error } = await this.supabase
      .from('yt_device_sync_config')
      .upsert({
        user_id: userId,
        max_concurrent_sessions: config.maxConcurrentSessions,
        auto_logout_inactive_sessions: config.autoLogoutInactiveSessions,
        inactive_session_timeout: config.inactiveSessionTimeout,
        require_device_approval: config.requireDeviceApproval,
        enable_security_alerts: config.enableSecurityAlerts,
        sync_preferences: config.syncPreferences,
        sync_activity: config.syncActivity,
      })

    if (error) {
      console.error('Failed to update sync config:', error)
      throw new Error('更新同步配置失败')
    }
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    const { data, error } = await this.supabase.rpc('cleanup_expired_device_sessions')

    if (error) {
      console.error('Failed to cleanup expired sessions:', error)
      return 0
    }

    return data || 0
  }

  // 私有辅助方法
  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop'
    
    const userAgent = window.navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet'
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile'
    }
    return 'desktop'
  }

  private getBrowserName(): string {
    if (typeof window === 'undefined') return 'Unknown'
    
    const userAgent = window.navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'
    return 'Unknown'
  }

  private getBrowserVersion(): string {
    if (typeof window === 'undefined') return 'Unknown'
    
    const userAgent = window.navigator.userAgent
    const match = userAgent.match(/(chrome|firefox|safari|edge|opera)\/(\d+)/i)
    return match ? match[2] : 'Unknown'
  }

  private getOSName(): string {
    if (typeof window === 'undefined') return 'Unknown'
    
    const userAgent = window.navigator.userAgent
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private getOSVersion(): string {
    if (typeof window === 'undefined') return 'Unknown'
    
    const userAgent = window.navigator.userAgent
    const match = userAgent.match(/(windows nt|mac os x|android|ios) ([\d._]+)/i)
    return match ? match[2] : 'Unknown'
  }
}

// 导出单例实例
export const deviceSyncService = new DeviceSyncService()