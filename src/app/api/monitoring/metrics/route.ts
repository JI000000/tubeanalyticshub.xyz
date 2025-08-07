/**
 * 系统指标API端点
 * 
 * 提供系统性能指标和历史数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { monitoringSystem } from '@/lib/monitoring-system'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')
    const type = searchParams.get('type') || 'current'

    switch (type) {
      case 'current':
        const currentMetrics = monitoringSystem.getCurrentMetrics()
        return NextResponse.json({
          success: true,
          data: currentMetrics
        })

      case 'historical':
        const historicalMetrics = monitoringSystem.getHistoricalMetrics(hours)
        return NextResponse.json({
          success: true,
          data: historicalMetrics,
          meta: {
            hours,
            count: historicalMetrics.length
          }
        })

      case 'database':
        // 从数据库获取历史指标
        if (!supabase) {
          return NextResponse.json({ error: 'Database not available' }, { status: 503 })
        }
        
        const { data: dbMetrics, error } = await supabase
          .from('yt_system_metrics')
          .select('*')
          .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: false })
          .limit(1000)

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          data: dbMetrics,
          meta: {
            hours,
            count: dbMetrics?.length || 0,
            source: 'database'
          }
        })

      case 'summary':
        // 生成指标摘要
        const summary = await generateMetricsSummary(hours)
        return NextResponse.json({
          success: true,
          data: summary
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('获取指标失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 生成指标摘要
 */
async function generateMetricsSummary(hours: number) {
  if (!supabase) {
    return {
      period: `${hours}h`,
      dataPoints: 0,
      summary: 'Database not available'
    }
  }
  
  const { data: metrics, error } = await supabase
    .from('yt_system_metrics')
    .select('*')
    .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false })

  if (error || !metrics || metrics.length === 0) {
    return {
      period: `${hours}h`,
      dataPoints: 0,
      summary: 'No data available'
    }
  }

  // 计算平均值和趋势
  const avgLoginSuccessRate = metrics.reduce((sum, m) => sum + (m.login_success_rate || 0), 0) / metrics.length
  const avgResponseTime = metrics.reduce((sum, m) => sum + (m.avg_response_time || 0), 0) / metrics.length
  const avgTrialConversion = metrics.reduce((sum, m) => sum + (m.trial_conversion_rate || 0), 0) / metrics.length
  const avgMemoryUsage = metrics.reduce((sum, m) => sum + (m.memory_usage || 0), 0) / metrics.length

  // 计算趋势（最近25%的数据 vs 最早25%的数据）
  const recentCount = Math.floor(metrics.length * 0.25)
  const recentMetrics = metrics.slice(0, recentCount)
  const oldMetrics = metrics.slice(-recentCount)

  const recentAvgSuccessRate = recentMetrics.reduce((sum, m) => sum + (m.login_success_rate || 0), 0) / recentCount
  const oldAvgSuccessRate = oldMetrics.reduce((sum, m) => sum + (m.login_success_rate || 0), 0) / recentCount

  const successRateTrend = recentAvgSuccessRate - oldAvgSuccessRate

  return {
    period: `${hours}h`,
    dataPoints: metrics.length,
    averages: {
      loginSuccessRate: Math.round(avgLoginSuccessRate * 100) / 100,
      responseTime: Math.round(avgResponseTime),
      trialConversionRate: Math.round(avgTrialConversion * 100) / 100,
      memoryUsage: Math.round(avgMemoryUsage * 100) / 100
    },
    trends: {
      loginSuccessRate: {
        change: Math.round(successRateTrend * 100) / 100,
        direction: successRateTrend > 0 ? 'up' : successRateTrend < 0 ? 'down' : 'stable'
      }
    },
    healthScore: calculateHealthScore({
      loginSuccessRate: avgLoginSuccessRate,
      responseTime: avgResponseTime,
      trialConversionRate: avgTrialConversion,
      memoryUsage: avgMemoryUsage
    })
  }
}

/**
 * 计算健康评分 (0-100)
 */
function calculateHealthScore(metrics: any): number {
  let score = 100

  // 登录成功率影响 (30%)
  if (metrics.loginSuccessRate < 80) {
    score -= (80 - metrics.loginSuccessRate) * 0.3
  }

  // 响应时间影响 (25%)
  if (metrics.responseTime > 1000) {
    score -= Math.min((metrics.responseTime - 1000) / 100, 25)
  }

  // 试用转化率影响 (20%)
  if (metrics.trialConversionRate < 10) {
    score -= (10 - metrics.trialConversionRate) * 2
  }

  // 内存使用率影响 (25%)
  if (metrics.memoryUsage > 70) {
    score -= (metrics.memoryUsage - 70) * 0.8
  }

  return Math.max(0, Math.round(score))
}