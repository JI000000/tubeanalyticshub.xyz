/**
 * 智能登录时机推荐算法
 * 基于用户行为分析和机器学习，智能推荐最佳登录时机
 */

import { createClient } from '@supabase/supabase-js';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 用户行为事件类型
export type UserBehaviorEvent = 
  | 'page_view'
  | 'feature_click'
  | 'scroll'
  | 'hover'
  | 'search'
  | 'export_attempt'
  | 'save_attempt'
  | 'share_attempt'
  | 'idle_start'
  | 'idle_end'
  | 'tab_focus'
  | 'tab_blur';

// 用户行为数据
export interface UserBehaviorData {
  fingerprint: string;
  userId?: string;
  sessionId: string;
  eventType: UserBehaviorEvent;
  eventData?: {
    page?: string;
    feature?: string;
    duration?: number;
    scrollDepth?: number;
    clickPosition?: { x: number; y: number };
    [key: string]: any;
  };
  timestamp: Date;
  deviceInfo: {
    type: 'mobile' | 'desktop' | 'tablet';
    browser: string;
    os: string;
    screenSize: { width: number; height: number };
  };
}

// 登录时机预测结果
export interface LoginTimingPrediction {
  shouldTrigger: boolean;
  confidence: number; // 0-1之间的置信度
  recommendedDelay: number; // 建议延迟时间（毫秒）
  reason: string;
  factors: {
    engagementScore: number;
    intentScore: number;
    frustrationScore: number;
    timeSpentScore: number;
    actionPatternScore: number;
  };
  suggestedTrigger: {
    type: 'immediate' | 'delayed' | 'contextual' | 'exit_intent';
    message: string;
    urgency: 'low' | 'medium' | 'high';
  };
}

// 用户参与度指标
export interface EngagementMetrics {
  sessionDuration: number;
  pageViews: number;
  featureInteractions: number;
  scrollDepth: number;
  idleTime: number;
  returnVisits: number;
  averageTimePerPage: number;
  bounceRate: number;
}

// 行为模式识别
export interface BehaviorPattern {
  patternType: 'explorer' | 'goal_oriented' | 'casual' | 'power_user';
  confidence: number;
  characteristics: {
    averageSessionTime: number;
    featuresUsed: string[];
    navigationPattern: 'linear' | 'random' | 'focused';
    interactionDepth: 'shallow' | 'medium' | 'deep';
  };
}

/**
 * 智能时机推荐引擎
 */
export class SmartTimingEngine {
  private static behaviorHistory: Map<string, UserBehaviorData[]> = new Map();
  private static engagementThresholds = {
    high: { sessionTime: 300000, interactions: 10, scrollDepth: 0.7 }, // 5分钟
    medium: { sessionTime: 120000, interactions: 5, scrollDepth: 0.4 }, // 2分钟
    low: { sessionTime: 30000, interactions: 2, scrollDepth: 0.2 }, // 30秒
  };

  /**
   * 记录用户行为事件
   */
  static async recordBehavior(behaviorData: UserBehaviorData): Promise<void> {
    try {
      // 保存到数据库
      await supabase.from('yt_user_behavior').insert({
        fingerprint: behaviorData.fingerprint,
        user_id: behaviorData.userId,
        session_id: behaviorData.sessionId,
        event_type: behaviorData.eventType,
        event_data: JSON.stringify(behaviorData.eventData || {}),
        timestamp: behaviorData.timestamp.toISOString(),
        device_info: JSON.stringify(behaviorData.deviceInfo),
      });

      // 更新内存缓存
      const userHistory = this.behaviorHistory.get(behaviorData.fingerprint) || [];
      userHistory.push(behaviorData);
      
      // 保持最近1000条记录
      if (userHistory.length > 1000) {
        userHistory.splice(0, userHistory.length - 1000);
      }
      
      this.behaviorHistory.set(behaviorData.fingerprint, userHistory);
    } catch (error) {
      console.error('Failed to record user behavior:', error);
    }
  }

  /**
   * 预测最佳登录时机
   */
  static async predictOptimalTiming(
    fingerprint: string,
    currentContext: {
      currentPage: string;
      sessionDuration: number;
      trialRemaining: number;
      lastAction?: string;
      recentEvents?: UserBehaviorEvent[];
    }
  ): Promise<LoginTimingPrediction> {
    try {
      // 获取用户行为历史
      const behaviorHistory = await this.getUserBehaviorHistory(fingerprint);
      
      // 计算各种评分因子
      const engagementScore = this.calculateEngagementScore(behaviorHistory, currentContext);
      const intentScore = this.calculateIntentScore(behaviorHistory, currentContext);
      const frustrationScore = this.calculateFrustrationScore(behaviorHistory, currentContext);
      const timeSpentScore = this.calculateTimeSpentScore(currentContext.sessionDuration);
      const actionPatternScore = this.calculateActionPatternScore(behaviorHistory, currentContext);

      // 综合评分
      const overallScore = this.calculateOverallScore({
        engagementScore,
        intentScore,
        frustrationScore,
        timeSpentScore,
        actionPatternScore,
      });

      // 生成预测结果
      const prediction = this.generatePrediction(overallScore, {
        engagementScore,
        intentScore,
        frustrationScore,
        timeSpentScore,
        actionPatternScore,
      }, currentContext);

      return prediction;
    } catch (error) {
      console.error('Failed to predict optimal timing:', error);
      return this.getDefaultPrediction();
    }
  }

  /**
   * 获取用户行为历史
   */
  private static async getUserBehaviorHistory(fingerprint: string): Promise<UserBehaviorData[]> {
    // 先检查内存缓存
    const cachedHistory = this.behaviorHistory.get(fingerprint);
    if (cachedHistory && cachedHistory.length > 0) {
      return cachedHistory;
    }

    // 从数据库获取
    try {
      const { data, error } = await supabase
        .from('yt_user_behavior')
        .select('*')
        .eq('fingerprint', fingerprint)
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 最近7天
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Failed to fetch behavior history:', error);
        return [];
      }

      const history = data?.map(record => ({
        fingerprint: record.fingerprint,
        userId: record.user_id,
        sessionId: record.session_id,
        eventType: record.event_type as UserBehaviorEvent,
        eventData: JSON.parse(record.event_data || '{}'),
        timestamp: new Date(record.timestamp),
        deviceInfo: JSON.parse(record.device_info || '{}'),
      })) || [];

      // 缓存到内存
      this.behaviorHistory.set(fingerprint, history);
      return history;
    } catch (error) {
      console.error('Failed to fetch behavior history:', error);
      return [];
    }
  }

  /**
   * 计算用户参与度评分
   */
  private static calculateEngagementScore(
    history: UserBehaviorData[],
    context: any
  ): number {
    const recentHistory = history.filter(
      event => Date.now() - event.timestamp.getTime() < 30 * 60 * 1000 // 最近30分钟
    );

    if (recentHistory.length === 0) return 0;

    // 计算各种参与度指标
    const uniquePages = new Set(recentHistory.map(e => e.eventData?.page)).size;
    const featureInteractions = recentHistory.filter(e => 
      ['feature_click', 'search', 'export_attempt', 'save_attempt'].includes(e.eventType)
    ).length;
    
    const scrollEvents = recentHistory.filter(e => e.eventType === 'scroll');
    const maxScrollDepth = Math.max(...scrollEvents.map(e => e.eventData?.scrollDepth || 0), 0);
    
    const sessionTime = context.sessionDuration;

    // 归一化评分
    const pageScore = Math.min(uniquePages / 5, 1); // 最多5个页面得满分
    const interactionScore = Math.min(featureInteractions / 10, 1); // 最多10次交互得满分
    const scrollScore = maxScrollDepth; // 已经是0-1之间
    const timeScore = Math.min(sessionTime / 300000, 1); // 5分钟得满分

    return (pageScore * 0.25 + interactionScore * 0.35 + scrollScore * 0.2 + timeScore * 0.2);
  }

  /**
   * 计算用户意图评分
   */
  private static calculateIntentScore(
    history: UserBehaviorData[],
    context: any
  ): number {
    const recentHistory = history.filter(
      event => Date.now() - event.timestamp.getTime() < 10 * 60 * 1000 // 最近10分钟
    );

    // 高意图行为
    const highIntentActions = recentHistory.filter(e => 
      ['save_attempt', 'export_attempt', 'share_attempt'].includes(e.eventType)
    ).length;

    // 中等意图行为
    const mediumIntentActions = recentHistory.filter(e => 
      ['search', 'feature_click'].includes(e.eventType)
    ).length;

    // 试用剩余情况
    const trialUrgency = context.trialRemaining <= 2 ? 0.8 : 
                        context.trialRemaining <= 5 ? 0.5 : 0.2;

    // 综合意图评分
    const actionScore = Math.min((highIntentActions * 0.8 + mediumIntentActions * 0.3) / 5, 1);
    
    return Math.min(actionScore + trialUrgency * 0.3, 1);
  }

  /**
   * 计算用户挫折感评分
   */
  private static calculateFrustrationScore(
    history: UserBehaviorData[],
    context: any
  ): number {
    const recentHistory = history.filter(
      event => Date.now() - event.timestamp.getTime() < 5 * 60 * 1000 // 最近5分钟
    );

    // 挫折感指标
    const rapidClicks = this.detectRapidClicks(recentHistory);
    const backAndForth = this.detectBackAndForthNavigation(recentHistory);
    const idleTime = recentHistory.filter(e => e.eventType === 'idle_start').length;
    const repeatActions = this.detectRepeatActions(recentHistory);

    // 归一化评分
    const clickScore = Math.min(rapidClicks / 5, 1);
    const navigationScore = Math.min(backAndForth / 3, 1);
    const idleScore = Math.min(idleTime / 2, 1);
    const repeatScore = Math.min(repeatActions / 3, 1);

    return (clickScore * 0.3 + navigationScore * 0.25 + idleScore * 0.2 + repeatScore * 0.25);
  }

  /**
   * 计算时间花费评分
   */
  private static calculateTimeSpentScore(sessionDuration: number): number {
    // 时间花费的最优区间是2-10分钟
    const optimalMin = 2 * 60 * 1000; // 2分钟
    const optimalMax = 10 * 60 * 1000; // 10分钟

    if (sessionDuration < optimalMin) {
      return sessionDuration / optimalMin; // 线性增长到最优区间
    } else if (sessionDuration <= optimalMax) {
      return 1; // 最优区间内得满分
    } else {
      // 超过最优区间后逐渐降低
      const excess = sessionDuration - optimalMax;
      const maxExcess = 20 * 60 * 1000; // 20分钟后降到最低
      return Math.max(1 - (excess / maxExcess), 0.3);
    }
  }

  /**
   * 计算行为模式评分
   */
  private static calculateActionPatternScore(
    history: UserBehaviorData[],
    context: any
  ): number {
    const pattern = this.identifyBehaviorPattern(history);
    
    // 根据不同模式调整评分
    switch (pattern.patternType) {
      case 'goal_oriented':
        return 0.9; // 目标导向用户更容易转化
      case 'power_user':
        return 0.8; // 高级用户也容易转化
      case 'explorer':
        return 0.6; // 探索型用户需要更多引导
      case 'casual':
        return 0.4; // 随意用户转化率较低
      default:
        return 0.5;
    }
  }

  /**
   * 计算综合评分
   */
  private static calculateOverallScore(factors: LoginTimingPrediction['factors']): number {
    const weights = {
      engagement: 0.25,
      intent: 0.30,
      frustration: -0.15, // 挫折感是负面因子
      timeSpent: 0.20,
      actionPattern: 0.25,
    };

    return Math.max(0, Math.min(1,
      factors.engagementScore * weights.engagement +
      factors.intentScore * weights.intent +
      factors.frustrationScore * weights.frustration +
      factors.timeSpentScore * weights.timeSpent +
      factors.actionPatternScore * weights.actionPattern
    ));
  }

  /**
   * 生成预测结果
   */
  private static generatePrediction(
    overallScore: number,
    factors: LoginTimingPrediction['factors'],
    context: any
  ): LoginTimingPrediction {
    const shouldTrigger = overallScore > 0.6;
    const confidence = overallScore;

    let triggerType: LoginTimingPrediction['suggestedTrigger']['type'] = 'delayed';
    let urgency: LoginTimingPrediction['suggestedTrigger']['urgency'] = 'medium';
    let recommendedDelay = 3000; // 默认3秒延迟
    let reason = '基于用户行为分析的智能推荐';

    // 根据评分调整策略
    if (overallScore > 0.8) {
      triggerType = 'immediate';
      urgency = 'high';
      recommendedDelay = 0;
      reason = '用户显示出强烈的使用意图，建议立即触发登录';
    } else if (overallScore > 0.6) {
      triggerType = 'delayed';
      urgency = 'medium';
      recommendedDelay = 2000;
      reason = '用户参与度较高，建议短暂延迟后触发登录';
    } else if (factors.frustrationScore > 0.7) {
      triggerType = 'exit_intent';
      urgency = 'low';
      recommendedDelay = 0;
      reason = '检测到用户挫折感，建议在退出意图时触发';
    } else {
      triggerType = 'contextual';
      urgency = 'low';
      recommendedDelay = 5000;
      reason = '等待更合适的上下文时机';
    }

    // 试用剩余情况的特殊处理
    if (context.trialRemaining <= 1) {
      urgency = 'high';
      triggerType = 'immediate';
      recommendedDelay = 0;
      reason = '试用即将耗尽，建议立即引导登录';
    }

    return {
      shouldTrigger,
      confidence,
      recommendedDelay,
      reason,
      factors,
      suggestedTrigger: {
        type: triggerType,
        message: this.generateTriggerMessage(triggerType, urgency, context),
        urgency,
      },
    };
  }

  /**
   * 生成触发消息
   */
  private static generateTriggerMessage(
    type: LoginTimingPrediction['suggestedTrigger']['type'],
    urgency: LoginTimingPrediction['suggestedTrigger']['urgency'],
    context: any
  ): string {
    const messages = {
      immediate: {
        high: '立即登录，解锁全部功能！',
        medium: '登录以保存您的进度',
        low: '考虑登录以获得更好体验',
      },
      delayed: {
        high: '即将为您解锁更多功能',
        medium: '登录后可保存和管理您的分析',
        low: '登录可获得更多便利功能',
      },
      contextual: {
        high: '保存这个重要分析需要登录',
        medium: '登录后可访问高级功能',
        low: '登录可享受完整服务',
      },
      exit_intent: {
        high: '等等！登录后可保存您的工作',
        medium: '离开前考虑保存您的进度',
        low: '下次访问时可直接查看历史记录',
      },
    };

    return messages[type][urgency];
  }

  /**
   * 获取默认预测结果
   */
  private static getDefaultPrediction(): LoginTimingPrediction {
    return {
      shouldTrigger: false,
      confidence: 0.5,
      recommendedDelay: 5000,
      reason: '使用默认策略',
      factors: {
        engagementScore: 0.5,
        intentScore: 0.5,
        frustrationScore: 0.3,
        timeSpentScore: 0.5,
        actionPatternScore: 0.5,
      },
      suggestedTrigger: {
        type: 'delayed',
        message: '登录以获得更好体验',
        urgency: 'medium',
      },
    };
  }

  /**
   * 检测快速点击
   */
  private static detectRapidClicks(history: UserBehaviorData[]): number {
    const clickEvents = history.filter(e => e.eventType === 'feature_click');
    let rapidClickCount = 0;
    
    for (let i = 1; i < clickEvents.length; i++) {
      const timeDiff = clickEvents[i-1].timestamp.getTime() - clickEvents[i].timestamp.getTime();
      if (timeDiff < 1000) { // 1秒内的连续点击
        rapidClickCount++;
      }
    }
    
    return rapidClickCount;
  }

  /**
   * 检测来回导航
   */
  private static detectBackAndForthNavigation(history: UserBehaviorData[]): number {
    const pageViews = history.filter(e => e.eventType === 'page_view');
    let backAndForthCount = 0;
    
    for (let i = 2; i < pageViews.length; i++) {
      const current = pageViews[i].eventData?.page;
      const previous = pageViews[i-1].eventData?.page;
      const beforePrevious = pageViews[i-2].eventData?.page;
      
      if (current === beforePrevious && current !== previous) {
        backAndForthCount++;
      }
    }
    
    return backAndForthCount;
  }

  /**
   * 检测重复行为
   */
  private static detectRepeatActions(history: UserBehaviorData[]): number {
    const actionCounts = new Map<string, number>();
    
    history.forEach(event => {
      const key = `${event.eventType}:${event.eventData?.feature || event.eventData?.page}`;
      actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
    });
    
    let repeatCount = 0;
    actionCounts.forEach(count => {
      if (count > 3) { // 超过3次的重复行为
        repeatCount += count - 3;
      }
    });
    
    return repeatCount;
  }

  /**
   * 识别行为模式
   */
  private static identifyBehaviorPattern(history: UserBehaviorData[]): BehaviorPattern {
    if (history.length < 5) {
      return {
        patternType: 'casual',
        confidence: 0.5,
        characteristics: {
          averageSessionTime: 0,
          featuresUsed: [],
          navigationPattern: 'random',
          interactionDepth: 'shallow',
        },
      };
    }

    const uniqueFeatures = new Set(history.map(e => e.eventData?.feature).filter(Boolean));
    const uniquePages = new Set(history.map(e => e.eventData?.page).filter(Boolean));
    const avgSessionTime = this.calculateAverageSessionTime(history);
    
    // 特征分析
    const featureUsageRatio = uniqueFeatures.size / Math.max(history.length, 1);
    const pageVariety = uniquePages.size;
    const interactionDepth = this.calculateInteractionDepth(history);
    
    // 模式识别
    if (featureUsageRatio > 0.3 && avgSessionTime > 300000) {
      return {
        patternType: 'power_user',
        confidence: 0.8,
        characteristics: {
          averageSessionTime: avgSessionTime,
          featuresUsed: Array.from(uniqueFeatures),
          navigationPattern: 'focused',
          interactionDepth: 'deep',
        },
      };
    } else if (pageVariety > 5 && interactionDepth > 0.6) {
      return {
        patternType: 'explorer',
        confidence: 0.7,
        characteristics: {
          averageSessionTime: avgSessionTime,
          featuresUsed: Array.from(uniqueFeatures),
          navigationPattern: 'random',
          interactionDepth: 'medium',
        },
      };
    } else if (featureUsageRatio > 0.2 && avgSessionTime > 120000) {
      return {
        patternType: 'goal_oriented',
        confidence: 0.8,
        characteristics: {
          averageSessionTime: avgSessionTime,
          featuresUsed: Array.from(uniqueFeatures),
          navigationPattern: 'linear',
          interactionDepth: 'medium',
        },
      };
    } else {
      return {
        patternType: 'casual',
        confidence: 0.6,
        characteristics: {
          averageSessionTime: avgSessionTime,
          featuresUsed: Array.from(uniqueFeatures),
          navigationPattern: 'random',
          interactionDepth: 'shallow',
        },
      };
    }
  }

  /**
   * 计算平均会话时间
   */
  private static calculateAverageSessionTime(history: UserBehaviorData[]): number {
    const sessions = new Map<string, { start: number; end: number }>();
    
    history.forEach(event => {
      const sessionId = event.sessionId;
      const timestamp = event.timestamp.getTime();
      
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { start: timestamp, end: timestamp });
      } else {
        const session = sessions.get(sessionId)!;
        session.start = Math.min(session.start, timestamp);
        session.end = Math.max(session.end, timestamp);
      }
    });
    
    const sessionDurations = Array.from(sessions.values()).map(s => s.end - s.start);
    return sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;
  }

  /**
   * 计算交互深度
   */
  private static calculateInteractionDepth(history: UserBehaviorData[]): number {
    const deepInteractions = history.filter(e => 
      ['save_attempt', 'export_attempt', 'search', 'share_attempt'].includes(e.eventType)
    ).length;
    
    const totalInteractions = history.filter(e => 
      ['feature_click', 'page_view', 'scroll'].includes(e.eventType)
    ).length;
    
    return totalInteractions > 0 ? deepInteractions / totalInteractions : 0;
  }

  /**
   * 获取实时推荐
   */
  static async getRealtimeRecommendation(
    fingerprint: string,
    currentContext: any
  ): Promise<{
    shouldShow: boolean;
    timing: 'now' | 'soon' | 'later' | 'never';
    confidence: number;
    message: string;
  }> {
    const prediction = await this.predictOptimalTiming(fingerprint, currentContext);
    
    let timing: 'now' | 'soon' | 'later' | 'never' = 'later';
    
    if (prediction.shouldTrigger) {
      if (prediction.suggestedTrigger.type === 'immediate') {
        timing = 'now';
      } else if (prediction.recommendedDelay < 5000) {
        timing = 'soon';
      } else {
        timing = 'later';
      }
    } else {
      timing = 'never';
    }
    
    return {
      shouldShow: prediction.shouldTrigger,
      timing,
      confidence: prediction.confidence,
      message: prediction.suggestedTrigger.message,
    };
  }
}

// 行为跟踪工具函数
export function trackUserBehavior(
  eventType: UserBehaviorEvent,
  fingerprint: string,
  sessionId: string,
  eventData?: any,
  userId?: string
): void {
  const behaviorData: UserBehaviorData = {
    fingerprint,
    userId,
    sessionId,
    eventType,
    eventData,
    timestamp: new Date(),
    deviceInfo: {
      type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
               navigator.userAgent.includes('Firefox') ? 'Firefox' : 
               navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
      os: navigator.platform,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
      },
    },
  };

  // 异步记录，不阻塞用户操作
  SmartTimingEngine.recordBehavior(behaviorData).catch(error => {
    console.warn('Failed to track user behavior:', error);
  });
}