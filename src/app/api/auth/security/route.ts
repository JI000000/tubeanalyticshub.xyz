import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { securityLogger } from '@/lib/security-logger'
import { headers } from 'next/headers'

/**
 * 获取用户安全分析数据
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const type = searchParams.get('type') || 'analytics'

    switch (type) {
      case 'analytics':
        const analytics = await securityLogger.getUserSecurityAnalytics(session.user.id, days)
        return NextResponse.json(analytics)

      case 'events':
        const limit = parseInt(searchParams.get('limit') || '20')
        const events = await securityLogger.getRecentSecurityEvents(session.user.id, limit)
        return NextResponse.json(events)

      case 'anomalies':
        const anomalyLimit = parseInt(searchParams.get('limit') || '10')
        const anomalies = await securityLogger.getUserAnomalies(session.user.id, anomalyLimit)
        return NextResponse.json(anomalies)

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in security API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 记录安全事件
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const headersList = await headers()
    
    // 获取客户端IP地址
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || '127.0.0.1'
    
    // 获取User-Agent
    const userAgent = headersList.get('user-agent') || undefined

    const { eventType, loginMethod, deviceFingerprint, additionalData } = body

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 })
    }

    // 记录安全事件
    const logId = await securityLogger.logSecurityEvent({
      userId: session?.user?.id ? (await getYtUserId(session.user.id)) || undefined : undefined,
      nextauthUserId: session?.user?.id,
      eventType,
      loginMethod,
      ipAddress,
      userAgent,
      deviceFingerprint,
      additionalData
    })

    return NextResponse.json({ success: true, logId })
  } catch (error) {
    console.error('Error logging security event:', error)
    return NextResponse.json(
      { error: 'Failed to log security event' },
      { status: 500 }
    )
  }
}

/**
 * 更新异常状态
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { anomalyId, response } = body

    if (!anomalyId || !response) {
      return NextResponse.json(
        { error: 'Anomaly ID and response are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'blocked', 'false_positive'].includes(response)) {
      return NextResponse.json(
        { error: 'Invalid response value' },
        { status: 400 }
      )
    }

    const success = await securityLogger.updateAnomalyStatus(
      anomalyId,
      session.user.id,
      response
    )

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to update anomaly status' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating anomaly status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 辅助函数：获取yt_users表的用户ID
async function getYtUserId(nextauthUserId: string): Promise<string | null> {
  try {
    const { createSupabaseServiceClient } = await import('@/lib/supabase')
    const supabase = createSupabaseServiceClient()
    
    const { data, error } = await supabase
      .from('yt_users')
      .select('id')
      .eq('nextauth_user_id', nextauthUserId)
      .single()

    if (error || !data) {
      return null
    }

    return data.id
  } catch (error) {
    return null
  }
}