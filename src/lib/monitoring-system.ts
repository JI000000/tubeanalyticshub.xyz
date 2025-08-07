/**
 * 登录系统监控和告警机制
 * 
 * 提供系统健康监控、性能指标收集和自动告警功能
 */

import { supabase } from '@/lib/supabase'

// 监控指标接口
interface SystemMetrics {
  timestamp: Date
  loginSuccessRate: number
  loginFailureRate: number
  avgResponseTime: number
  activeUsers: number
  trialConversionRate: number
  dbConnectionStatus: boolean
  apiErrorRate: number
  memoryUsage: number
  cpuUsage: number
}

// 告警规则接口
interface AlertRule {
  id: string
  name: string
  description: string
  condition: (metrics: SystemMetrics) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // 冷却时间（秒）
  enabled: boolean
  lastTriggered?: Date
}

// 告警通知接口
interface AlertNotification {
  id: string
  ruleId: string
  message: string
  severity: string
  context: any
  createdAt: Date
  resolved: boolean
  resolvedAt?: Date
}

class MonitoringSystem {
  private metrics: SystemMetrics[] = []
  private alertRules: AlertRule[] = []
  private activeAlerts: Map<string, AlertNotification> = new Map()
  private metricsCollectionInterval?: NodeJS.Timeout
  private alertCheckInterval?: NodeJS.Timeout

  constructor() {
    this.initializeAlertRules()
    this.startMetricsCollection()
    this.startAlertChecking()
  }

  /**
   * 初始化告警规则
   */
  private initializeAlertRules() {
    this.alertRules = [
      {
        id: 'login-failure-rate-high',
        name: '登录失败率过高',
        description: '登录失败率超过20%',
        condition: (metrics) => metrics.loginFailureRate > 20,
        severity: 'high',
        cooldown: 300, // 5分钟
        enabled: true
      },
      {
        id: 'api-response-time-slow',
        name: 'API响应时间过长',
        description: '平均API响应时间超过3秒',
        condition: (metrics) => metrics.avgResponseTime > 3000,
        severity: 'medium',
        cooldown: 600, // 10分钟
        enabled: true
      },
      {
        id: 'database-connection-failed',
        name: '数据库连接失败',
        description: '数据库连接状态异常',
        condition: (metrics) => !metrics.dbConnectionStatus,
        severity: 'critical',
        cooldown: 60, // 1分钟
        enabled: true
      },
      {
        id: 'trial-conversion-low',
        name: '试用转化率过低',
        description: '试用到登录转化率低于5%',
        condition: (metrics) => metrics.trialConversionRate < 5,
        severity: 'medium',
        cooldown: 1800, // 30分钟
        enabled: true
      },
      {
        id: 'api-error-rate-high',
        name: 'API错误率过高',
        description: 'API错误率超过5%',
        condition: (metrics) => metrics.apiErrorRate > 5,
        severity: 'high',
        cooldown: 300, // 5分钟
        enabled: true
      },
      {
        id: 'memory-usage-high',
        name: '内存使用率过高',
        description: '内存使用率超过85%',
        condition: (metrics) => metrics.memoryUsage > 85,
        severity: 'medium',
        cooldown: 900, // 15分钟
        enabled: true
      }
    ]
  }

  /**
   * 开始指标收集
   */
  private startMetricsCollection() {
    // 每分钟收集一次指标
    this.metricsCollectionInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics()
        this.metrics.push(metrics)
        
        // 只保留最近24小时的指标
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
        this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
        
        // 存储到数据库
        await this.storeMetrics(metrics)
      } catch (error) {
        console.error('指标收集失败:', error)
      }
    }, 60000) // 每分钟
  }

  /**
   * 开始告警检查
   */
  private startAlertChecking() {
    // 每30秒检查一次告警
    this.alertCheckInterval = setInterval(async () => {
      try {
        await this.checkAlerts()
      } catch (error) {
        console.error('告警检查失败:', error)
      }
    }, 30000) // 每30秒
  }

  /**
   * 收集系统指标
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // 收集登录相关指标
    const loginStats = await this.getLoginStats(oneHourAgo, now)
    
    // 收集试用转化指标
    const trialStats = await this.getTrialStats(oneHourAgo, now)
    
    // 收集系统性能指标
    const performanceStats = await this.getPerformanceStats()
    
    // 检查数据库连接
    const dbStatus = await this.checkDatabaseConnection()

    return {
      timestamp: now,
      loginSuccessRate: loginStats.successRate,
      loginFailureRate: loginStats.failureRate,
      avgResponseTime: performanceStats.avgResponseTime,
      activeUsers: loginStats.activeUsers,
      trialConversionRate: trialStats.conversionRate,
      dbConnectionStatus: dbStatus,
      apiErrorRate: performanceStats.errorRate,
      memoryUsage: performanceStats.memoryUsage,
      cpuUsage: performanceStats.cpuUsage
    }
  }

  /**
   * 获取登录统计数据
   */
  private async getLoginStats(startTime: Date, endTime: Date) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data: loginEvents } = await supabase
      .from('yt_login_analytics')
      .select('event_type, user_id')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());
    const events = loginEvents || [];
    const total = events.length;
    const success = events.filter(e => e.event_type === 'success').length;
    const failure = events.filter(e => e.event_type === 'failure').length;
    const users = new Set(events.map(e => e.user_id)).size;
    return {
      successRate: total ? (success / total) * 100 : 0,
      failureRate: total ? (failure / total) * 100 : 0,
      activeUsers: users
    };
  }

  /**
   * 获取试用转化统计
   */
  private async getTrialStats(startTime: Date, endTime: Date) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data: trialData } = await supabase
      .from('yt_anonymous_trials')
      .select('user_id, created_at, converted')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());
    const trials = trialData || [];
    const total = trials.length;
    const converted = trials.filter(t => t.converted).length;
    return {
      conversionRate: total ? (converted / total) * 100 : 0
    };
  }

  /**
   * 获取性能统计
   */
  private async getPerformanceStats() {
    // 模拟性能数据收集（实际项目中应该从真实的监控系统获取）
    const memoryUsage = process.memoryUsage()
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

    return {
      avgResponseTime: Math.random() * 2000 + 500, // 模拟响应时间
      errorRate: Math.random() * 10, // 模拟错误率
      memoryUsage: memoryUsagePercent,
      cpuUsage: Math.random() * 100 // 模拟CPU使用率
    }
  }

  /**
   * 检查数据库连接
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('yt_users').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * 存储指标到数据库
   */
  private async storeMetrics(metrics: SystemMetrics) {
    if (!supabase) throw new Error('Supabase client not initialized');
    await supabase.from('yt_system_metrics').insert([metrics]);
  }

  /**
   * 检查告警条件
   */
  private async checkAlerts() {
    if (this.metrics.length === 0) return

    const latestMetrics = this.metrics[this.metrics.length - 1]

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      // 检查冷却时间
      if (rule.lastTriggered) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldown * 1000)
        if (new Date() < cooldownEnd) continue
      }

      // 检查告警条件
      if (rule.condition(latestMetrics)) {
        await this.triggerAlert(rule, latestMetrics)
        rule.lastTriggered = new Date()
      }
    }
  }

  /**
   * 触发告警
   */
  private async triggerAlert(rule: AlertRule, metrics: SystemMetrics) {
    const alert: AlertNotification = {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      message: `${rule.name}: ${rule.description}`,
      severity: rule.severity,
      context: {
        metrics,
        rule: rule.name,
        timestamp: new Date().toISOString()
      },
      createdAt: new Date(),
      resolved: false
    }

    this.activeAlerts.set(alert.id, alert)

    // 发送通知
    await this.sendNotification(alert)

    // 存储告警记录
    await this.storeAlert(alert)

    console.warn(`🚨 告警触发: ${alert.message}`, alert.context)
  }

  /**
   * 发送告警通知
   */
  private async sendNotification(alert: AlertNotification) {
    try {
      // 发送到Slack（如果配置了）
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackNotification(alert)
      }

      // 发送邮件通知（如果配置了）
      if (process.env.ALERT_EMAIL) {
        await this.sendEmailNotification(alert)
      }

      // 发送到监控系统（如果配置了）
      if (process.env.MONITORING_WEBHOOK_URL) {
        await this.sendWebhookNotification(alert)
      }
    } catch (error) {
      console.error('发送告警通知失败:', error)
    }
  }

  /**
   * 发送Slack通知
   */
  private async sendSlackNotification(alert: AlertNotification) {
    const color = {
      low: 'good',
      medium: 'warning',
      high: 'danger',
      critical: 'danger'
    }[alert.severity]

    const payload = {
      text: `🚨 系统告警: ${alert.message}`,
      attachments: [{
        color,
        fields: [
          {
            title: '严重程度',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: '时间',
            value: alert.createdAt.toISOString(),
            short: true
          },
          {
            title: '详细信息',
            value: JSON.stringify(alert.context.metrics, null, 2),
            short: false
          }
        ]
      }]
    }

    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(alert: AlertNotification) {
    // 这里应该集成实际的邮件服务
    console.log('发送邮件通知:', {
      to: process.env.ALERT_EMAIL,
      subject: `系统告警: ${alert.message}`,
      body: JSON.stringify(alert, null, 2)
    })
  }

  /**
   * 发送Webhook通知
   */
  private async sendWebhookNotification(alert: AlertNotification) {
    await fetch(process.env.MONITORING_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    })
  }

  /**
   * 存储告警记录
   */
  private async storeAlert(alert: AlertNotification) {
    if (!supabase) throw new Error('Supabase client not initialized');
    await supabase.from('yt_alerts').insert([alert]);
  }

  /**
   * 获取当前指标
   */
  public getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * 获取历史指标
   */
  public getHistoricalMetrics(hours: number = 24): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.metrics.filter(m => m.timestamp > cutoff)
  }

  /**
   * 获取活跃告警
   */
  public getActiveAlerts(): AlertNotification[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved)
  }

  /**
   * 解决告警
   */
  public async resolveAlert(alertId: string) {
    if (!supabase) throw new Error('Supabase client not initialized');
    await supabase.from('yt_alerts').update({ resolved: true, resolvedAt: new Date() }).eq('id', alertId);
  }

  /**
   * 添加自定义告警规则
   */
  public addAlertRule(rule: Omit<AlertRule, 'lastTriggered'>) {
    this.alertRules.push(rule as AlertRule)
  }

  /**
   * 更新告警规则
   */
  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>) {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId)
    if (ruleIndex !== -1) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates }
    }
  }

  /**
   * 停止监控
   */
  public stop() {
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval)
    }
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval)
    }
  }

  /**
   * 生成健康报告
   */
  public generateHealthReport(): any {
    const currentMetrics = this.getCurrentMetrics()
    const activeAlerts = this.getActiveAlerts()
    
    return {
      timestamp: new Date().toISOString(),
      status: activeAlerts.length === 0 ? 'healthy' : 'warning',
      metrics: currentMetrics,
      activeAlerts: activeAlerts.length,
      alertDetails: activeAlerts.map(alert => ({
        id: alert.id,
        message: alert.message,
        severity: alert.severity,
        createdAt: alert.createdAt
      })),
      recommendations: this.generateRecommendations(currentMetrics, activeAlerts)
    }
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(metrics: SystemMetrics | null, alerts: AlertNotification[]): string[] {
    const recommendations: string[] = []

    if (!metrics) return recommendations

    if (metrics.loginFailureRate > 15) {
      recommendations.push('登录失败率较高，建议检查OAuth配置和用户体验流程')
    }

    if (metrics.avgResponseTime > 2000) {
      recommendations.push('API响应时间较长，建议优化数据库查询和缓存策略')
    }

    if (metrics.trialConversionRate < 10) {
      recommendations.push('试用转化率较低，建议优化登录提示文案和时机')
    }

    if (metrics.memoryUsage > 80) {
      recommendations.push('内存使用率较高，建议检查内存泄漏和优化代码')
    }

    if (alerts.length > 0) {
      recommendations.push('存在活跃告警，建议及时处理以确保系统稳定性')
    }

    return recommendations
  }
}

// 创建全局监控实例
export const monitoringSystem = new MonitoringSystem()

// 导出类型
export type { SystemMetrics, AlertRule, AlertNotification }