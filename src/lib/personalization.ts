/**
 * 个性化登录引导系统
 * 基于用户行为分析提供个性化的登录引导体验
 */

import { createClient } from '@supabase/supabase-js';
import { SmartTimingEngine, type UserBehaviorData } from './smart-timing';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 用户画像类型
export interface UserPersona {
  id: string;
  name: string;
  description: string;
  characteristics: {
    sessionDuration: { min: number; max: number };
    interactionFrequency: 'low' | 'medium' | 'high';
    featureUsage: string[];
    devicePreference: 'mobile' | 'desktop' | 'both';
    timeOfDayPattern: string[];
    conversionLikelihood: number; // 0-1
  };
  guidanceStrategy: {
    preferredTiming: 'immediate' | 'delayed' | 'contextual';
    messageStyle: 'direct' | 'benefit-focused' | 'urgency-based' | 'friendly';
    visualStyle: 'minimal' | 'rich' | 'animated';
    interactionLevel: 'passive' | 'interactive' | 'gamified';
  };
}

// 个性化内容配置
export interface PersonalizedContent {
  title: string;
  message: string;
  buttonText: string;
  benefits: string[];
  visualElements: {
    icon?: string;
    color?: string;
    animation?: string;
    illustration?: string;
  };
  interactiveElements?: {
    progressBar?: boolean;
    countdown?: boolean;
    socialProof?: boolean;
    testimonials?: boolean;
  };
}

// 引导步骤
export interface GuidanceStep {
  id: string;
  type: 'tooltip' | 'modal' | 'banner' | 'inline' | 'overlay';
  trigger: 'immediate' | 'scroll' | 'hover' | 'click' | 'time-based';
  content: PersonalizedContent;
  position?: {
    target?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  };
  conditions?: {
    minSessionTime?: number;
    maxTrialRemaining?: number;
    requiredActions?: string[];
  };
}

// 预定义用户画像
const USER_PERSONAS: UserPersona[] = [
  {
    id: 'power_user',
    name: '高级用户',
    description: '经验丰富，使用多种功能，会话时间长',
    characteristics: {
      sessionDuration: { min: 300000, max: 1800000 }, // 5-30分钟
      interactionFrequency: 'high',
      featureUsage: ['advanced_analytics', 'export_data', 'api_access'],
      devicePreference: 'desktop',
      timeOfDayPattern: ['morning', 'afternoon'],
      conversionLikelihood: 0.8,
    },
    guidanceStrategy: {
      preferredTiming: 'contextual',
      messageStyle: 'direct',
      visualStyle: 'minimal',
      interactionLevel: 'passive',
    },
  },
  {
    id: 'casual_explorer',
    name: '休闲探索者',
    description: '偶尔使用，喜欢探索不同功能',
    characteristics: {
      sessionDuration: { min: 60000, max: 300000 }, // 1-5分钟
      interactionFrequency: 'medium',
      featureUsage: ['video_analysis', 'basic_report'],
      devicePreference: 'both',
      timeOfDayPattern: ['evening', 'night'],
      conversionLikelihood: 0.4,
    },
    guidanceStrategy: {
      preferredTiming: 'delayed',
      messageStyle: 'benefit-focused',
      visualStyle: 'rich',
      interactionLevel: 'interactive',
    },
  },
  {
    id: 'goal_oriented',
    name: '目标导向用户',
    description: '有明确目标，快速完成任务',
    characteristics: {
      sessionDuration: { min: 120000, max: 600000 }, // 2-10分钟
      interactionFrequency: 'medium',
      featureUsage: ['save_report', 'export_data'],
      devicePreference: 'desktop',
      timeOfDayPattern: ['morning', 'afternoon'],
      conversionLikelihood: 0.7,
    },
    guidanceStrategy: {
      preferredTiming: 'immediate',
      messageStyle: 'urgency-based',
      visualStyle: 'minimal',
      interactionLevel: 'passive',
    },
  },
  {
    id: 'mobile_first',
    name: '移动优先用户',
    description: '主要使用移动设备，短时间会话',
    characteristics: {
      sessionDuration: { min: 30000, max: 180000 }, // 30秒-3分钟
      interactionFrequency: 'low',
      featureUsage: ['video_analysis'],
      devicePreference: 'mobile',
      timeOfDayPattern: ['morning', 'evening'],
      conversionLikelihood: 0.3,
    },
    guidanceStrategy: {
      preferredTiming: 'immediate',
      messageStyle: 'friendly',
      visualStyle: 'animated',
      interactionLevel: 'gamified',
    },
  },
  {
    id: 'trial_maximizer',
    name: '试用最大化用户',
    description: '充分利用试用期，延迟登录',
    characteristics: {
      sessionDuration: { min: 180000, max: 900000 }, // 3-15分钟
      interactionFrequency: 'high',
      featureUsage: ['video_analysis', 'basic_report', 'save_attempt'],
      devicePreference: 'both',
      timeOfDayPattern: ['afternoon', 'evening'],
      conversionLikelihood: 0.6,
    },
    guidanceStrategy: {
      preferredTiming: 'contextual',
      messageStyle: 'benefit-focused',
      visualStyle: 'rich',
      interactionLevel: 'interactive',
    },
  },
];

/**
 * 个性化引导管理器
 */
export class PersonalizationManager {
  private static userPersonas: Map<string, UserPersona> = new Map();
  private static personalizedContent: Map<string, PersonalizedContent[]> = new Map();

  /**
   * 初始化个性化系统
   */
  static async initialize(): Promise<void> {
    // 加载预定义画像
    USER_PERSONAS.forEach(persona => {
      this.userPersonas.set(persona.id, persona);
    });

    // 生成个性化内容
    await this.generatePersonalizedContent();

    console.log('Personalization system initialized');
  }

  /**
   * 识别用户画像
   */
  static async identifyUserPersona(
    fingerprint: string,
    behaviorHistory: UserBehaviorData[],
    currentContext: {
      sessionDuration: number;
      deviceType: 'mobile' | 'desktop' | 'tablet';
      timeOfDay: string;
      featuresUsed: string[];
      trialRemaining: number;
    }
  ): Promise<UserPersona> {
    try {
      // 计算与各个画像的匹配度
      const scores = new Map<string, number>();

      for (const persona of this.userPersonas.values()) {
        const score = this.calculatePersonaScore(persona, behaviorHistory, currentContext);
        scores.set(persona.id, score);
      }

      // 找到最匹配的画像
      let bestPersona = USER_PERSONAS[0];
      let bestScore = 0;

      for (const [personaId, score] of scores) {
        if (score > bestScore) {
          bestScore = score;
          bestPersona = this.userPersonas.get(personaId) || bestPersona;
        }
      }

      // 保存用户画像识别结果
      await this.savePersonaIdentification(fingerprint, bestPersona.id, bestScore);

      return bestPersona;
    } catch (error) {
      console.error('Failed to identify user persona:', error);
      return USER_PERSONAS[1]; // 默认返回休闲探索者
    }
  }

  /**
   * 计算画像匹配分数
   */
  private static calculatePersonaScore(
    persona: UserPersona,
    behaviorHistory: UserBehaviorData[],
    currentContext: any
  ): number {
    let score = 0;
    let totalWeight = 0;

    // 会话时长匹配 (权重: 0.25)
    const sessionWeight = 0.25;
    const sessionScore = this.calculateSessionDurationScore(
      persona.characteristics.sessionDuration,
      currentContext.sessionDuration
    );
    score += sessionScore * sessionWeight;
    totalWeight += sessionWeight;

    // 设备偏好匹配 (权重: 0.15)
    const deviceWeight = 0.15;
    const deviceScore = this.calculateDeviceScore(
      persona.characteristics.devicePreference,
      currentContext.deviceType
    );
    score += deviceScore * deviceWeight;
    totalWeight += deviceWeight;

    // 功能使用匹配 (权重: 0.3)
    const featureWeight = 0.3;
    const featureScore = this.calculateFeatureUsageScore(
      persona.characteristics.featureUsage,
      currentContext.featuresUsed
    );
    score += featureScore * featureWeight;
    totalWeight += featureWeight;

    // 时间模式匹配 (权重: 0.1)
    const timeWeight = 0.1;
    const timeScore = persona.characteristics.timeOfDayPattern.includes(currentContext.timeOfDay) ? 1 : 0;
    score += timeScore * timeWeight;
    totalWeight += timeWeight;

    // 交互频率匹配 (权重: 0.2)
    const interactionWeight = 0.2;
    const interactionScore = this.calculateInteractionScore(
      persona.characteristics.interactionFrequency,
      behaviorHistory
    );
    score += interactionScore * interactionWeight;
    totalWeight += interactionWeight;

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * 计算会话时长匹配分数
   */
  private static calculateSessionDurationScore(
    personaRange: { min: number; max: number },
    actualDuration: number
  ): number {
    if (actualDuration >= personaRange.min && actualDuration <= personaRange.max) {
      return 1; // 完全匹配
    }

    // 计算距离最近边界的相对距离
    const minDistance = Math.abs(actualDuration - personaRange.min);
    const maxDistance = Math.abs(actualDuration - personaRange.max);
    const closestDistance = Math.min(minDistance, maxDistance);
    const rangeSize = personaRange.max - personaRange.min;

    // 距离越近分数越高
    return Math.max(0, 1 - (closestDistance / rangeSize));
  }

  /**
   * 计算设备偏好分数
   */
  private static calculateDeviceScore(
    personaDevice: 'mobile' | 'desktop' | 'both',
    actualDevice: 'mobile' | 'desktop' | 'tablet'
  ): number {
    if (personaDevice === 'both') return 1;
    if (personaDevice === actualDevice) return 1;
    if (actualDevice === 'tablet') {
      // 平板设备给予中等分数
      return 0.5;
    }
    return 0;
  }

  /**
   * 计算功能使用匹配分数
   */
  private static calculateFeatureUsageScore(
    personaFeatures: string[],
    actualFeatures: string[]
  ): number {
    if (personaFeatures.length === 0) return 0;

    const intersection = personaFeatures.filter(feature => 
      actualFeatures.includes(feature)
    );

    return intersection.length / personaFeatures.length;
  }

  /**
   * 计算交互频率分数
   */
  private static calculateInteractionScore(
    personaFrequency: 'low' | 'medium' | 'high',
    behaviorHistory: UserBehaviorData[]
  ): number {
    const recentHistory = behaviorHistory.filter(
      event => Date.now() - event.timestamp.getTime() < 30 * 60 * 1000 // 最近30分钟
    );

    const interactionCount = recentHistory.length;
    let actualFrequency: 'low' | 'medium' | 'high';

    if (interactionCount < 5) actualFrequency = 'low';
    else if (interactionCount < 15) actualFrequency = 'medium';
    else actualFrequency = 'high';

    return actualFrequency === personaFrequency ? 1 : 0.5;
  }

  /**
   * 生成个性化内容
   */
  private static async generatePersonalizedContent(): Promise<void> {
    for (const persona of this.userPersonas.values()) {
      const contents = this.createContentForPersona(persona);
      this.personalizedContent.set(persona.id, contents);
    }
  }

  /**
   * 为特定画像创建内容
   */
  private static createContentForPersona(persona: UserPersona): PersonalizedContent[] {
    const contents: PersonalizedContent[] = [];

    // 基于画像策略生成不同的内容变体
    switch (persona.guidanceStrategy.messageStyle) {
      case 'direct':
        contents.push({
          title: '登录以继续',
          message: '登录后可访问所有高级功能',
          buttonText: '立即登录',
          benefits: ['无限制访问', '数据同步', '高级分析'],
          visualElements: {
            color: '#3B82F6',
            icon: 'login',
          },
        });
        break;

      case 'benefit-focused':
        contents.push({
          title: '解锁更多可能',
          message: '登录后享受完整的分析体验，保存您的重要发现',
          buttonText: '免费注册',
          benefits: [
            '保存分析结果',
            '创建自定义报告',
            '访问历史数据',
            '导出详细报告',
          ],
          visualElements: {
            color: '#10B981',
            icon: 'unlock',
            illustration: 'benefits',
          },
          interactiveElements: {
            progressBar: true,
            socialProof: true,
          },
        });
        break;

      case 'urgency-based':
        contents.push({
          title: '试用即将结束',
          message: '立即登录保存您的工作进度',
          buttonText: '保存进度',
          benefits: ['避免丢失数据', '继续当前分析', '立即备份'],
          visualElements: {
            color: '#F59E0B',
            icon: 'warning',
            animation: 'pulse',
          },
          interactiveElements: {
            countdown: true,
          },
        });
        break;

      case 'friendly':
        contents.push({
          title: '嗨！要不要试试登录？',
          message: '登录后可以保存您的分析，下次直接查看哦～',
          buttonText: '好的，登录',
          benefits: ['保存喜欢的分析', '随时随地访问', '个性化推荐'],
          visualElements: {
            color: '#8B5CF6',
            icon: 'smile',
            animation: 'bounce',
          },
          interactiveElements: {
            testimonials: true,
          },
        });
        break;
    }

    return contents;
  }

  /**
   * 获取个性化引导内容
   */
  static async getPersonalizedGuidance(
    fingerprint: string,
    currentContext: any
  ): Promise<{
    persona: UserPersona;
    content: PersonalizedContent;
    steps: GuidanceStep[];
  }> {
    try {
      // 获取用户行为历史
      const behaviorHistory = await SmartTimingEngine['getUserBehaviorHistory'](fingerprint);

      // 识别用户画像
      const persona = await this.identifyUserPersona(fingerprint, behaviorHistory, currentContext);

      // 获取个性化内容
      const contents = this.personalizedContent.get(persona.id) || [];
      const content = contents[0] || this.getDefaultContent();

      // 生成引导步骤
      const steps = this.generateGuidanceSteps(persona, content, currentContext);

      return { persona, content, steps };
    } catch (error) {
      console.error('Failed to get personalized guidance:', error);
      return {
        persona: USER_PERSONAS[1],
        content: this.getDefaultContent(),
        steps: [],
      };
    }
  }

  /**
   * 生成引导步骤
   */
  private static generateGuidanceSteps(
    persona: UserPersona,
    content: PersonalizedContent,
    context: any
  ): GuidanceStep[] {
    const steps: GuidanceStep[] = [];

    // 基于画像策略生成不同的引导步骤
    switch (persona.guidanceStrategy.interactionLevel) {
      case 'passive':
        steps.push({
          id: 'main_prompt',
          type: 'modal',
          trigger: persona.guidanceStrategy.preferredTiming === 'immediate' ? 'immediate' : 'time-based',
          content,
        });
        break;

      case 'interactive':
        // 多步骤引导
        steps.push({
          id: 'intro_tooltip',
          type: 'tooltip',
          trigger: 'immediate',
          content: {
            title: '欢迎使用',
            message: '我们为您准备了一些有用的功能',
            buttonText: '了解更多',
            benefits: [],
            visualElements: { icon: 'info' },
          },
          position: { placement: 'bottom' },
        });

        steps.push({
          id: 'benefits_modal',
          type: 'modal',
          trigger: 'click',
          content,
          conditions: { minSessionTime: 60000 },
        });
        break;

      case 'gamified':
        // 游戏化引导
        steps.push({
          id: 'progress_banner',
          type: 'banner',
          trigger: 'immediate',
          content: {
            title: '探索进度',
            message: `您已经体验了 ${context.featuresUsed?.length || 0} 个功能`,
            buttonText: '解锁更多',
            benefits: [],
            visualElements: { icon: 'trophy', animation: 'sparkle' },
            interactiveElements: { progressBar: true },
          },
        });

        steps.push({
          id: 'achievement_modal',
          type: 'modal',
          trigger: 'time-based',
          content: {
            ...content,
            title: '🎉 恭喜解锁新成就！',
            message: '您已经成为我们的活跃用户，登录获得专属奖励',
          },
          conditions: { minSessionTime: 180000 },
        });
        break;
    }

    return steps;
  }

  /**
   * 获取默认内容
   */
  private static getDefaultContent(): PersonalizedContent {
    return {
      title: '登录以获得更好体验',
      message: '登录后可以保存您的分析结果',
      buttonText: '立即登录',
      benefits: ['保存数据', '同步设备', '高级功能'],
      visualElements: {
        color: '#3B82F6',
        icon: 'login',
      },
    };
  }

  /**
   * 保存画像识别结果
   */
  private static async savePersonaIdentification(
    fingerprint: string,
    personaId: string,
    confidence: number
  ): Promise<void> {
    try {
      await supabase.from('yt_user_personas').upsert({
        fingerprint,
        persona_id: personaId,
        confidence,
        identified_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save persona identification:', error);
    }
  }

  /**
   * 记录个性化内容效果
   */
  static async recordPersonalizationEffect(
    fingerprint: string,
    personaId: string,
    contentId: string,
    interaction: 'shown' | 'clicked' | 'converted' | 'dismissed',
    metadata?: any
  ): Promise<void> {
    try {
      await supabase.from('yt_personalization_effects').insert({
        fingerprint,
        persona_id: personaId,
        content_id: contentId,
        interaction_type: interaction,
        metadata: JSON.stringify(metadata || {}),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to record personalization effect:', error);
    }
  }

  /**
   * 获取个性化效果统计
   */
  static async getPersonalizationStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    personaPerformance: Array<{
      personaId: string;
      impressions: number;
      clicks: number;
      conversions: number;
      conversionRate: number;
    }>;
    contentPerformance: Array<{
      contentId: string;
      personaId: string;
      impressions: number;
      clicks: number;
      conversions: number;
      conversionRate: number;
    }>;
  }> {
    try {
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      const { data, error } = await supabase
        .from('yt_personalization_effects')
        .select('persona_id, content_id, interaction_type')
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString());

      if (error) {
        console.error('Failed to get personalization stats:', error);
        return { personaPerformance: [], contentPerformance: [] };
      }

      // 统计画像性能
      const personaStats = new Map<string, { impressions: number; clicks: number; conversions: number }>();
      const contentStats = new Map<string, { impressions: number; clicks: number; conversions: number; personaId: string }>();

      data?.forEach(record => {
        const { persona_id, content_id, interaction_type } = record;

        // 画像统计
        if (!personaStats.has(persona_id)) {
          personaStats.set(persona_id, { impressions: 0, clicks: 0, conversions: 0 });
        }
        const personaStat = personaStats.get(persona_id)!;

        // 内容统计
        const contentKey = `${content_id}:${persona_id}`;
        if (!contentStats.has(contentKey)) {
          contentStats.set(contentKey, { impressions: 0, clicks: 0, conversions: 0, personaId: persona_id });
        }
        const contentStat = contentStats.get(contentKey)!;

        switch (interaction_type) {
          case 'shown':
            personaStat.impressions++;
            contentStat.impressions++;
            break;
          case 'clicked':
            personaStat.clicks++;
            contentStat.clicks++;
            break;
          case 'converted':
            personaStat.conversions++;
            contentStat.conversions++;
            break;
        }
      });

      // 转换为结果格式
      const personaPerformance = Array.from(personaStats.entries()).map(([personaId, stats]) => ({
        personaId,
        ...stats,
        conversionRate: stats.impressions > 0 ? (stats.conversions / stats.impressions) * 100 : 0,
      }));

      const contentPerformance = Array.from(contentStats.entries()).map(([key, stats]) => {
        const [contentId] = key.split(':');
        return {
          contentId,
          personaId: stats.personaId,
          impressions: stats.impressions,
          clicks: stats.clicks,
          conversions: stats.conversions,
          conversionRate: stats.impressions > 0 ? (stats.conversions / stats.impressions) * 100 : 0,
        };
      });

      return { personaPerformance, contentPerformance };
    } catch (error) {
      console.error('Failed to get personalization stats:', error);
      return { personaPerformance: [], contentPerformance: [] };
    }
  }
}

// 导出用户画像常量
export { USER_PERSONAS };