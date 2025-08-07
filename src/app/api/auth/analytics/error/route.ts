/**
 * Authentication Error Analytics API
 * 
 * Tracks authentication errors for analysis and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase';
import { AuthErrorType } from '@/types/auth-errors';

interface ErrorAnalyticsRequest {
  error_type: AuthErrorType;
  message: string;
  context?: {
    provider?: string;
    action?: string;
    url?: string;
    userAgent?: string;
    [key: string]: any;
  };
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ErrorAnalyticsRequest = await request.json();
    
    // Validate required fields
    if (!body.error_type || !body.message || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get client information
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Create Supabase client
    const supabase = createSupabaseServiceClient();

    // Insert error analytics record
    const { error } = await supabase
      .from('yt_login_analytics')
      .insert({
        event_type: 'login_error',
        trigger_type: body.error_type,
        provider: body.context?.provider || null,
        context: {
          error_message: body.message,
          error_type: body.error_type,
          action: body.context?.action,
          url: body.context?.url,
          user_agent: body.context?.userAgent || userAgent,
          ...body.context,
        },
        device_info: {
          user_agent: userAgent,
          ip_address: ip,
        },
        ip_address: ip,
        created_at: body.timestamp,
      });

    if (error) {
      console.error('Error inserting analytics:', error);
      return NextResponse.json(
        { error: 'Failed to record analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}