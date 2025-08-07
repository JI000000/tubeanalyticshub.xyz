/**
 * 用户隐私设置管理服务
 * 处理GDPR合规、数据控制选项和隐私偏好
 */

import { createSupabaseServiceClient } from '@/lib/supabase'

export interface PrivacySettings {
  id?: string
  userId: string
  
  // 数据收集设置
  allowAnalytics: boolean
  allowPerformanceTracking: boolean
  allowErrorReporting: boolean
  allowUsageStatistics: boolean
  
  // 登录安全设置
  enableLoginNotifications: boolean
  enableSecurityAlerts: boolean
  enableLocationTracking: boolean
  require2fa: boolean
  
  // 数据保留设置
  dataRetentionPeriod: number // 天数
  autoDeleteLogs: boolean
  keepEssentialDataOnly: boolean
  
  // 第三方集成设置
  allowOauthDataSharing: boolean
  allowProfileDataExport: boolean
  
  // GDPR相关设置
  gdprConsentGiven: boolean
  gdprConsentDate?: Date
  marketingConsent: boolean
  
  createdAt?: Date
  updatedAt?: Date
}

export interface DataDeletionRequest {
  id?: string
  userId: string
  requestType: 'partial_deletion' | 'full_account_deletion' | 'data_export'
  deletionScope: Record<string, boolean>
  reason?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  requestedBy: 'user' | 'admin' | 'system'
  
  // 处理信息
  processedBy?: string
  processingStartedAt?: Date
  processingCompletedAt?: Date
  processingNotes?: string
  
  // 删除统计
  deletedRecordsCount?: Record<string, number>
  exportFilePath?: string
  
  createdAt?: Date
  updatedAt?: Date
}

export interface GDPRComplianceLog {
  id?: string
  userId?: string
  actionType: 'consent_given' | 'consent_withdrawn' | 'data_exported' | 'data_deleted' | 'data_rectified'
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests'
  dataCategories: string[]
  processingPurpose: string
  retentionPeriod?: number
  
  // 请求详情
  requestSource: 'user_portal' | 'email' | 'support_ticket' | 'admin'
  requestReference?: string
  
  // 处理详情
  processedBy?: string
  processingTimeMs?: number
  
  createdAt?: Date
}

class PrivacySettingsService {
  private supabase = createSupabaseServiceClient()

  /**
   * 获取用户隐私设置
   */
  async getUserPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const ytUserId = await this.getYtUserId(userId)
      if (!ytUserId) return null

      const { data, error } = await this.supabase
        .from('yt_user_privacy_settings')
        .select('*')
        .eq('user_id', ytUserId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 记录不存在，创建默认设置
          return await this.createDefaultPrivacySettings(ytUserId)
        }
        console.error('Error fetching privacy settings:', error)
        return null
      }

      return this.mapDatabaseToPrivacySettings(data)
    } catch (error) {
      console.error('Error getting user privacy settings:', error)
      return null
    }
  }

  /**
   * 更新用户隐私设置
   */
  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<boolean> {
    try {
      const ytUserId = await this.getYtUserId(userId)
      if (!ytUserId) return false

      const updateData = this.mapPrivacySettingsToDatabase(settings)
      
      const { error } = await this.supabase
        .from('yt_user_privacy_settings')
        .upsert({
          user_id: ytUserId,
          ...updateData,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating privacy settings:', error)
        return false
      }

      // 记录GDPR合规日志
      if (settings.gdprConsentGiven !== undefined) {
        await this.logGDPRCompliance({
          userId: ytUserId,
          actionType: settings.gdprConsentGiven ? 'consent_given' : 'consent_withdrawn',
          legalBasis: 'consent',
          dataCategories: ['user_preferences', 'privacy_settings'],
          processingPurpose: 'Privacy settings management',
          requestSource: 'user_portal'
        })
      }

      return true
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      return false
    }
  }

  /**
   * 创建数据删除请求
   */
  async createDataDeletionRequest(
    userId: string,
    requestType: DataDeletionRequest['requestType'],
    deletionScope: Record<string, boolean>,
    reason?: string
  ): Promise<string | null> {
    try {
      const ytUserId = await this.getYtUserId(userId)
      if (!ytUserId) return null

      const { data, error } = await this.supabase
        .from('yt_data_deletion_requests')
        .insert({
          user_id: ytUserId,
          request_type: requestType,
          deletion_scope: deletionScope,
          reason: reason || null,
          status: 'pending',
          requested_by: 'user'
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating deletion request:', error)
        return null
      }

      // 记录GDPR合规日志
      await this.logGDPRCompliance({
        userId: ytUserId,
        actionType: 'data_deleted',
        legalBasis: 'consent',
        dataCategories: Object.keys(deletionScope).filter(key => deletionScope[key]),
        processingPurpose: 'User requested data deletion',
        requestSource: 'user_portal',
        requestReference: data.id
      })

      return data.id
    } catch (error) {
      console.error('Error creating data deletion request:', error)
      return null
    }
  }

  /**
   * 获取用户的数据删除请求
   */
  async getUserDeletionRequests(userId: string): Promise<DataDeletionRequest[]> {
    try {
      const ytUserId = await this.getYtUserId(userId)
      if (!ytUserId) return []

      const { data, error } = await this.supabase
        .from('yt_data_deletion_requests')
        .select('*')
        .eq('user_id', ytUserId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching deletion requests:', error)
        return []
      }

      return data.map(this.mapDatabaseToDeletionRequest)
    } catch (error) {
      console.error('Error getting user deletion requests:', error)
      return []
    }
  }

  /**
   * 处理数据删除请求
   */
  async processDeletionRequest(requestId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('process_data_deletion_request', {
        p_request_id: requestId
      })

      if (error) {
        console.error('Error processing deletion request:', error)
        return false
      }

      return data?.success || false
    } catch (error) {
      console.error('Error processing deletion request:', error)
      return false
    }
  }

  /**
   * 导出用户数据
   */
  async exportUserData(userId: string): Promise<Record<string, any> | null> {
    try {
      const ytUserId = await this.getYtUserId(userId)
      if (!ytUserId) return null

      // 收集用户的所有数据
      const userData: Record<string, any> = {}

      // 基本用户信息
      const { data: userInfo } = await this.supabase
        .from('yt_users')
        .select('*')
        .eq('id', ytUserId)
        .single()

      if (userInfo) {
        userData.profile = userInfo
      }

      // 隐私设置
      const { data: privacySettings } = await this.supabase
        .from('yt_user_privacy_settings')
        .select('*')
        .eq('user_id', ytUserId)
        .single()

      if (privacySettings) {
        userData.privacySettings = privacySettings
      }

      // 登录日志
      const { data: loginLogs } = await this.supabase
        .from('yt_login_security_logs')
        .select('*')
        .eq('user_id', ytUserId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (loginLogs) {
        userData.loginHistory = loginLogs
      }

      // 设备信息
      const { data: devices } = await this.supabase
        .from('yt_user_devices')
        .select('*')
        .eq('user_id', ytUserId)

      if (devices) {
        userData.devices = devices
      }

      // 记录GDPR合规日志
      await this.logGDPRCompliance({
        userId: ytUserId,
        actionType: 'data_exported',
        legalBasis: 'consent',
        dataCategories: ['profile', 'privacy_settings', 'login_history', 'devices'],
        processingPurpose: 'User requested data export',
        requestSource: 'user_portal'
      })

      return userData
    } catch (error) {
      console.error('Error exporting user data:', error)
      return null
    }
  }

  /**
   * 获取GDPR合规日志
   */
  async getGDPRComplianceLogs(userId: string, limit: number = 50): Promise<GDPRComplianceLog[]> {
    try {
      const ytUserId = await this.getYtUserId(userId)
      if (!ytUserId) return []

      const { data, error } = await this.supabase
        .from('yt_gdpr_compliance_logs')
        .select('*')
        .eq('user_id', ytUserId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching GDPR logs:', error)
        return []
      }

      return data.map(this.mapDatabaseToGDPRLog)
    } catch (error) {
      console.error('Error getting GDPR compliance logs:', error)
      return []
    }
  }

  /**
   * 检查用户是否有有效的GDPR同意
   */
  async hasValidGDPRConsent(userId: string): Promise<boolean> {
    try {
      const settings = await this.getUserPrivacySettings(userId)
      return settings?.gdprConsentGiven || false
    } catch (error) {
      console.error('Error checking GDPR consent:', error)
      return false
    }
  }

  /**
   * 撤销GDPR同意
   */
  async withdrawGDPRConsent(userId: string): Promise<boolean> {
    try {
      const success = await this.updatePrivacySettings(userId, {
        gdprConsentGiven: false,
        allowAnalytics: false,
        allowPerformanceTracking: false,
        allowUsageStatistics: false,
        marketingConsent: false
      })

      if (success) {
        const ytUserId = await this.getYtUserId(userId)
        if (ytUserId) {
          await this.logGDPRCompliance({
            userId: ytUserId,
            actionType: 'consent_withdrawn',
            legalBasis: 'consent',
            dataCategories: ['all_personal_data'],
            processingPurpose: 'User withdrew GDPR consent',
            requestSource: 'user_portal'
          })
        }
      }

      return success
    } catch (error) {
      console.error('Error withdrawing GDPR consent:', error)
      return false
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(userId: string): Promise<number> {
    try {
      const settings = await this.getUserPrivacySettings(userId)
      if (!settings || !settings.autoDeleteLogs) {
        return 0
      }

      const ytUserId = await this.getYtUserId(userId)
      if (!ytUserId) return 0

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - settings.dataRetentionPeriod)

      let deletedCount = 0

      // 删除过期的登录日志
      const { data: deletedLogs }: { data: any[] | null } = await this.supabase
        .from('yt_login_security_logs')
        .delete()
        .eq('user_id', ytUserId)
        .lt('created_at', cutoffDate.toISOString())

      const logs = deletedLogs ?? [];
      deletedCount += logs.length;

      // 记录清理操作
      await this.logGDPRCompliance({
        userId: ytUserId,
        actionType: 'data_deleted',
        legalBasis: 'consent',
        dataCategories: ['login_logs'],
        processingPurpose: 'Automated data retention cleanup',
        requestSource: 'admin'
      })

      return deletedCount
    } catch (error) {
      console.error('Error cleaning up expired data:', error)
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

  private async createDefaultPrivacySettings(ytUserId: string): Promise<PrivacySettings> {
    const defaultSettings: PrivacySettings = {
      userId: ytUserId,
      allowAnalytics: true,
      allowPerformanceTracking: true,
      allowErrorReporting: true,
      allowUsageStatistics: true,
      enableLoginNotifications: true,
      enableSecurityAlerts: true,
      enableLocationTracking: false,
      require2fa: false,
      dataRetentionPeriod: 365,
      autoDeleteLogs: false,
      keepEssentialDataOnly: false,
      allowOauthDataSharing: true,
      allowProfileDataExport: true,
      gdprConsentGiven: false,
      marketingConsent: false
    }

    await this.supabase.rpc('initialize_user_privacy_settings', {
      p_user_id: ytUserId
    })

    return defaultSettings
  }

  private async logGDPRCompliance(log: Omit<GDPRComplianceLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      await this.supabase
        .from('yt_gdpr_compliance_logs')
        .insert({
          user_id: log.userId || null,
          action_type: log.actionType,
          legal_basis: log.legalBasis,
          data_categories: log.dataCategories,
          processing_purpose: log.processingPurpose,
          retention_period: log.retentionPeriod || null,
          request_source: log.requestSource,
          request_reference: log.requestReference || null,
          processed_by: log.processedBy || null,
          processing_time_ms: log.processingTimeMs || null
        })
    } catch (error) {
      console.error('Error logging GDPR compliance:', error)
    }
  }

  private mapDatabaseToPrivacySettings(data: any): PrivacySettings {
    return {
      id: data.id,
      userId: data.user_id,
      allowAnalytics: data.allow_analytics,
      allowPerformanceTracking: data.allow_performance_tracking,
      allowErrorReporting: data.allow_error_reporting,
      allowUsageStatistics: data.allow_usage_statistics,
      enableLoginNotifications: data.enable_login_notifications,
      enableSecurityAlerts: data.enable_security_alerts,
      enableLocationTracking: data.enable_location_tracking,
      require2fa: data.require_2fa,
      dataRetentionPeriod: data.data_retention_period,
      autoDeleteLogs: data.auto_delete_logs,
      keepEssentialDataOnly: data.keep_essential_data_only,
      allowOauthDataSharing: data.allow_oauth_data_sharing,
      allowProfileDataExport: data.allow_profile_data_export,
      gdprConsentGiven: data.gdpr_consent_given,
      gdprConsentDate: data.gdpr_consent_date ? new Date(data.gdpr_consent_date) : undefined,
      marketingConsent: data.marketing_consent,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  private mapPrivacySettingsToDatabase(settings: Partial<PrivacySettings>): any {
    const mapped: any = {}
    
    if (settings.allowAnalytics !== undefined) mapped.allow_analytics = settings.allowAnalytics
    if (settings.allowPerformanceTracking !== undefined) mapped.allow_performance_tracking = settings.allowPerformanceTracking
    if (settings.allowErrorReporting !== undefined) mapped.allow_error_reporting = settings.allowErrorReporting
    if (settings.allowUsageStatistics !== undefined) mapped.allow_usage_statistics = settings.allowUsageStatistics
    if (settings.enableLoginNotifications !== undefined) mapped.enable_login_notifications = settings.enableLoginNotifications
    if (settings.enableSecurityAlerts !== undefined) mapped.enable_security_alerts = settings.enableSecurityAlerts
    if (settings.enableLocationTracking !== undefined) mapped.enable_location_tracking = settings.enableLocationTracking
    if (settings.require2fa !== undefined) mapped.require_2fa = settings.require2fa
    if (settings.dataRetentionPeriod !== undefined) mapped.data_retention_period = settings.dataRetentionPeriod
    if (settings.autoDeleteLogs !== undefined) mapped.auto_delete_logs = settings.autoDeleteLogs
    if (settings.keepEssentialDataOnly !== undefined) mapped.keep_essential_data_only = settings.keepEssentialDataOnly
    if (settings.allowOauthDataSharing !== undefined) mapped.allow_oauth_data_sharing = settings.allowOauthDataSharing
    if (settings.allowProfileDataExport !== undefined) mapped.allow_profile_data_export = settings.allowProfileDataExport
    if (settings.gdprConsentGiven !== undefined) {
      mapped.gdpr_consent_given = settings.gdprConsentGiven
      if (settings.gdprConsentGiven) {
        mapped.gdpr_consent_date = new Date().toISOString()
      }
    }
    if (settings.marketingConsent !== undefined) mapped.marketing_consent = settings.marketingConsent

    return mapped
  }

  private mapDatabaseToDeletionRequest(data: any): DataDeletionRequest {
    return {
      id: data.id,
      userId: data.user_id,
      requestType: data.request_type,
      deletionScope: data.deletion_scope,
      reason: data.reason,
      status: data.status,
      requestedBy: data.requested_by,
      processedBy: data.processed_by,
      processingStartedAt: data.processing_started_at ? new Date(data.processing_started_at) : undefined,
      processingCompletedAt: data.processing_completed_at ? new Date(data.processing_completed_at) : undefined,
      processingNotes: data.processing_notes,
      deletedRecordsCount: data.deleted_records_count,
      exportFilePath: data.export_file_path,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  private mapDatabaseToGDPRLog(data: any): GDPRComplianceLog {
    return {
      id: data.id,
      userId: data.user_id,
      actionType: data.action_type,
      legalBasis: data.legal_basis,
      dataCategories: data.data_categories,
      processingPurpose: data.processing_purpose,
      retentionPeriod: data.retention_period,
      requestSource: data.request_source,
      requestReference: data.request_reference,
      processedBy: data.processed_by,
      processingTimeMs: data.processing_time_ms,
      createdAt: new Date(data.created_at)
    }
  }
}

// 导出单例实例
export const privacySettingsService = new PrivacySettingsService()

// 导出类型