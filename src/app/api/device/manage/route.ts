import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'
import { deviceSyncService } from '@/lib/device-sync'

/**
 * 设备管理API端点
 * 支持获取设备列表、登出设备等操作
 */

// 获取用户设备列表
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
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const includeSessions = searchParams.get('include_sessions') === 'true'

    // 获取设备列表
    const devices = await deviceSyncService.getUserDevices(session.user.id)
    
    // 过滤非活跃设备（如果需要）
    const filteredDevices = includeInactive 
      ? devices 
      : devices.filter(device => device.isActive)

    // 获取设备会话信息（如果需要）
    let devicesWithSessions = filteredDevices
    if (includeSessions) {
      devicesWithSessions = await Promise.all(
        filteredDevices.map(async (device) => {
          const sessions = await deviceSyncService.getDeviceSessions(device.id)
          return {
            ...device,
            sessions: sessions.filter(session => session.isActive)
          }
        })
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        devices: devicesWithSessions,
        total: devicesWithSessions.length,
        active: devicesWithSessions.filter(d => d.isActive).length
      }
    })
  } catch (error) {
    console.error('Failed to get devices:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get devices',
        message: '获取设备列表失败'
      },
      { status: 500 }
    )
  }
}

// 设备管理操作
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
    const { action, deviceId, deviceIds } = body

    switch (action) {
      case 'logout_device':
        if (!deviceId) {
          return NextResponse.json(
            { error: 'Device ID required', message: '设备ID是必需的' },
            { status: 400 }
          )
        }

        await deviceSyncService.logoutDevice(deviceId, 'user_initiated')
        
        // 创建登出事件
        await deviceSyncService.createSyncEvent(
          session.user.id,
          deviceId,
          'logout',
          {
            reason: 'user_initiated',
            timestamp: new Date().toISOString()
          }
        )

        return NextResponse.json({
          success: true,
          message: '设备已登出'
        })

      case 'logout_other_devices':
        const currentDeviceId = body.currentDeviceId
        if (!currentDeviceId) {
          return NextResponse.json(
            { error: 'Current device ID required', message: '当前设备ID是必需的' },
            { status: 400 }
          )
        }

        const loggedOutCount = await deviceSyncService.logoutOtherDevices(
          session.user.id,
          currentDeviceId
        )

        return NextResponse.json({
          success: true,
          message: `已登出 ${loggedOutCount} 个其他设备`,
          data: { loggedOutCount }
        })

      case 'logout_multiple_devices':
        if (!deviceIds || !Array.isArray(deviceIds)) {
          return NextResponse.json(
            { error: 'Device IDs array required', message: '设备ID数组是必需的' },
            { status: 400 }
          )
        }

        let loggedOutDevices = 0
        for (const deviceId of deviceIds) {
          try {
            await deviceSyncService.logoutDevice(deviceId, 'user_initiated')
            loggedOutDevices++
          } catch (error) {
            console.error(`Failed to logout device ${deviceId}:`, error)
          }
        }

        return NextResponse.json({
          success: true,
          message: `已登出 ${loggedOutDevices} 个设备`,
          data: { loggedOutCount: loggedOutDevices }
        })

      case 'trust_device':
        if (!deviceId) {
          return NextResponse.json(
            { error: 'Device ID required', message: '设备ID是必需的' },
            { status: 400 }
          )
        }

        // 这里需要直接操作数据库，因为 deviceSyncService 没有提供信任设备的方法
        const { createSupabaseServiceClient } = await import('@/lib/supabase')
        const supabase = createSupabaseServiceClient()
        
        const { error: trustError } = await supabase
          .from('yt_user_devices')
          .update({ is_trusted: true })
          .eq('id', deviceId)
          .eq('user_id', session.user.id) // 确保只能操作自己的设备

        if (trustError) {
          throw trustError
        }

        return NextResponse.json({
          success: true,
          message: '设备已设为受信任'
        })

      case 'untrust_device':
        if (!deviceId) {
          return NextResponse.json(
            { error: 'Device ID required', message: '设备ID是必需的' },
            { status: 400 }
          )
        }

        const supabase2 = (await import('@/lib/supabase')).createSupabaseServiceClient()
        
        const { error: untrustError } = await supabase2
          .from('yt_user_devices')
          .update({ is_trusted: false })
          .eq('id', deviceId)
          .eq('user_id', session.user.id)

        if (untrustError) {
          throw untrustError
        }

        return NextResponse.json({
          success: true,
          message: '设备信任状态已移除'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action', message: '无效的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Device management error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Device management failed',
        message: '设备管理操作失败'
      },
      { status: 500 }
    )
  }
}