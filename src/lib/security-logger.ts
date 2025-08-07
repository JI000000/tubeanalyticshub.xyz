/**
 * 登录安全日志记录服务
 * 负责记录登录IP地址、设备信息和异常行为检测
 */

import { createSupabaseServiceClient } from '@/lib/supabase'
import type { Session } from 'next-auth'

export interface SecurityLogEvent {
  userId?: string
  nextauthUserId?: string
  eventType: 'login_success' | 'login_failed' | 'logout' | 'session_refresh' | 'password_change'
  loginMethod?: 'github' | 'google' | 'email' | 'oauth'
  ipAddress: string
  userAgent?: string
  deviceFingerprint?: string
  additionalData?: Record<string, any>
}

export interface LoginAnomalyData {
  userId: string
  anomalyType: 'unusual_location' | 'unusual_time' | 'unusual_device' | 'brute_force' | 'concurrent_sessions'
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectionData: Record<string, any>
  currentLoginId?: string
}

export interface SecurityAnalytics {
  totalLogins: number
  failedLogins: number
  suspiciousLogins: number
  uniqueIPs: number
  uniqueDevices: number
  anomaliesDetected: number
  riskScore: number
}

class SecurityLogger {
  private supabase = createSupabaseServiceClient()

  /**
   * 记录安全事件
   */
  async logSecurityEvent(event: SecurityLogEvent): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('log_security_event', {
        p_user_id: event.userId || null,
        p_nextauth_user_id: event.nextauthUserId || null,
        p_event_type: event.eventType,
        p_login_method: event.loginMethod || null,
        p_ip_address: event.ipAddress,
        p_user_agent: event.userAgent || null,
        p_device_fingerprint: event.deviceFingerprint || null,
        p_additional_data: event.additionalData || {}
      })

      if (error) {
        console.error('Failed to log security event:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error logging security event:', error)
      return null
    }
  }

  /**
   * 记录成功登录
   */
  async logSuccessfulLogin(
    session: Session,
    ipAddress: string,
    userAgent?: string,
    deviceFingerprint?: string,
    loginMethod?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      userId: await this.getYtUserId(session.user.id),
      nextauthUserId: session.user.id,
      eventType: 'login_success',
      loginMethod: (loginMethod as any) || session.user.provider,
      ipAddress,
      userAgent,
      deviceFingerprint,
      additionalData: {
        sessionId: session.expires,
        userEmail: session.user.email,
        userName: session.user.name
      }
    })
  }

  /**
   * 记录登录失败
   */
  async logFailedLogin(
    identifier: string,
    ipAddress: string,
    userAgent?: string,
    deviceFingerprint?: string,
    reason?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'login_failed',
      ipAddress,
      userAgent,
      deviceFingerprint,
      additionalData: {
        identifier,
        failureReason: reason,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * 记录登出事件
   */
  async logLogout(
    session: Session,
    ipAddress: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      userId: await this.getYtUserId(session.user.id),
      nextauthUserId: session.user.id,
      eventType: 'logout',
      ipAddress,
      userAgent,
      additionalData: {
        logoutReason: reason,
        sessionDuration: this.calculateSessionDuration(session)
      }
    })
  }

  /**
   * 检查IP是否在黑名单中
   */
  async isIpBlacklisted(ipAddress: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('yt_ip_blacklist')
        .select('id')
        .or(`ip_address.eq.${ipAddress},ip_range.cs.${ipAddress}`)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .limit(1)

      if (error) {
        console.error('Error checking IP blacklist:', error)
        return false
      }

      return data.length > 0
    } catch (error) {
      console.error('Error checking IP blacklist:', error)
      return false
    }
  }

  /**
   * 获取用户的安全分析数据
   */
  async getUserSecurityAnalytics(userId: string, days: number = 30): Promise<SecurityAnalytics> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: logs, error } = await this.supabase
        .from('yt_login_security_logs')
        .select('*')
        .eq('nextauth_user_id', userId)
        .gte('created_at', startDate.toISOString())

      if (error) {
        console.error('Error fetching security analytics:', error)
        return this.getDefaultAnalytics()
      }

      const totalLogins = logs.filter(log => log.event_type === 'login_success').length
      const failedLogins = logs.filter(log => log.event_type === 'login_failed').length
      const suspiciousLogins = logs.filter(log => log.is_suspicious).length
      const uniqueIPs = new Set(logs.map(log => log.ip_address)).size
      const uniqueDevices = new Set(logs.map(log => log.device_fingerprint).filter(Boolean)).size

      // 获取异常检测数据
      const { data: anomalies } = await this.supabase
        .from('yt_login_anomaly_detection')
        .select('id')
        .eq('user_id', await this.getYtUserId(userId))
        .gte('created_at', startDate.toISOString())

      const anomaliesDetected = anomalies?.length || 0

      // 计算风险评分
      const riskScore = this.calculateRiskScore({
        totalLogins,
        failedLogins,
        suspiciousLogins,
        anomaliesDetected
      })

      return {
        totalLogins,
        failedLogins,
        suspiciousLogins,
        uniqueIPs,
        uniqueDevices,
        anomaliesDetected,
        riskScore
      }
    } catch (error) {
      console.error('Error calculating security analytics:', error)
      return this.getDefaultAnalytics()
    }
  }

  /**
   * 获取用户的登录异常记录
   */
  async getUserAnomalies(userId: string, limit: number = 10) {
    try {
      const ytUserId = await this.getYtUserId(userId)
      if (!ytUserId) return []

      const { data, error } = await this.supabase
        .from('yt_login_anomaly_detection')
        .select(`
          *,
          yt_login_security_logs!current_login_id (
            ip_address,
            user_agent,
            created_at
          )
        `)
        .eq('user_id', ytUserId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user anomalies:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Error fetching user anomalies:', error)
      return []
    }
  }

  /**
   * 标记异常为已确认威胁或误报
   */
  async updateAnomalyStatus(
    anomalyId: string,
    userId: string,
    response: 'approved' | 'blocked' | 'false_positive'
  ): Promise<boolean> {
    try {
      const ytUserId = await this.getYtUserId(userId)
      if (!ytUserId) return false

      const updateData: any = {
        user_response: response,
        resolved_at: new Date().toISOString()
      }

      if (response === 'false_positive') {
        updateData.is_false_positive = true
      } else if (response === 'blocked') {
        updateData.is_confirmed_threat = true
      }

      const { error } = await this.supabase
        .from('yt_login_anomaly_detection')
        .update(updateData)
        .eq('id', anomalyId)
        .eq('user_id', ytUserId)

      if (error) {
        console.error('Error updating anomaly status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating anomaly status:', error)
      return false
    }
  }

  /**
   * 添加IP到黑名单
   */
  async addIpToBlacklist(
    ipAddress: string,
    reason: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('yt_ip_blacklist')
        .insert({
          ip_address: ipAddress,
          reason,
          severity,
          expires_at: expiresAt?.toISOString() || null,
          is_active: true
        })

      if (error) {
        console.error('Error adding IP to blacklist:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error adding IP to blacklist:', error)
      return false
    }
  }

  /**
   * 获取最近的安全事件
   */
  async getRecentSecurityEvents(userId: string, limit: number = 20) {
    try {
      const { data, error } = await this.supabase
        .from('yt_login_security_logs')
        .select('*')
        .eq('nextauth_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent security events:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Error fetching recent security events:', error)
      return []
    }
  }

  /**
   * 清理过期的安全日志
   */
  async cleanupExpiredLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const { data, error } = await this.supabase
        .from('yt_login_security_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Error cleaning up expired logs:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Error cleaning up expired logs:', error)
      return 0
    }
  }

  // 私有辅助方法

  private async getYtUserId(nextauthUserId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('yt_users')
        .select('id')
        .eq('nextauth_user_id', nextauthUserId)
        .single()

      if (error || !data) {
        return null
      }

      return data.id
    } catch (error) {
      return null
    }
  }

  private calculateSessionDuration(session: Session): number {
    try {
      const expiresAt = new Date(session.expires)
      const now = new Date()
      return Math.max(0, expiresAt.getTime() - now.getTime())
    } catch (error) {
      return 0
    }
  }

  private calculateRiskScore(data: {
    totalLogins: number
    failedLogins: number
    suspiciousLogins: number
    anomaliesDetected: number
  }): number {
    let score = 0

    // 失败登录比例
    if (data.totalLogins > 0) {
      const failureRate = data.failedLogins / (data.totalLogins + data.failedLogins)
      score += failureRate * 30
    }

    // 可疑登录比例
    if (data.totalLogins > 0) {
      const suspiciousRate = data.suspiciousLogins / data.totalLogins
      score += suspiciousRate * 40
    }

    // 异常检测数量
    score += Math.min(data.anomaliesDetected * 5, 30)

    return Math.min(100, Math.max(0, Math.round(score)))
  }

  private getDefaultAnalytics(): SecurityAnalytics {
    return {
      totalLogins: 0,
      failedLogins: 0,
      suspiciousLogins: 0,
      uniqueIPs: 0,
      uniqueDevices: 0,
      anomaliesDetected: 0,
      riskScore: 0
    }
  }
}

// 导出单例实例
export const securityLogger = new SecurityLogger()

// 导出类型
export type { SecurityAnalytics, LoginAnomalyData }