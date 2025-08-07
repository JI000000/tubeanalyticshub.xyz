/**
 * 动态优化系统 - 基于实时数据自动优化登录按钮和样式
 * 使用机器学习算法和用户行为分析来动态调整UI元素
 */

import { createClient } from '@supabase/supabase-js';
import { ABTestManager, type ABTestVariant } from './ab-testing';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 优化目标类型
export type OptimizationTarget = 
  | 'conversion_rate'
  | 'click_through_rate'
  | 'engagement_time'
  | 'user_satisfaction';

// 按钮样式配置
export interface ButtonStyleConfig {
  color: string;
  backgroundColor: string;
  borderColor?: string;
  borderRadius: number;
  fontSize: number;
  fontWeight: number;
  padding: {
    x: number;
    y: number;
  };
  shadow?: string;
  hoverEffect?: {
    backgroundColor?: string;
    transform?: string;
    shadow?: string;
  };
}

// 动态优化配置
export interface DynamicOptimizationConfig {
  target: OptimizationTarget;
  learningRate: number; // 学习率
  explorationRate: number; // 探索率（epsilon-greedy）
  minSampleSize: number; // 最小样本量
  confidenceThreshold: number; // 置信度阈值
  updateInterval: number; // 更新间隔（毫秒）
}

// 优化候选项
export interface OptimizationCandidate {
  id: string;
  name: string;
  config: {
    buttonStyle?: ButtonStyleConfig;
    textContent?: {
      title?: string;
      message?: string;
      buttonText?: string;
    };
    timing?: {
      delay?: number;
      threshold?: number;
    };
    personalization?: {
      userType?: string;
      deviceType?: string;
      timeOfDay?: string;
    };
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    score: number; // 综合评分
    confidence: number; // 置信度
  };
}

// 用户上下文信息
export interface UserContext {
  fingerprint: string;
  userId?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browserType: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userType: 'new' | 'returning';
  previousInteractions: number;
  trialRemaining: number;
  sessionDuration: number;
  referrer?: string;
  location?: {
    country?: string;
    timezone?: string;
  };
}

// 多臂老虎机算法实现
class MultiArmedBandit {
  private candidates: Map<string, OptimizationCandidate> = new Map();
  private config: DynamicOptimizationConfig;

  constructor(config: DynamicOptimizationConfig) {
    this.config = config;
  }

  /**
   * 添加优化候选项
   */
  addCandidate(candidate: OptimizationCandidate): void {
    this.candidates.set(candidate.id, candidate);
  }

  /**
   * 使用UCB1算法选择最优候选项
   */
  selectCandidate(totalTrials: number): OptimizationCandidate | null {
    if (this.candidates.size === 0) return null;

    let bestCandidate: OptimizationCandidate | null = null;
    let bestScore = -Infinity;

    for (const candidate of this.candidates.values()) {
      // 如果样本量不足，优先选择
      if (candidate.performance.impressions < this.config.minSampleSize) {
        return candidate;
      }

      // 计算UCB1分数
      const avgReward = this.calculateReward(candidate);
      const confidence = Math.sqrt(
        (2 * Math.log(totalTrials)) / candidate.performance.impressions
      );
      const ucbScore = avgReward + confidence;

      if (ucbScore > bestScore) {
        bestScore = ucbScore;
        bestCandidate = candidate;
      }
    }

    // Epsilon-greedy探索
    if (Math.random() < this.config.explorationRate) {
      const candidateArray = Array.from(this.candidates.values());
      return candidateArray[Math.floor(Math.random() * candidateArray.length)];
    }

    return bestCandidate;
  }

  /**
   * 计算候选项的奖励值
   */
  private calculateReward(candidate: OptimizationCandidate): number {
    const { impressions, clicks, conversions } = candidate.performance;
    
    switch (this.config.target) {
      case 'conversion_rate':
        return impressions > 0 ? conversions / impressions : 0;
      case 'click_through_rate':
        return impressions > 0 ? clicks / impressions : 0;
      case 'engagement_time':
        // 这里需要额外的数据来计算参与时间
        return candidate.performance.score;
      case 'user_satisfaction':
        // 基于用户反馈或其他满意度指标
        return candidate.performance.score;
      default:
        return 0;
    }
  }

  /**
   * 更新候选项性能
   */
  updatePerformance(
    candidateId: string, 
    impression: boolean = false,
    click: boolean = false, 
    conversion: boolean = false,
    customScore?: number
  ): void {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) return;

    if (impression) candidate.performance.impressions++;
    if (click) candidate.performance.clicks++;
    if (conversion) candidate.performance.conversions++;
    
    if (customScore !== undefined) {
      candidate.performance.score = customScore;
    }

    // 重新计算置信度
    candidate.performance.confidence = this.calculateConfidence(candidate);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(candidate: OptimizationCandidate): number {
    const sampleSize = candidate.performance.impressions;
    if (sampleSize < this.config.minSampleSize) return 0;
    
    // 简化的置信度计算
    const maxConfidence = 0.95;
    const growthRate = 0.1;
    return maxConfidence * (1 - Math.exp(-growthRate * sampleSize / this.config.minSampleSize));
  }

  /**
   * 获取最佳候选项
   */
  getBestCandidate(): OptimizationCandidate | null {
    let bestCandidate: OptimizationCandidate | null = null;
    let bestReward = -Infinity;

    for (const candidate of this.candidates.values()) {
      if (candidate.performance.impressions < this.config.minSampleSize) continue;
      if (candidate.performance.confidence < this.config.confidenceThreshold) continue;

      const reward = this.calculateReward(candidate);
      if (reward > bestReward) {
        bestReward = reward;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * 获取所有候选项的性能报告
   */
  getPerformanceReport(): OptimizationCandidate[] {
    return Array.from(this.candidates.values())
      .sort((a, b) => this.calculateReward(b) - this.calculateReward(a));
  }
}

/**
 * 动态优化管理器
 */
export class DynamicOptimizationManager {
  private static bandit: MultiArmedBandit;
  private static config: DynamicOptimizationConfig = {
    target: 'conversion_rate',
    learningRate: 0.1,
    explorationRate: 0.1,
    minSampleSize: 50,
    confidenceThreshold: 0.8,
    updateInterval: 60000, // 1分钟
  };

  /**
   * 初始化动态优化系统
   */
  static async initialize(config?: Partial<DynamicOptimizationConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.bandit = new MultiArmedBandit(this.config);

    // 加载现有的优化候选项
    await this.loadCandidates();

    // 如果没有候选项，创建默认候选项
    if (this.bandit.getPerformanceReport().length === 0) {
      await this.createDefaultCandidates();
    }

    // 启动定期优化更新
    this.startOptimizationLoop();

    console.log('Dynamic optimization system initialized');
  }

  /**
   * 从数据库加载候选项
   */
  private static async loadCandidates(): Promise<void> {
    try {
      const { data: candidates, error } = await supabase
        .from('yt_optimization_candidates')
        .select('*')
        .eq('status', 'active');

      if (error) {
        console.error('Failed to load optimization candidates:', error);
        return;
      }

      candidates?.forEach(candidate => {
        this.bandit.addCandidate({
          id: candidate.id,
          name: candidate.name,
          config: JSON.parse(candidate.config),
          performance: JSON.parse(candidate.performance),
        });
      });

      console.log(`Loaded ${candidates?.length || 0} optimization candidates`);
    } catch (error) {
      console.error('Failed to load optimization candidates:', error);
    }
  }

  /**
   * 创建默认优化候选项
   */
  private static async createDefaultCandidates(): Promise<void> {
    const defaultCandidates: OptimizationCandidate[] = [
      {
        id: 'default_blue',
        name: '默认蓝色按钮',
        config: {
          buttonStyle: {
            color: '#FFFFFF',
            backgroundColor: '#3B82F6',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            padding: { x: 16, y: 8 },
            shadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
          textContent: {
            buttonText: '立即登录',
          },
        },
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          score: 0,
          confidence: 0,
        },
      },
      {
        id: 'green_cta',
        name: '绿色行动按钮',
        config: {
          buttonStyle: {
            color: '#FFFFFF',
            backgroundColor: '#10B981',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            padding: { x: 20, y: 10 },
            shadow: '0 4px 8px rgba(16,185,129,0.3)',
            hoverEffect: {
              backgroundColor: '#059669',
              transform: 'translateY(-1px)',
              shadow: '0 6px 12px rgba(16,185,129,0.4)',
            },
          },
          textContent: {
            buttonText: '免费开始',
          },
        },
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          score: 0,
          confidence: 0,
        },
      },
      {
        id: 'orange_urgent',
        name: '橙色紧急按钮',
        config: {
          buttonStyle: {
            color: '#FFFFFF',
            backgroundColor: '#F59E0B',
            borderRadius: 6,
            fontSize: 15,
            fontWeight: 700,
            padding: { x: 18, y: 9 },
            shadow: '0 3px 6px rgba(245,158,11,0.3)',
          },
          textContent: {
            buttonText: '立即解锁',
          },
        },
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          score: 0,
          confidence: 0,
        },
      },
    ];

    for (const candidate of defaultCandidates) {
      this.bandit.addCandidate(candidate);
      await this.saveCandidateToDatabase(candidate);
    }
  }

  /**
   * 获取最优配置
   */
  static async getOptimalConfig(context: UserContext): Promise<OptimizationCandidate | null> {
    if (!this.bandit) {
      await this.initialize();
    }

    // 考虑个性化因素
    const personalizedCandidates = this.getPersonalizedCandidates(context);
    
    if (personalizedCandidates.length > 0) {
      // 从个性化候选项中选择
      const totalTrials = personalizedCandidates.reduce(
        (sum, c) => sum + c.performance.impressions, 0
      );
      
      // 临时创建个性化bandit
      const personalizedBandit = new MultiArmedBandit(this.config);
      personalizedCandidates.forEach(c => personalizedBandit.addCandidate(c));
      
      return personalizedBandit.selectCandidate(totalTrials);
    }

    // 使用全局最优选择
    const totalTrials = this.bandit.getPerformanceReport()
      .reduce((sum, c) => sum + c.performance.impressions, 0);
    
    return this.bandit.selectCandidate(totalTrials);
  }

  /**
   * 获取个性化候选项
   */
  private static getPersonalizedCandidates(context: UserContext): OptimizationCandidate[] {
    const allCandidates = this.bandit.getPerformanceReport();
    
    return allCandidates.filter(candidate => {
      const personalization = candidate.config.personalization;
      if (!personalization) return true;

      // 检查设备类型匹配
      if (personalization.deviceType && personalization.deviceType !== context.deviceType) {
        return false;
      }

      // 检查用户类型匹配
      if (personalization.userType && personalization.userType !== context.userType) {
        return false;
      }

      // 检查时间段匹配
      if (personalization.timeOfDay && personalization.timeOfDay !== context.timeOfDay) {
        return false;
      }

      return true;
    });
  }

  /**
   * 记录用户交互
   */
  static async recordInteraction(
    candidateId: string,
    interactionType: 'impression' | 'click' | 'conversion',
    context: UserContext,
    customMetrics?: { [key: string]: number }
  ): Promise<void> {
    if (!this.bandit) return;

    // 更新bandit性能
    this.bandit.updatePerformance(
      candidateId,
      interactionType === 'impression',
      interactionType === 'click',
      interactionType === 'conversion',
      customMetrics?.score
    );

    // 记录到数据库
    try {
      await supabase.from('yt_optimization_interactions').insert({
        candidate_id: candidateId,
        interaction_type: interactionType,
        user_context: JSON.stringify(context),
        custom_metrics: JSON.stringify(customMetrics || {}),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to record optimization interaction:', error);
    }

    // 异步更新候选项到数据库
    this.updateCandidateInDatabase(candidateId);
  }

  /**
   * 启动优化循环
   */
  private static startOptimizationLoop(): void {
    setInterval(async () => {
      await this.performOptimizationUpdate();
    }, this.config.updateInterval);
  }

  /**
   * 执行优化更新
   */
  private static async performOptimizationUpdate(): Promise<void> {
    try {
      // 获取最新的交互数据
      const { data: interactions, error } = await supabase
        .from('yt_optimization_interactions')
        .select('*')
        .gte('timestamp', new Date(Date.now() - this.config.updateInterval).toISOString());

      if (error) {
        console.error('Failed to fetch optimization interactions:', error);
        return;
      }

      // 更新候选项性能
      const candidateUpdates = new Map<string, {
        impressions: number;
        clicks: number;
        conversions: number;
      }>();

      interactions?.forEach(interaction => {
        const candidateId = interaction.candidate_id;
        if (!candidateUpdates.has(candidateId)) {
          candidateUpdates.set(candidateId, {
            impressions: 0,
            clicks: 0,
            conversions: 0,
          });
        }

        const updates = candidateUpdates.get(candidateId)!;
        switch (interaction.interaction_type) {
          case 'impression':
            updates.impressions++;
            break;
          case 'click':
            updates.clicks++;
            break;
          case 'conversion':
            updates.conversions++;
            break;
        }
      });

      // 应用更新
      for (const [candidateId, updates] of candidateUpdates) {
        this.bandit.updatePerformance(
          candidateId,
          updates.impressions > 0,
          updates.clicks > 0,
          updates.conversions > 0
        );
      }

      // 检查是否需要创建新的候选项
      await this.considerNewCandidates();

      console.log('Optimization update completed');
    } catch (error) {
      console.error('Failed to perform optimization update:', error);
    }
  }

  /**
   * 考虑创建新的候选项
   */
  private static async considerNewCandidates(): Promise<void> {
    const bestCandidate = this.bandit.getBestCandidate();
    if (!bestCandidate) return;

    const bestReward = this.calculateReward(bestCandidate);
    
    // 如果最佳候选项的性能已经很好，考虑创建变体
    if (bestReward > 0.1 && bestCandidate.performance.confidence > 0.9) {
      await this.createCandidateVariants(bestCandidate);
    }
  }

  /**
   * 创建候选项变体
   */
  private static async createCandidateVariants(
    baseCandidate: OptimizationCandidate
  ): Promise<void> {
    const variants = this.generateVariants(baseCandidate);
    
    for (const variant of variants) {
      this.bandit.addCandidate(variant);
      await this.saveCandidateToDatabase(variant);
    }
  }

  /**
   * 生成候选项变体
   */
  private static generateVariants(
    baseCandidate: OptimizationCandidate
  ): OptimizationCandidate[] {
    const variants: OptimizationCandidate[] = [];
    const baseStyle = baseCandidate.config.buttonStyle;
    
    if (!baseStyle) return variants;

    // 颜色变体
    const colorVariants = ['#EF4444', '#8B5CF6', '#F59E0B'];
    colorVariants.forEach((color, index) => {
      variants.push({
        id: `${baseCandidate.id}_color_${index}`,
        name: `${baseCandidate.name} - 颜色变体 ${index + 1}`,
        config: {
          ...baseCandidate.config,
          buttonStyle: {
            ...baseStyle,
            backgroundColor: color,
          },
        },
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          score: 0,
          confidence: 0,
        },
      });
    });

    // 大小变体
    const sizeVariants = [
      { fontSize: baseStyle.fontSize * 1.1, padding: { x: baseStyle.padding.x * 1.2, y: baseStyle.padding.y * 1.2 } },
      { fontSize: baseStyle.fontSize * 0.9, padding: { x: baseStyle.padding.x * 0.8, y: baseStyle.padding.y * 0.8 } },
    ];
    
    sizeVariants.forEach((sizeConfig, index) => {
      variants.push({
        id: `${baseCandidate.id}_size_${index}`,
        name: `${baseCandidate.name} - 大小变体 ${index + 1}`,
        config: {
          ...baseCandidate.config,
          buttonStyle: {
            ...baseStyle,
            ...sizeConfig,
          },
        },
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          score: 0,
          confidence: 0,
        },
      });
    });

    return variants;
  }

  /**
   * 计算奖励值
   */
  private static calculateReward(candidate: OptimizationCandidate): number {
    const { impressions, clicks, conversions } = candidate.performance;
    
    switch (this.config.target) {
      case 'conversion_rate':
        return impressions > 0 ? conversions / impressions : 0;
      case 'click_through_rate':
        return impressions > 0 ? clicks / impressions : 0;
      default:
        return candidate.performance.score;
    }
  }

  /**
   * 保存候选项到数据库
   */
  private static async saveCandidateToDatabase(candidate: OptimizationCandidate): Promise<void> {
    try {
      await supabase.from('yt_optimization_candidates').upsert({
        id: candidate.id,
        name: candidate.name,
        config: JSON.stringify(candidate.config),
        performance: JSON.stringify(candidate.performance),
        status: 'active',
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save candidate to database:', error);
    }
  }

  /**
   * 更新数据库中的候选项
   */
  private static async updateCandidateInDatabase(candidateId: string): Promise<void> {
    const candidates = this.bandit.getPerformanceReport();
    const candidate = candidates.find(c => c.id === candidateId);
    
    if (candidate) {
      await this.saveCandidateToDatabase(candidate);
    }
  }

  /**
   * 获取优化报告
   */
  static getOptimizationReport(): {
    candidates: OptimizationCandidate[];
    bestCandidate: OptimizationCandidate | null;
    config: DynamicOptimizationConfig;
  } {
    return {
      candidates: this.bandit?.getPerformanceReport() || [],
      bestCandidate: this.bandit?.getBestCandidate() || null,
      config: this.config,
    };
  }
}

// 工具函数：生成用户上下文
export function generateUserContext(
  fingerprint: string,
  additionalData?: Partial<UserContext>
): UserContext {
  const now = new Date();
  const hour = now.getHours();
  
  let timeOfDay: UserContext['timeOfDay'];
  if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';

  return {
    fingerprint,
    deviceType: 'desktop', // 默认值，应该从实际设备检测中获取
    browserType: 'unknown',
    timeOfDay,
    userType: 'new',
    previousInteractions: 0,
    trialRemaining: 5,
    sessionDuration: 0,
    ...additionalData,
  };
}