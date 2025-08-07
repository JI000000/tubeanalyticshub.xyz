import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createSupabaseServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // This is a test endpoint to simulate session expiry
    // In a real scenario, you would update the session expiry time in the database
    const supabase = createSupabaseServiceClient()
    
    // Log the forced expiry event
    await supabase
      .from('yt_login_analytics')
      .insert({
        user_id: session.user.id,
        event_type: 'forced_expiry',
        context: {
          reason: 'test',
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })
    
    // For testing purposes, we'll just return success
    // The actual session expiry would be handled by NextAuth.js
    return NextResponse.json({ 
      success: true,
      message: 'Session expiry simulated (for testing only)'
    })
  } catch (error) {
    console.error('Force session expiry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}