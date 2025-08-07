import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'
import { deviceSyncService } from '@/lib/device-sync'

/**
 * 设备同步API端点
 * 处理设备同步事件、安全警报等
 */

// 获取同步状态和事件
export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '请先登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeAlerts = searchParams.get('include_alerts') !== 'false'
    const includeEvents = searchParams.get('include_events') !== 'false'
    const includeConfig = searchParams.get('include_config') !== 'false'

    const data: any = {}

    // 获取安全警报
    if (includeAlerts) {
      data.securityAlerts = await deviceSyncService.getSecurityAlerts(session.user.id)
    }

    // 获取待处理事件
    if (includeEvents) {
      data.pendingEvents = await deviceSyncService.getPendingSyncEvents(session.user.id)
    }

    // 获取同步配置
    if (includeConfig) {
      data.syncConfig = await deviceSyncService.getSyncConfig(session.user.id)
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Failed to get sync status:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync status',
        message: '获取同步状态失败'
      },
      { status: 500 }
    )
  }
}

// 处理同步操作
export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, alertId, eventId, config } = body

    switch (action) {
      case 'acknowledge_alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID required', message: '警报ID是必需的' },
            { status: 400 }
          )
        }

        await deviceSyncService.acknowledgeSecurityAlert(alertId)

        return NextResponse.json({
          success: true,
          message: '安全警报已确认'
        })

      case 'resolve_alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID required', message: '警报ID是必需的' },
            { status: 400 }
          )
        }

        await deviceSyncService.resolveSecurityAlert(alertId)

        return NextResponse.json({
          success: true,
          message: '安全警报已解决'
        })

      case 'process_event':
        if (!eventId) {
          return NextResponse.json(
            { error: 'Event ID required', message: '事件ID是必需的' },
            { status: 400 }
          )
        }

        await deviceSyncService.markSyncEventProcessed(eventId)

        return NextResponse.json({
          success: true,
          message: '同步事件已处理'
        })

      case 'update_config':
        if (!config) {
          return NextResponse.json(
            { error: 'Config required', message: '配置信息是必需的' },
            { status: 400 }
          )
        }

        await deviceSyncService.updateSyncConfig(session.user.id, config)

        return NextResponse.json({
          success: true,
          message: '同步配置已更新'
        })

      case 'cleanup_sessions':
        const cleanedCount = await deviceSyncService.cleanupExpiredSessions()

        return NextResponse.json({
          success: true,
          message: `已清理 ${cleanedCount} 个过期会话`,
          data: { cleanedCount }
        })

      case 'create_sync_event':
        const { deviceId, eventType, eventData } = body
        
        if (!deviceId || !eventType) {
          return NextResponse.json(
            { error: 'Device ID and event type required', message: '设备ID和事件类型是必需的' },
            { status: 400 }
          )
        }

        await deviceSyncService.createSyncEvent(
          session.user.id,
          deviceId,
          eventType,
          eventData || {}
        )

        return NextResponse.json({
          success: true,
          message: '同步事件已创建'
        })

      case 'detect_conflicts':
        const { targetDeviceId } = body
        
        if (!targetDeviceId) {
          return NextResponse.json(
            { error: 'Target device ID required', message: '目标设备ID是必需的' },
            { status: 400 }
          )
        }

        const conflicts = await deviceSyncService.detectLoginConflicts(
          session.user.id,
          targetDeviceId
        )

        return NextResponse.json({
          success: true,
          data: conflicts
        })

      case 'handle_conflicts':
        const { conflictDeviceId } = body
        
        if (!conflictDeviceId) {
          return NextResponse.json(
            { error: 'Conflict device ID required', message: '冲突设备ID是必需的' },
            { status: 400 }
          )
        }

        await deviceSyncService.handleLoginConflicts(
          session.user.id,
          conflictDeviceId
        )

        return NextResponse.json({
          success: true,
          message: '登录冲突已处理'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action', message: '无效的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Device sync error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Device sync failed',
        message: '设备同步操作失败'
      },
      { status: 500 }
    )
  }
}