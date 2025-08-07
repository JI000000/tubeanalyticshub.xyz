/**
 * Health Check API Endpoint
 * 
 * Provides system health status for error recovery mechanisms
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Test database connectivity
    const supabase = createSupabaseServiceClient();
    const { error: dbError } = await supabase
      .from('yt_users')
      .select('id')
      .limit(1);

    const dbHealthy = !dbError;
    const responseTime = Date.now() - startTime;

    // Determine overall health
    const healthy = dbHealthy && responseTime < 5000; // 5 second threshold

    const healthData = {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          responseTime: responseTime,
          error: dbError?.message || null,
        },
        api: {
          status: 'healthy',
          responseTime: responseTime,
        },
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(healthData, {
      status: healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'unhealthy',
          responseTime: responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        api: {
          status: 'unhealthy',
          responseTime: responseTime,
        },
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

export async function HEAD(request: NextRequest) {
  try {
    // Quick health check for HEAD requests (used by error recovery)
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('yt_users')
      .select('id')
      .limit(1);

    return new NextResponse(null, {
      status: error ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}