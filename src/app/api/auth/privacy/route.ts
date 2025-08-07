import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { privacySettingsService } from '@/lib/privacy-settings'

/**
 * 获取用户隐私设置
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'settings'

    switch (type) {
      case 'settings':
        const settings = await privacySettingsService.getUserPrivacySettings(session.user.id)
        return NextResponse.json(settings)

      case 'deletion-requests':
        const requests = await privacySettingsService.getUserDeletionRequests(session.user.id)
        return NextResponse.json(requests)

      case 'gdpr-logs':
        const limit = parseInt(searchParams.get('limit') || '50')
        const logs = await privacySettingsService.getGDPRComplianceLogs(session.user.id, limit)
        return NextResponse.json(logs)

      case 'gdpr-consent':
        const hasConsent = await privacySettingsService.hasValidGDPRConsent(session.user.id)
        return NextResponse.json({ hasConsent })

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in privacy API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 更新用户隐私设置
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    const success = await privacySettingsService.updatePrivacySettings(
      session.user.id,
      settings
    )

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to update privacy settings' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 创建数据删除请求或导出数据
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, requestType, deletionScope, reason } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    switch (action) {
      case 'create-deletion-request':
        if (!requestType || !deletionScope) {
          return NextResponse.json(
            { error: 'Request type and deletion scope are required' },
            { status: 400 }
          )
        }

        const requestId = await privacySettingsService.createDataDeletionRequest(
          session.user.id,
          requestType,
          deletionScope,
          reason
        )

        if (requestId) {
          return NextResponse.json({ success: true, requestId })
        } else {
          return NextResponse.json(
            { error: 'Failed to create deletion request' },
            { status: 500 }
          )
        }

      case 'export-data':
        const userData = await privacySettingsService.exportUserData(session.user.id)
        
        if (userData) {
          return NextResponse.json({ success: true, data: userData })
        } else {
          return NextResponse.json(
            { error: 'Failed to export user data' },
            { status: 500 }
          )
        }

      case 'withdraw-gdpr-consent':
        const withdrawSuccess = await privacySettingsService.withdrawGDPRConsent(session.user.id)
        
        if (withdrawSuccess) {
          return NextResponse.json({ success: true })
        } else {
          return NextResponse.json(
            { error: 'Failed to withdraw GDPR consent' },
            { status: 500 }
          )
        }

      case 'cleanup-expired-data':
        const deletedCount = await privacySettingsService.cleanupExpiredData(session.user.id)
        return NextResponse.json({ success: true, deletedCount })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in privacy POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 处理数据删除请求（管理员功能）
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 检查用户是否有管理员权限
    const { createSupabaseServiceClient } = await import('@/lib/supabase')
    const supabase = createSupabaseServiceClient()
    
    const { data: user } = await supabase
      .from('yt_users')
      .select('plan')
      .eq('nextauth_user_id', session.user.id)
      .single()

    if (!user || !['admin', 'enterprise'].includes(user.plan)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const success = await privacySettingsService.processDeletionRequest(requestId)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to process deletion request' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing deletion request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}