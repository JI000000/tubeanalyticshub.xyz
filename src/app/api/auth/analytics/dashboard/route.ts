/**
 * 登录分析仪表板API端点
 * 提供综合的登录分析数据，包括统计、漏斗、趋势等
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoginAnalyticsService } from '@/lib/login-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 获取查询参数
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const includeParam = searchParams.get('include'); // 可选：stats,funnel,trends
    
    // 解析日期参数
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    
    // 验证日期参数
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start_date parameter' },
        { status: 400 }
      );
    }
    
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid end_date parameter' },
        { status: 400 }
      );
    }
    
    // 解析包含的数据类型
    const includeTypes = includeParam 
      ? includeParam.split(',').map(type => type.trim())
      : ['stats', 'funnel', 'trends'];
    
    const dashboardData: any = {};
    
    // 获取统计数据
    if (includeTypes.includes('stats')) {
      dashboardData.conversion_stats = await LoginAnalyticsService.getConversionStats(
        startDate, 
        endDate
      );
    }
    
    // 获取漏斗数据
    if (includeTypes.includes('funnel')) {
      dashboardData.funnel_data = await LoginAnalyticsService.getFunnelData(
        startDate, 
        endDate
      );
    }
    
    // 获取趋势数据
    if (includeTypes.includes('trends')) {
      const [promptTrends, attemptTrends, successTrends] = await Promise.all([
        LoginAnalyticsService.getTimeSeriesData('prompt_shown', startDate, endDate, 'day'),
        LoginAnalyticsService.getTimeSeriesData('login_attempt', startDate, endDate, 'day'),
        LoginAnalyticsService.getTimeSeriesData('login_success', startDate, endDate, 'day'),
      ]);
      
      dashboardData.trends = {
        prompt_shown: promptTrends,
        login_attempt: attemptTrends,
        login_success: successTrends,
      };
    }
    
    // 计算关键指标摘要
    const summary: any = {
      period: {
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
        days: startDate && endDate 
          ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          : 7,
      },
    };
    
    if (dashboardData.conversion_stats) {
      const stats = dashboardData.conversion_stats;
      summary.key_metrics = {
        total_prompts: stats.total_prompts,
        total_attempts: stats.total_attempts,
        total_successes: stats.total_successes,
        overall_conversion_rate: Math.round(stats.overall_conversion_rate * 100) / 100,
        best_performing_provider: getBestProvider(stats.by_provider),
        best_performing_trigger: getBestTrigger(stats.by_trigger),
      };
    }
    
    if (dashboardData.trends) {
      const trends = dashboardData.trends;
      summary.trend_insights = {
        total_prompts_trend: calculateTrend(trends.prompt_shown),
        total_attempts_trend: calculateTrend(trends.login_attempt),
        total_successes_trend: calculateTrend(trends.login_success),
      };
    }
    
    return NextResponse.json({
      success: true,
      data: dashboardData,
      summary,
      meta: {
        generated_at: new Date().toISOString(),
        included_data: includeTypes,
      },
    });
  } catch (error) {
    console.error('Failed to get login analytics dashboard:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to retrieve login analytics dashboard data'
      },
      { status: 500 }
    );
  }
}

// 辅助函数：获取表现最好的登录提供商
function getBestProvider(providerStats: any): { provider: string; success_rate: number } {
  let bestProvider = 'github';
  let bestRate = 0;
  
  Object.entries(providerStats).forEach(([provider, stats]: [string, any]) => {
    if (stats.success_rate > bestRate && stats.attempts > 0) {
      bestProvider = provider;
      bestRate = stats.success_rate;
    }
  });
  
  return {
    provider: bestProvider,
    success_rate: Math.round(bestRate * 100) / 100,
  };
}

// 辅助函数：获取表现最好的触发类型
function getBestTrigger(triggerStats: any): { trigger: string; conversion_rate: number } {
  let bestTrigger = 'trial_exhausted';
  let bestRate = 0;
  
  Object.entries(triggerStats).forEach(([trigger, stats]: [string, any]) => {
    if (stats.conversion_rate > bestRate && stats.prompts > 0) {
      bestTrigger = trigger;
      bestRate = stats.conversion_rate;
    }
  });
  
  return {
    trigger: bestTrigger,
    conversion_rate: Math.round(bestRate * 100) / 100,
  };
}

// 辅助函数：计算趋势（增长率）
function calculateTrend(timeSeriesData: Array<{ date: string; count: number }>): {
  direction: 'up' | 'down' | 'stable';
  change_rate: number;
  total_count: number;
} {
  if (timeSeriesData.length < 2) {
    return {
      direction: 'stable',
      change_rate: 0,
      total_count: timeSeriesData.reduce((sum, item) => sum + item.count, 0),
    };
  }
  
  const latest = timeSeriesData[timeSeriesData.length - 1].count;
  const previous = timeSeriesData[timeSeriesData.length - 2].count;
  const changeRate = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
  
  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (changeRate > 5) direction = 'up';
  else if (changeRate < -5) direction = 'down';
  
  return {
    direction,
    change_rate: Math.round(changeRate * 100) / 100,
    total_count: timeSeriesData.reduce((sum, item) => sum + item.count, 0),
  };
}

// 支持CORS预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}