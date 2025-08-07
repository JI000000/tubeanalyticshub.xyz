/**
 * 告警管理API端点
 * 
 * 提供告警查询、管理和配置功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { monitoringSystem } from '@/lib/monitoring-system'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')

    switch (type) {
      case 'active':
        const activeAlerts = monitoringSystem.getActiveAlerts()
        return NextResponse.json({
          success: true,
          data: activeAlerts,
          meta: {
            count: activeAlerts.length,
            type: 'active'
          }
        })

      case 'history':
        if (!supabase) {
          return NextResponse.json({ error: 'Database not available' }, { status: 503 })
        }
        
        const { data: alertHistory, error } = await supabase
          .from('yt_system_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          data: alertHistory,
          meta: {
            count: alertHistory?.length || 0,
            type: 'history',
            limit
          }
        })

      case 'statistics':
        const stats = await getAlertStatistics()
        return NextResponse.json({
          success: true,
          data: stats
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('获取告警信息失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, alertId, ruleId, ruleConfig } = body

    switch (action) {
      case 'resolve':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          )
        }

        await monitoringSystem.resolveAlert(alertId)
        
        return NextResponse.json({
          success: true,
          message: `Alert ${alertId} resolved`
        })

      case 'add_rule':
        if (!ruleConfig) {
          return NextResponse.json(
            { error: 'Rule configuration is required' },
            { status: 400 }
          )
        }

        // 验证规则配置
        const validatedRule = validateAlertRule(ruleConfig)
        if (!validatedRule.valid) {
          return NextResponse.json(
            { error: 'Invalid rule configuration', details: validatedRule.errors },
            { status: 400 }
          )
        }

        monitoringSystem.addAlertRule(ruleConfig)
        
        return NextResponse.json({
          success: true,
          message: 'Alert rule added successfully'
        })

      case 'update_rule':
        if (!ruleId || !ruleConfig) {
          return NextResponse.json(
            { error: 'Rule ID and configuration are required' },
            { status: 400 }
          )
        }

        monitoringSystem.updateAlertRule(ruleId, ruleConfig)
        
        return NextResponse.json({
          success: true,
          message: `Alert rule ${ruleId} updated successfully`
        })

      case 'test_rule':
        if (!ruleConfig) {
          return NextResponse.json(
            { error: 'Rule configuration is required' },
            { status: 400 }
          )
        }

        const testResult = await testAlertRule(ruleConfig)
        
        return NextResponse.json({
          success: true,
          data: testResult
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('告警操作失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Alert operation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 获取告警统计信息
 */
async function getAlertStatistics() {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }
    
    // 获取24小时内的告警
    const { data: dailyAlerts } = await supabase
      .from('yt_system_alerts')
      .select('severity, resolved')
      .gte('created_at', oneDayAgo.toISOString())

    // 获取7天内的告警
    const { data: weeklyAlerts } = await supabase
      .from('yt_system_alerts')
      .select('severity, resolved, created_at')
      .gte('created_at', oneWeekAgo.toISOString())

    // 统计各严重程度的告警数量
    const severityStats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }

    dailyAlerts?.forEach(alert => {
      if (alert.severity in severityStats) {
        severityStats[alert.severity as keyof typeof severityStats]++
      }
    })

    // 计算解决率
    const totalDaily = dailyAlerts?.length || 0
    const resolvedDaily = dailyAlerts?.filter(a => a.resolved).length || 0
    const resolutionRate = totalDaily > 0 ? (resolvedDaily / totalDaily) * 100 : 0

    // 计算趋势
    const weeklyByDay = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const dayAlerts = weeklyAlerts?.filter(alert => {
        const alertDate = new Date(alert.created_at)
        return alertDate >= dayStart && alertDate < dayEnd
      }).length || 0

      return {
        date: dayStart.toISOString().split('T')[0],
        count: dayAlerts
      }
    }).reverse()

    return {
      daily: {
        total: totalDaily,
        resolved: resolvedDaily,
        active: totalDaily - resolvedDaily,
        resolutionRate: Math.round(resolutionRate * 100) / 100,
        bySeverity: severityStats
      },
      weekly: {
        total: weeklyAlerts?.length || 0,
        trend: weeklyByDay
      },
      topRules: await getTopAlertRules()
    }
  } catch (error) {
    console.error('获取告警统计失败:', error)
    return {
      daily: { total: 0, resolved: 0, active: 0, resolutionRate: 0, bySeverity: {} },
      weekly: { total: 0, trend: [] },
      topRules: []
    }
  }
}

/**
 * 获取最频繁触发的告警规则
 */
async function getTopAlertRules() {
  try {
    if (!supabase) {
      return []
    }
    
    const { data: alerts } = await supabase
      .from('yt_system_alerts')
      .select('rule_id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (!alerts) return []

    // 统计每个规则的触发次数
    const ruleCounts = alerts.reduce((acc, alert) => {
      acc[alert.rule_id] = (acc[alert.rule_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 排序并返回前5个
    return Object.entries(ruleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ruleId, count]) => ({ ruleId, count }))
  } catch (error) {
    console.error('获取热门告警规则失败:', error)
    return []
  }
}

/**
 * 验证告警规则配置
 */
function validateAlertRule(rule: any) {
  const errors: string[] = []

  if (!rule.id || typeof rule.id !== 'string') {
    errors.push('Rule ID is required and must be a string')
  }

  if (!rule.name || typeof rule.name !== 'string') {
    errors.push('Rule name is required and must be a string')
  }

  if (!rule.description || typeof rule.description !== 'string') {
    errors.push('Rule description is required and must be a string')
  }

  if (!rule.condition || typeof rule.condition !== 'function') {
    errors.push('Rule condition is required and must be a function')
  }

  if (!['low', 'medium', 'high', 'critical'].includes(rule.severity)) {
    errors.push('Rule severity must be one of: low, medium, high, critical')
  }

  if (!rule.cooldown || typeof rule.cooldown !== 'number' || rule.cooldown < 0) {
    errors.push('Rule cooldown is required and must be a positive number')
  }

  if (typeof rule.enabled !== 'boolean') {
    errors.push('Rule enabled flag must be a boolean')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 测试告警规则
 */
async function testAlertRule(rule: any) {
  try {
    // 获取当前指标
    const currentMetrics = monitoringSystem.getCurrentMetrics()
    
    if (!currentMetrics) {
      return {
        success: false,
        message: 'No current metrics available for testing'
      }
    }

    // 测试规则条件
    const wouldTrigger = rule.condition(currentMetrics)
    
    return {
      success: true,
      wouldTrigger,
      currentMetrics,
      message: wouldTrigger 
        ? 'Rule would trigger with current metrics'
        : 'Rule would not trigger with current metrics'
    }
  } catch (error) {
    return {
      success: false,
      message: `Rule test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}