import { NextRequest, NextResponse } from 'next/server'
import { getSessionStats, requireValidSession } from '@/lib/session-manager'

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await requireValidSession()
    
    // Get session statistics for the current user
    const stats = await getSessionStats(session.user.id)
    
    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to retrieve session statistics' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Session stats API error:', error)
    
    if (error instanceof Error && error.message === 'Session expired or invalid') {
      return NextResponse.json(
        { 
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
          message: '会话已过期，请重新登录'
        },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}