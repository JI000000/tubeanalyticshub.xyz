/**
 * 用户反馈收集和处理系统
 * 
 * 提供用户反馈收集、分类、处理和分析功能
 */

import { supabase } from '@/lib/supabase'

// 反馈类型枚举
export enum FeedbackType {
  BUG_REPORT = 'bug_report',
  FEATURE_REQUEST = 'feature_request',
  LOGIN_ISSUE = 'login_issue',
  PERFORMANCE_ISSUE = 'performance_issue',
  UI_UX_FEEDBACK = 'ui_ux_feedback',
  GENERAL_FEEDBACK = 'general_feedback'
}

// 反馈优先级
export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 反馈状态
export enum FeedbackStatus {
  NEW = 'new',
  IN_REVIEW = 'in_review',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  DUPLICATE = 'duplicate'
}

// 反馈接口
export interface UserFeedback {
  id?: string
  userId?: string
  email?: string
  type: FeedbackType
  title: string
  description: string
  priority: FeedbackPriority
  status: FeedbackStatus
  category?: string
  tags?: string[]
  attachments?: FeedbackAttachment[]
  userAgent?: string
  url?: string
  sessionId?: string
  deviceInfo?: any
  reproductionSteps?: string[]
  expectedBehavior?: string
  actualBehavior?: string
  createdAt?: Date
  updatedAt?: Date
  resolvedAt?: Date
  assignedTo?: string
  resolution?: string
  upvotes?: number
  downvotes?: number
}

// 附件接口
export interface FeedbackAttachment {
  id: string
  filename: string
  url: string
  type: 'image' | 'video' | 'document' | 'log'
  size: number
}

// 反馈统计接口
export interface FeedbackStatistics {
  total: number
  byType: Record<FeedbackType, number>
  byPriority: Record<FeedbackPriority, number>
  byStatus: Record<FeedbackStatus, number>
  avgResolutionTime: number
  satisfactionScore: number
  trendData: Array<{
    date: string
    count: number
    resolved: number
  }>
}

class FeedbackSystem {
  /**
   * 提交用户反馈
   */
  async submitFeedback(feedback: Omit<UserFeedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // 自动分类和优先级评估
      const processedFeedback = await this.processFeedback(feedback)
      
      // 存储到数据库
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { data, error } = await supabase
        .from('yt_user_feedback')
        .insert({
          user_id: feedback.userId,
          email: feedback.email,
          type: feedback.type,
          title: feedback.title,
          description: feedback.description,
          priority: processedFeedback.priority,
          status: FeedbackStatus.NEW,
          category: processedFeedback.category,
          tags: feedback.tags || [],
          user_agent: feedback.userAgent,
          url: feedback.url,
          session_id: feedback.sessionId,
          device_info: feedback.deviceInfo,
          reproduction_steps: feedback.reproductionSteps || [],
          expected_behavior: feedback.expectedBehavior,
          actual_behavior: feedback.actualBehavior,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      const feedbackId = data.id

      // 处理附件
      if (feedback.attachments && feedback.attachments.length > 0) {
        await this.saveAttachments(feedbackId, feedback.attachments)
      }

      // 发送通知
      await this.sendFeedbackNotification(feedbackId, processedFeedback)

      // 记录分析事件
      await this.trackFeedbackEvent('feedback_submitted', {
        feedbackId,
        type: feedback.type,
        priority: processedFeedback.priority,
        userId: feedback.userId
      })

      return feedbackId
    } catch (error) {
      console.error('提交反馈失败:', error)
      throw new Error('Failed to submit feedback')
    }
  }

  /**
   * 处理和分类反馈
   */
  private async processFeedback(feedback: Partial<UserFeedback>): Promise<{
    priority: FeedbackPriority
    category: string
  }> {
    // 基于关键词的自动分类
    const category = this.categorizeFeedback(feedback.title + ' ' + feedback.description)
    
    // 基于类型和内容的优先级评估
    const priority = this.assessPriority(feedback)

    return { priority, category }
  }

  /**
   * 基于关键词的反馈分类
   */
  private categorizeFeedback(content: string): string {
    const keywords = {
      'authentication': ['login', 'logout', 'signin', 'signup', 'password', 'oauth', 'github', 'google'],
      'performance': ['slow', 'loading', 'timeout', 'lag', 'freeze', 'crash', 'memory'],
      'ui_ux': ['design', 'layout', 'button', 'color', 'font', 'mobile', 'responsive'],
      'functionality': ['feature', 'function', 'work', 'broken', 'error', 'bug'],
      'data': ['export', 'import', 'save', 'load', 'sync', 'backup'],
      'analytics': ['report', 'chart', 'graph', 'statistics', 'metrics', 'analysis']
    }

    const lowerContent = content.toLowerCase()
    
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerContent.includes(word))) {
        return category
      }
    }

    return 'general'
  }

  /**
   * 评估反馈优先级
   */
  private assessPriority(feedback: Partial<UserFeedback>): FeedbackPriority {
    const content = (feedback.title + ' ' + feedback.description).toLowerCase()
    
    // 关键词权重
    const criticalKeywords = ['crash', 'data loss', 'security', 'cannot login', 'broken']
    const highKeywords = ['error', 'bug', 'not working', 'failed', 'issue']
    const mediumKeywords = ['slow', 'improvement', 'feature request', 'suggestion']
    
    if (criticalKeywords.some(keyword => content.includes(keyword))) {
      return FeedbackPriority.CRITICAL
    }
    
    if (highKeywords.some(keyword => content.includes(keyword))) {
      return FeedbackPriority.HIGH
    }
    
    if (mediumKeywords.some(keyword => content.includes(keyword))) {
      return FeedbackPriority.MEDIUM
    }
    
    // 基于反馈类型的默认优先级
    switch (feedback.type) {
      case FeedbackType.BUG_REPORT:
        return FeedbackPriority.HIGH
      case FeedbackType.LOGIN_ISSUE:
        return FeedbackPriority.HIGH
      case FeedbackType.PERFORMANCE_ISSUE:
        return FeedbackPriority.MEDIUM
      case FeedbackType.FEATURE_REQUEST:
        return FeedbackPriority.MEDIUM
      default:
        return FeedbackPriority.LOW
    }
  }

  /**
   * 保存附件
   */
  private async saveAttachments(feedbackId: string, attachments: FeedbackAttachment[]) {
    try {
      const attachmentRecords = attachments.map(attachment => ({
        feedback_id: feedbackId,
        filename: attachment.filename,
        url: attachment.url,
        type: attachment.type,
        size: attachment.size
      }))

      if (supabase) {
        await supabase
          .from('yt_feedback_attachments')
          .insert(attachmentRecords)
      }
    } catch (error) {
      console.error('保存附件失败:', error)
    }
  }

  /**
   * 发送反馈通知
   */
  private async sendFeedbackNotification(feedbackId: string, feedback: any) {
    try {
      // 发送到Slack（如果配置了）
      if (process.env.FEEDBACK_SLACK_WEBHOOK) {
        await this.sendSlackFeedbackNotification(feedbackId, feedback)
      }

      // 发送邮件通知（如果配置了）
      if (process.env.FEEDBACK_EMAIL) {
        await this.sendEmailFeedbackNotification(feedbackId, feedback)
      }

      // 创建内部任务（如果集成了项目管理工具）
      if (feedback.priority === FeedbackPriority.CRITICAL || feedback.priority === FeedbackPriority.HIGH) {
        await this.createInternalTask(feedbackId, feedback)
      }
    } catch (error) {
      console.error('发送反馈通知失败:', error)
    }
  }

  /**
   * 发送Slack通知
   */
  private async sendSlackFeedbackNotification(feedbackId: string, feedback: UserFeedback) {
    const color = {
      [FeedbackPriority.CRITICAL]: 'danger',
      [FeedbackPriority.HIGH]: 'warning',
      [FeedbackPriority.MEDIUM]: 'good',
      [FeedbackPriority.LOW]: '#439FE0'
    }[feedback.priority]

    const payload = {
      text: `📝 新用户反馈: ${feedback.title}`,
      attachments: [{
        color,
        fields: [
          {
            title: '类型',
            value: feedback.type,
            short: true
          },
          {
            title: '优先级',
            value: feedback.priority.toUpperCase(),
            short: true
          },
          {
            title: '分类',
            value: feedback.category,
            short: true
          },
          {
            title: '反馈ID',
            value: feedbackId,
            short: true
          },
          {
            title: '描述',
            value: feedback.description.substring(0, 200) + (feedback.description.length > 200 ? '...' : ''),
            short: false
          }
        ],
        actions: [
          {
            type: 'button',
            text: '查看详情',
            url: `${process.env.NEXTAUTH_URL}/admin/feedback/${feedbackId}`
          }
        ]
      }]
    }

    await fetch(process.env.FEEDBACK_SLACK_WEBHOOK!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailFeedbackNotification(feedbackId: string, feedback: any) {
    // 这里应该集成实际的邮件服务
    console.log('发送反馈邮件通知:', {
      to: process.env.FEEDBACK_EMAIL,
      subject: `新用户反馈: ${feedback.title}`,
      feedbackId,
      priority: feedback.priority
    })
  }

  /**
   * 创建内部任务
   */
  private async createInternalTask(feedbackId: string, feedback: any) {
    // 这里可以集成Jira、Linear、GitHub Issues等项目管理工具
    console.log('创建内部任务:', {
      feedbackId,
      title: feedback.title,
      priority: feedback.priority,
      type: feedback.type
    })
  }

  /**
   * 记录分析事件
   */
  private async trackFeedbackEvent(eventType: string, data: any) {
    try {
      if (supabase) {
        await supabase
          .from('yt_feedback_analytics')
          .insert({
          event_type: eventType,
          data,
          created_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('记录反馈事件失败:', error)
    }
  }

  /**
   * 获取反馈列表
   */
  async getFeedbackList(filters: {
    type?: FeedbackType
    status?: FeedbackStatus
    priority?: FeedbackPriority
    category?: string
    userId?: string
    limit?: number
    offset?: number
  } = {}): Promise<UserFeedback[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      let query = supabase
        .from('yt_user_feedback')
        .select(`
          *,
          yt_feedback_attachments (*)
        `)
        .order('created_at', { ascending: false })

      // 应用过滤器
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      // 分页
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('获取反馈列表失败:', error)
      return []
    }
  }

  /**
   * 更新反馈状态
   */
  async updateFeedbackStatus(
    feedbackId: string, 
    status: FeedbackStatus, 
    resolution?: string,
    assignedTo?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (resolution) {
        updateData.resolution = resolution
      }

      if (assignedTo) {
        updateData.assigned_to = assignedTo
      }

      if (status === FeedbackStatus.RESOLVED || status === FeedbackStatus.CLOSED) {
        updateData.resolved_at = new Date().toISOString()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { error } = await supabase
        .from('yt_user_feedback')
        .update(updateData)
        .eq('id', feedbackId)

      if (error) {
        throw error
      }

      // 记录状态变更事件
      await this.trackFeedbackEvent('status_updated', {
        feedbackId,
        newStatus: status,
        assignedTo,
        hasResolution: !!resolution
      })

      return true
    } catch (error) {
      console.error('更新反馈状态失败:', error)
      return false
    }
  }

  /**
   * 获取反馈统计
   */
  async getFeedbackStatistics(days: number = 30): Promise<FeedbackStatistics> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { data: feedbackData, error } = await supabase
        .from('yt_user_feedback')
        .select('type, priority, status, created_at, resolved_at')
        .gte('created_at', startDate.toISOString())

      if (error) {
        throw error
      }

      const feedback = feedbackData || []

      // 按类型统计
      const byType = Object.values(FeedbackType).reduce((acc, type) => {
        acc[type] = feedback.filter(f => f.type === type).length
        return acc
      }, {} as Record<FeedbackType, number>)

      // 按优先级统计
      const byPriority = Object.values(FeedbackPriority).reduce((acc, priority) => {
        acc[priority] = feedback.filter(f => f.priority === priority).length
        return acc
      }, {} as Record<FeedbackPriority, number>)

      // 按状态统计
      const byStatus = Object.values(FeedbackStatus).reduce((acc, status) => {
        acc[status] = feedback.filter(f => f.status === status).length
        return acc
      }, {} as Record<FeedbackStatus, number>)

      // 计算平均解决时间
      const resolvedFeedback = feedback.filter(f => f.resolved_at)
      const avgResolutionTime = resolvedFeedback.length > 0
        ? resolvedFeedback.reduce((sum, f) => {
            const created = new Date(f.created_at).getTime()
            const resolved = new Date(f.resolved_at).getTime()
            return sum + (resolved - created)
          }, 0) / resolvedFeedback.length / (1000 * 60 * 60) // 转换为小时
        : 0

      // 生成趋势数据
      const trendData = this.generateTrendData(feedback, days)

      // 计算满意度评分（模拟数据，实际应该从用户评分获取）
      const satisfactionScore = 4.2 // 1-5分

      return {
        total: feedback.length,
        byType,
        byPriority,
        byStatus,
        avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
        satisfactionScore,
        trendData
      }
    } catch (error) {
      console.error('获取反馈统计失败:', error)
      return {
        total: 0,
        byType: {} as Record<FeedbackType, number>,
        byPriority: {} as Record<FeedbackPriority, number>,
        byStatus: {} as Record<FeedbackStatus, number>,
        avgResolutionTime: 0,
        satisfactionScore: 0,
        trendData: []
      }
    }
  }

  /**
   * 生成趋势数据
   */
  private generateTrendData(feedback: any[], days: number) {
    const trendData = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayFeedback = feedback.filter(f => {
        const feedbackDate = new Date(f.created_at).toISOString().split('T')[0]
        return feedbackDate === dateStr
      })
      
      const resolved = dayFeedback.filter(f => 
        f.resolved_at && new Date(f.resolved_at).toISOString().split('T')[0] === dateStr
      ).length

      trendData.push({
        date: dateStr,
        count: dayFeedback.length,
        resolved
      })
    }
    
    return trendData
  }

  /**
   * 搜索反馈
   */
  async searchFeedback(query: string, filters: any = {}): Promise<UserFeedback[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      let dbQuery = supabase
        .from('yt_user_feedback')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      // 应用过滤器
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          dbQuery = dbQuery.eq(key, value)
        }
      })

      const { data, error } = await dbQuery.limit(50)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('搜索反馈失败:', error)
      return []
    }
  }

  /**
   * 批量操作反馈
   */
  async bulkUpdateFeedback(
    feedbackIds: string[], 
    updates: Partial<UserFeedback>
  ): Promise<boolean> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { error } = await supabase
        .from('yt_user_feedback')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', feedbackIds)

      if (error) {
        throw error
      }

      // 记录批量操作事件
      await this.trackFeedbackEvent('bulk_update', {
        feedbackIds,
        updates,
        count: feedbackIds.length
      })

      return true
    } catch (error) {
      console.error('批量更新反馈失败:', error)
      return false
    }
  }
}

// 创建全局反馈系统实例
export const feedbackSystem = new FeedbackSystem()

// 导出类型已在接口定义处导出