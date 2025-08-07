/**
 * 系统健康检查API端点
 * 
 * 提供系统健康状态、指标和告警信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { monitoringSystem } from '@/lib/monitoring-system'

export async function GET(request: NextRequest) {
  try {
    // 生成健康报告
    const healthReport = monitoringSystem.generateHealthReport()
    
    // 根据系统状态设置HTTP状态码
    const statusCode = healthReport.status === 'healthy' ? 200 : 
                      healthReport.activeAlerts > 0 ? 503 : 200

    return NextResponse.json(healthReport, { status: statusCode })
  } catch (error) {
    console.error('健康检查失败:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, alertId } = body

    switch (action) {
      case 'resolve_alert':
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

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('健康检查操作失败:', error)
    
    return NextResponse.json({
      error: 'Operation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}