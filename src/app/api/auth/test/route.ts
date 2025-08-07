import { getServerAuthSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerAuthSession()
    
    return NextResponse.json({
      success: true,
      authenticated: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get session',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}