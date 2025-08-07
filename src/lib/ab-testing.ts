/**
 * A/B测试系统 - 用于登录转化率优化
 * 支持不同登录提示文案、按钮样式、时机的动态测试
 */

import { createClient } from '@supabase/supabase-js';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// A/B测试变体类型
export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 权重，用于分配流量
  config: {
    // 文案变体
    title?: string;
    message?: string;
    buttonText?: string;
    
    // 样式变体
    buttonColor?: string;
    buttonStyle?: 'solid' | 'outline' | 'ghost';
    urgencyLevel?: 'low' | 'medium' | 'high';
    
    // 时机变体
    triggerDelay?: number; // 延迟触发时间（毫秒）
    triggerThreshold?: number; // 触发阈值（如剩余试用次数）
    
    // 个性化变体
    personalizedMessage?: boolean;
    showBenefits?: boolean;
    showUrgency?: boolean;
    
    [key: string]: any;
  };
}

// A/B测试实验配置
export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  targetMetric: 'conversion_rate' | 'click_through_rate' | 'completion_rate';
  variants: ABTestVariant[];
  trafficAllocation: number; // 参与实验的流量百分比
  segmentRules?: {
    userType?: 'new' | 'returning' | 'all';
    deviceType?: 'mobile' | 'desktop' | 'tablet' | 'all';
    triggerType?: string[];
    [key: string]: any;
  };
}

// A/B测试分配结果
export interface ABTestAssignment {
  experimentId: string;
  variantId: string;
  userId?: string;
  fingerprint: string;
  assignedAt: Date;
  metadata?: any;
}

// A/B测试事件记录
export interface ABTestEvent {
  experimentId: string;
  variantId: string;
  userId?: string;
  fingerprint: string;
  eventType: 'impression' | 'click' | 'conversion' | 'skip' | 'error';
  eventData?: any;
  timestamp: Date;
}

// A/B测试结果统计
export interface ABTestResults {
  experimentId: string;
  variants: Array<{
    variantId: string;
    name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    clickThroughRate: number;
    conversionRate: number;
    confidenceLevel: number;
    isWinner?: boolean;
    statisticalSignificance?: number;
  }>;
  overallStats: {
    totalImpressions: number;
    totalConversions: number;
    averageConversionRate: number;
    experimentDuration: number;
  };
}

/**
 * A/B测试管理器
 */
export class ABTestManager {
  private static experiments: Map<string, ABTestExperiment> = new Map();
  private static assignments: Map<string, ABTestAssignment> = new Map();

  /**
   * 初始化A/B测试系统
   */
  static async initialize(): Promise<void> {
    try {
      // 从数据库加载活跃的实验
      const { data: experiments, error } = await supabase
        .from('yt_ab_experiments')
        .select('*')
        .eq('status', 'running');

      if (error) {
        console.error('Failed to load AB experiments:', error);
        return;
      }

      // 缓存实验配置
      experiments?.forEach(exp => {
        this.experiments.set(exp.id, {
          ...exp,
          startDate: new Date(exp.start_date),
          endDate: exp.end_date ? new Date(exp.end_date) : undefined,
          variants: JSON.parse(exp.variants || '[]'),
          segmentRules: JSON.parse(exp.segment_rules || '{}'),
        });
      });

      console.log(`Loaded ${experiments?.length || 0} AB experiments`);
    } catch (error) {
      console.error('Failed to initialize AB testing:', error);
    }
  }

  /**
   * 获取用户的实验分配
   */
  static async getAssignment(
    experimentId: string,
    fingerprint: string,
    userId?: string,
    context?: any
  ): Promise<ABTestVariant | null> {
    try {
      const experiment = this.experiments.get(experimentId);
      if (!experiment || experiment.status !== 'running') {
        return null;
      }

      // 检查实验是否过期
      if (experiment.endDate && new Date() > experiment.endDate) {
        return null;
      }

      // 检查用户是否符合分段规则
      if (!this.matchesSegmentRules(experiment.segmentRules, context)) {
        return null;
      }

      // 检查是否已有分配
      const assignmentKey = `${experimentId}:${fingerprint}`;
      let assignment = this.assignments.get(assignmentKey);

      if (!assignment) {
        // 检查数据库中的分配
        const { data: dbAssignment } = await supabase
          .from('yt_ab_assignments')
          .select('*')
          .eq('experiment_id', experimentId)
          .eq('fingerprint', fingerprint)
          .single();

        if (dbAssignment) {
          assignment = {
            experimentId: dbAssignment.experiment_id,
            variantId: dbAssignment.variant_id,
            userId: dbAssignment.user_id,
            fingerprint: dbAssignment.fingerprint,
            assignedAt: new Date(dbAssignment.assigned_at),
            metadata: JSON.parse(dbAssignment.metadata || '{}'),
          };
          this.assignments.set(assignmentKey, assignment);
        }
      }

      if (!assignment) {
        // 创建新分配
        const newAssignment = await this.createAssignment(experiment, fingerprint, userId, context);
        if (!newAssignment) return null;
        assignment = newAssignment;
      }

      // 返回对应的变体
      const variant = experiment.variants.find(v => v.id === assignment!.variantId);
      return variant || null;
    } catch (error) {
      console.error('Failed to get AB assignment:', error);
      return null;
    }
  }

  /**
   * 创建新的实验分配
   */
  private static async createAssignment(
    experiment: ABTestExperiment,
    fingerprint: string,
    userId?: string,
    context?: any
  ): Promise<ABTestAssignment | null> {
    try {
      // 检查流量分配
      const random = Math.random();
      if (random > experiment.trafficAllocation / 100) {
        return null; // 不参与实验
      }

      // 根据权重选择变体
      const variant = this.selectVariantByWeight(experiment.variants, fingerprint);
      if (!variant) return null;

      const assignment: ABTestAssignment = {
        experimentId: experiment.id,
        variantId: variant.id,
        userId,
        fingerprint,
        assignedAt: new Date(),
        metadata: context,
      };

      // 保存到数据库
      const { error } = await supabase
        .from('yt_ab_assignments')
        .insert({
          experiment_id: assignment.experimentId,
          variant_id: assignment.variantId,
          user_id: assignment.userId,
          fingerprint: assignment.fingerprint,
          assigned_at: assignment.assignedAt.toISOString(),
          metadata: JSON.stringify(assignment.metadata || {}),
        });

      if (error) {
        console.error('Failed to save AB assignment:', error);
        return null;
      }

      // 缓存分配
      const assignmentKey = `${experiment.id}:${fingerprint}`;
      this.assignments.set(assignmentKey, assignment);

      return assignment;
    } catch (error) {
      console.error('Failed to create AB assignment:', error);
      return null;
    }
  }

  /**
   * 根据权重选择变体
   */
  private static selectVariantByWeight(
    variants: ABTestVariant[],
    fingerprint: string
  ): ABTestVariant | null {
    if (variants.length === 0) return null;

    // 使用指纹生成稳定的随机数
    const hash = this.hashString(fingerprint);
    const random = (hash % 10000) / 10000; // 0-1之间的稳定随机数

    // 计算累积权重
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let cumulativeWeight = 0;

    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight / totalWeight) {
        return variant;
      }
    }

    // 默认返回第一个变体
    return variants[0];
  }

  /**
   * 字符串哈希函数
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 检查是否匹配分段规则
   */
  private static matchesSegmentRules(
    rules?: ABTestExperiment['segmentRules'],
    context?: any
  ): boolean {
    if (!rules) return true;

    // 检查用户类型
    if (rules.userType && rules.userType !== 'all') {
      const isNewUser = context?.isNewUser || false;
      if (rules.userType === 'new' && !isNewUser) return false;
      if (rules.userType === 'returning' && isNewUser) return false;
    }

    // 检查设备类型
    if (rules.deviceType && rules.deviceType !== 'all') {
      const deviceType = context?.deviceType || 'desktop';
      if (rules.deviceType !== deviceType) return false;
    }

    // 检查触发类型
    if (rules.triggerType && rules.triggerType.length > 0) {
      const triggerType = context?.triggerType;
      if (!triggerType || !rules.triggerType.includes(triggerType)) return false;
    }

    return true;
  }

  /**
   * 记录A/B测试事件
   */
  static async recordEvent(
    experimentId: string,
    variantId: string,
    eventType: ABTestEvent['eventType'],
    fingerprint: string,
    userId?: string,
    eventData?: any
  ): Promise<void> {
    try {
      const event: ABTestEvent = {
        experimentId,
        variantId,
        userId,
        fingerprint,
        eventType,
        eventData,
        timestamp: new Date(),
      };

      // 保存到数据库
      const { error } = await supabase
        .from('yt_ab_events')
        .insert({
          experiment_id: event.experimentId,
          variant_id: event.variantId,
          user_id: event.userId,
          fingerprint: event.fingerprint,
          event_type: event.eventType,
          event_data: JSON.stringify(event.eventData || {}),
          timestamp: event.timestamp.toISOString(),
        });

      if (error) {
        console.error('Failed to record AB event:', error);
      }
    } catch (error) {
      console.error('Failed to record AB event:', error);
    }
  }

  /**
   * 获取实验结果
   */
  static async getExperimentResults(experimentId: string): Promise<ABTestResults | null> {
    try {
      const experiment = this.experiments.get(experimentId);
      if (!experiment) return null;

      // 获取事件数据
      const { data: events, error } = await supabase
        .from('yt_ab_events')
        .select('variant_id, event_type')
        .eq('experiment_id', experimentId);

      if (error) {
        console.error('Failed to get AB results:', error);
        return null;
      }

      // 统计各变体的表现
      const variantStats = new Map<string, {
        impressions: number;
        clicks: number;
        conversions: number;
      }>();

      // 初始化统计
      experiment.variants.forEach(variant => {
        variantStats.set(variant.id, {
          impressions: 0,
          clicks: 0,
          conversions: 0,
        });
      });

      // 计算统计数据
      events?.forEach(event => {
        const stats = variantStats.get(event.variant_id);
        if (!stats) return;

        switch (event.event_type) {
          case 'impression':
            stats.impressions++;
            break;
          case 'click':
            stats.clicks++;
            break;
          case 'conversion':
            stats.conversions++;
            break;
        }
      });

      // 构建结果
      const variants = experiment.variants.map(variant => {
        const stats = variantStats.get(variant.id)!;
        const clickThroughRate = stats.impressions > 0 
          ? (stats.clicks / stats.impressions) * 100 
          : 0;
        const conversionRate = stats.impressions > 0 
          ? (stats.conversions / stats.impressions) * 100 
          : 0;

        return {
          variantId: variant.id,
          name: variant.name,
          impressions: stats.impressions,
          clicks: stats.clicks,
          conversions: stats.conversions,
          clickThroughRate,
          conversionRate,
          confidenceLevel: this.calculateConfidenceLevel(stats, variantStats),
          statisticalSignificance: this.calculateStatisticalSignificance(stats, variantStats),
          isWinner: false,
        };
      });

      // 确定获胜者
      const winner = variants.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );
      winner.isWinner = true;

      // 计算总体统计
      const totalImpressions = Array.from(variantStats.values())
        .reduce((sum, stats) => sum + stats.impressions, 0);
      const totalConversions = Array.from(variantStats.values())
        .reduce((sum, stats) => sum + stats.conversions, 0);
      const averageConversionRate = totalImpressions > 0 
        ? (totalConversions / totalImpressions) * 100 
        : 0;
      const experimentDuration = experiment.endDate 
        ? experiment.endDate.getTime() - experiment.startDate.getTime()
        : Date.now() - experiment.startDate.getTime();

      return {
        experimentId,
        variants,
        overallStats: {
          totalImpressions,
          totalConversions,
          averageConversionRate,
          experimentDuration: Math.floor(experimentDuration / (1000 * 60 * 60 * 24)), // 天数
        },
      };
    } catch (error) {
      console.error('Failed to get experiment results:', error);
      return null;
    }
  }

  /**
   * 计算置信水平（简化版本）
   */
  private static calculateConfidenceLevel(
    variantStats: { impressions: number; conversions: number },
    allStats: Map<string, { impressions: number; conversions: number }>
  ): number {
    // 简化的置信水平计算
    // 实际应用中应该使用更复杂的统计方法
    const sampleSize = variantStats.impressions;
    if (sampleSize < 100) return 0;
    if (sampleSize < 500) return 85;
    if (sampleSize < 1000) return 90;
    return 95;
  }

  /**
   * 计算统计显著性（简化版本）
   */
  private static calculateStatisticalSignificance(
    variantStats: { impressions: number; conversions: number },
    allStats: Map<string, { impressions: number; conversions: number }>
  ): number {
    // 简化的统计显著性计算
    // 实际应用中应该使用卡方检验或t检验
    const conversionRate = variantStats.impressions > 0 
      ? variantStats.conversions / variantStats.impressions 
      : 0;
    
    // 计算与其他变体的差异
    const otherRates = Array.from(allStats.values())
      .filter(stats => stats !== variantStats)
      .map(stats => stats.impressions > 0 ? stats.conversions / stats.impressions : 0);
    
    if (otherRates.length === 0) return 0;
    
    const avgOtherRate = otherRates.reduce((sum, rate) => sum + rate, 0) / otherRates.length;
    const difference = Math.abs(conversionRate - avgOtherRate);
    
    // 简化的显著性评分
    if (difference > 0.1) return 99; // 10%以上差异
    if (difference > 0.05) return 95; // 5%以上差异
    if (difference > 0.02) return 90; // 2%以上差异
    return 0;
  }

  /**
   * 创建新实验
   */
  static async createExperiment(experiment: Omit<ABTestExperiment, 'id'>): Promise<string | null> {
    try {
      const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('yt_ab_experiments')
        .insert({
          id,
          name: experiment.name,
          description: experiment.description,
          status: experiment.status,
          start_date: experiment.startDate.toISOString(),
          end_date: experiment.endDate?.toISOString(),
          target_metric: experiment.targetMetric,
          variants: JSON.stringify(experiment.variants),
          traffic_allocation: experiment.trafficAllocation,
          segment_rules: JSON.stringify(experiment.segmentRules || {}),
        });

      if (error) {
        console.error('Failed to create experiment:', error);
        return null;
      }

      // 缓存实验
      this.experiments.set(id, { ...experiment, id });
      
      return id;
    } catch (error) {
      console.error('Failed to create experiment:', error);
      return null;
    }
  }

  /**
   * 更新实验状态
   */
  static async updateExperimentStatus(
    experimentId: string, 
    status: ABTestExperiment['status']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('yt_ab_experiments')
        .update({ status })
        .eq('id', experimentId);

      if (error) {
        console.error('Failed to update experiment status:', error);
        return false;
      }

      // 更新缓存
      const experiment = this.experiments.get(experimentId);
      if (experiment) {
        experiment.status = status;
      }

      return true;
    } catch (error) {
      console.error('Failed to update experiment status:', error);
      return false;
    }
  }
}

// 预定义的A/B测试实验模板
export const AB_TEST_TEMPLATES = {
  // 登录文案测试
  LOGIN_COPY_TEST: {
    name: '登录提示文案优化',
    description: '测试不同的登录提示文案对转化率的影响',
    targetMetric: 'conversion_rate' as const,
    variants: [
      {
        id: 'control',
        name: '控制组',
        weight: 50,
        config: {
          title: '登录以继续',
          message: '登录后可享受完整功能',
          buttonText: '立即登录',
        },
      },
      {
        id: 'benefit_focused',
        name: '权益导向',
        weight: 50,
        config: {
          title: '解锁全部功能',
          message: '登录后可获得无限分析次数和高级功能',
          buttonText: '免费解锁',
        },
      },
    ],
  },

  // 按钮样式测试
  BUTTON_STYLE_TEST: {
    name: '登录按钮样式优化',
    description: '测试不同按钮颜色和样式的转化效果',
    targetMetric: 'click_through_rate' as const,
    variants: [
      {
        id: 'blue_solid',
        name: '蓝色实心',
        weight: 33,
        config: {
          buttonColor: '#3B82F6',
          buttonStyle: 'solid',
        },
      },
      {
        id: 'green_solid',
        name: '绿色实心',
        weight: 33,
        config: {
          buttonColor: '#10B981',
          buttonStyle: 'solid',
        },
      },
      {
        id: 'red_solid',
        name: '红色实心',
        weight: 34,
        config: {
          buttonColor: '#EF4444',
          buttonStyle: 'solid',
        },
      },
    ],
  },

  // 紧急程度测试
  URGENCY_TEST: {
    name: '紧急程度优化',
    description: '测试不同紧急程度对用户行为的影响',
    targetMetric: 'conversion_rate' as const,
    variants: [
      {
        id: 'low_urgency',
        name: '低紧急',
        weight: 33,
        config: {
          urgencyLevel: 'low',
          showUrgency: false,
        },
      },
      {
        id: 'medium_urgency',
        name: '中等紧急',
        weight: 33,
        config: {
          urgencyLevel: 'medium',
          showUrgency: true,
        },
      },
      {
        id: 'high_urgency',
        name: '高紧急',
        weight: 34,
        config: {
          urgencyLevel: 'high',
          showUrgency: true,
        },
      },
    ],
  },
};