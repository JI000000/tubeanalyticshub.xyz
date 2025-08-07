/**
 * 反馈统计API端点
 * 
 * 提供反馈数据分析和统计信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { feedbackSystem } from '@/lib/feedback-system'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // 检查管理员权限
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const type = searchParams.get('type') || 'overview'

    switch (type) {
      case 'overview':
        const statistics = await feedbackSystem.getFeedbackStatistics(days)
        return NextResponse.json({
          success: true,
          data: statistics,
          meta: {
            period: `${days} days`,
            generatedAt: new Date().toISOString()
          }
        })

      case 'trends':
        const trends = await generateTrendAnalysis(days)
        return NextResponse.json({
          success: true,
          data: trends
        })

      case 'categories':
        const categories = await getCategoryAnalysis(days)
        return NextResponse.json({
          success: true,
          data: categories
        })

      case 'performance':
        const performance = await getPerformanceMetrics(days)
        return NextResponse.json({
          success: true,
          data: performance
        })

      default:
        return NextResponse.json(
          { error: 'Invalid statistics type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('获取反馈统计失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch feedback statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 生成趋势分析
 */
async function generateTrendAnalysis(days: number) {
  const statistics = await feedbackSystem.getFeedbackStatistics(days)
  
  // 计算周环比变化
  const previousPeriodStats = await feedbackSystem.getFeedbackStatistics(days * 2)
  
  const currentTotal = statistics.total
  const previousTotal = previousPeriodStats.total - currentTotal
  
  const growthRate = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal) * 100 
    : 0

  return {
    currentPeriod: {
      total: currentTotal,
      avgResolutionTime: statistics.avgResolutionTime,
      satisfactionScore: statistics.satisfactionScore
    },
    previousPeriod: {
      total: previousTotal,
      // 这里可以添加更多历史数据对比
    },
    trends: {
      growthRate: Math.round(growthRate * 100) / 100,
      direction: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
      trendData: statistics.trendData
    },
    insights: generateInsights(statistics, growthRate)
  }
}

/**
 * 获取分类分析
 */
async function getCategoryAnalysis(days: number) {
  const statistics = await feedbackSystem.getFeedbackStatistics(days)
  
  // 计算各分类的占比和趋势
  const totalFeedback = statistics.total
  const categoryAnalysis = Object.entries(statistics.byType).map(([type, count]) => ({
    type,
    count,
    percentage: totalFeedback > 0 ? (count / totalFeedback) * 100 : 0,
    priority: getPriorityForType(type),
    avgResolutionTime: getAvgResolutionTimeForType(type) // 这里需要实际实现
  }))

  return {
    categories: categoryAnalysis.sort((a, b) => b.count - a.count),
    recommendations: generateCategoryRecommendations(categoryAnalysis)
  }
}

/**
 * 获取性能指标
 */
async function getPerformanceMetrics(days: number) {
  const statistics = await feedbackSystem.getFeedbackStatistics(days)
  
  return {
    responseMetrics: {
      avgResolutionTime: statistics.avgResolutionTime,
      resolutionRate: calculateResolutionRate(statistics),
      firstResponseTime: 2.5, // 模拟数据，实际需要从数据库计算
    },
    qualityMetrics: {
      satisfactionScore: statistics.satisfactionScore,
      reopenRate: 5.2, // 模拟数据
      escalationRate: 1.8 // 模拟数据
    },
    volumeMetrics: {
      totalFeedback: statistics.total,
      dailyAverage: statistics.total / days,
      peakDay: findPeakDay(statistics.trendData),
      quietDay: findQuietDay(statistics.trendData)
    },
    benchmarks: {
      industryAvgResolutionTime: 24, // 小时
      targetSatisfactionScore: 4.5,
      targetResolutionRate: 95 // 百分比
    }
  }
}

/**
 * 生成洞察建议
 */
function generateInsights(statistics: any, growthRate: number): string[] {
  const insights: string[] = []

  if (growthRate > 20) {
    insights.push('反馈量显著增长，建议增加客服资源')
  } else if (growthRate < -20) {
    insights.push('反馈量显著下降，可能表明产品质量改善')
  }

  if (statistics.avgResolutionTime > 48) {
    insights.push('平均解决时间较长，建议优化处理流程')
  }

  if (statistics.satisfactionScore < 4.0) {
    insights.push('用户满意度偏低，需要关注反馈处理质量')
  }

  const bugReports = statistics.byType.bug_report || 0
  const totalFeedback = statistics.total
  if (bugReports / totalFeedback > 0.4) {
    insights.push('Bug报告占比较高，建议加强产品测试')
  }

  const criticalFeedback = statistics.byPriority.critical || 0
  if (criticalFeedback > 0) {
    insights.push(`存在${criticalFeedback}个严重问题，需要立即处理`)
  }

  return insights
}

/**
 * 获取类型对应的优先级
 */
function getPriorityForType(type: string): string {
  const priorityMap: Record<string, string> = {
    'bug_report': 'high',
    'login_issue': 'high',
    'performance_issue': 'medium',
    'feature_request': 'medium',
    'ui_ux_feedback': 'low',
    'general_feedback': 'low'
  }
  return priorityMap[type] || 'medium'
}

/**
 * 获取类型的平均解决时间（模拟数据）
 */
function getAvgResolutionTimeForType(type: string): number {
  const timeMap: Record<string, number> = {
    'bug_report': 18.5,
    'login_issue': 12.3,
    'performance_issue': 24.7,
    'feature_request': 72.1,
    'ui_ux_feedback': 48.2,
    'general_feedback': 36.8
  }
  return timeMap[type] || 24.0
}

/**
 * 计算解决率
 */
function calculateResolutionRate(statistics: any): number {
  const resolved = (statistics.byStatus.resolved || 0) + (statistics.byStatus.closed || 0)
  const total = statistics.total
  return total > 0 ? (resolved / total) * 100 : 0
}

/**
 * 找到反馈最多的一天
 */
function findPeakDay(trendData: any[]): any {
  return trendData.reduce((peak, day) => 
    day.count > peak.count ? day : peak, 
    { date: '', count: 0 }
  )
}

/**
 * 找到反馈最少的一天
 */
function findQuietDay(trendData: any[]): any {
  return trendData.reduce((quiet, day) => 
    day.count < quiet.count ? day : quiet, 
    { date: '', count: Infinity }
  )
}

/**
 * 生成分类建议
 */
function generateCategoryRecommendations(categories: any[]): string[] {
  const recommendations: string[] = []
  
  const topCategory = categories[0]
  if (topCategory) {
    recommendations.push(`${topCategory.type}是最主要的反馈类型，占${topCategory.percentage.toFixed(1)}%`)
  }

  const highPriorityCategories = categories.filter(c => c.priority === 'high')
  if (highPriorityCategories.length > 0) {
    recommendations.push(`有${highPriorityCategories.length}个高优先级分类需要重点关注`)
  }

  return recommendations
}