/**
 * 用户反馈API端点
 * 
 * 提供反馈提交、查询和管理功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { feedbackSystem, FeedbackType, FeedbackPriority, FeedbackStatus } from '@/lib/feedback-system'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    // 验证必填字段
    if (!body.type || !body.title || !body.description) {
      return NextResponse.json(
        { error: 'Type, title, and description are required' },
        { status: 400 }
      )
    }

    // 验证反馈类型
    if (!Object.values(FeedbackType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    // 收集设备和会话信息
    const userAgent = request.headers.get('user-agent') || undefined
    const referer = request.headers.get('referer') || undefined

    // 构建反馈对象
    const feedback = {
      userId: session?.user?.id,
      email: body.email || session?.user?.email,
      type: body.type,
      title: body.title,
      description: body.description,
      priority: body.priority || FeedbackPriority.MEDIUM,
      status: FeedbackStatus.NEW,
      category: body.category,
      tags: body.tags || [],
      attachments: body.attachments || [],
      userAgent,
      url: referer,
      sessionId: body.sessionId,
      deviceInfo: body.deviceInfo,
      reproductionSteps: body.reproductionSteps,
      expectedBehavior: body.expectedBehavior,
      actualBehavior: body.actualBehavior
    }

    // 提交反馈
    const feedbackId = await feedbackSystem.submitFeedback(feedback)

    return NextResponse.json({
      success: true,
      feedbackId,
      message: 'Feedback submitted successfully'
    })
  } catch (error) {
    console.error('提交反馈失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to submit feedback',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    // 检查权限（管理员或用户自己的反馈）
    const isAdmin = (session?.user as any)?.role === 'admin'
    const userId = searchParams.get('userId')

    if (!isAdmin && userId && userId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // 构建过滤器
    const filters: any = {}
    
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type') as FeedbackType
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as FeedbackStatus
    }
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority') as FeedbackPriority
    }
    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')
    }
    if (userId) {
      filters.userId = userId
    } else if (!isAdmin && session?.user?.id) {
      // 非管理员只能看自己的反馈
      filters.userId = session.user.id
    }

    filters.limit = parseInt(searchParams.get('limit') || '20')
    filters.offset = parseInt(searchParams.get('offset') || '0')

    // 获取反馈列表
    const feedbackList = await feedbackSystem.getFeedbackList(filters)

    return NextResponse.json({
      success: true,
      data: feedbackList,
      meta: {
        limit: filters.limit,
        offset: filters.offset,
        count: feedbackList.length
      }
    })
  } catch (error) {
    console.error('获取反馈列表失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch feedback',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // 检查管理员权限
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { feedbackId, status, resolution, assignedTo } = body

    if (!feedbackId || !status) {
      return NextResponse.json(
        { error: 'Feedback ID and status are required' },
        { status: 400 }
      )
    }

    // 验证状态值
    if (!Object.values(FeedbackStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // 更新反馈状态
    const success = await feedbackSystem.updateFeedbackStatus(
      feedbackId,
      status,
      resolution,
      assignedTo
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully'
    })
  } catch (error) {
    console.error('更新反馈失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update feedback',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}