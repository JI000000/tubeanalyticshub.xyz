import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredSessions } from '@/lib/session-manager'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron job or authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Clean up expired sessions
    await cleanupExpiredSessions()
    
    return NextResponse.json({ 
      success: true,
      message: 'Expired sessions cleaned up successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Session cleanup error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to cleanup expired sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'Session cleanup endpoint is healthy',
    timestamp: new Date().toISOString()
  })
}