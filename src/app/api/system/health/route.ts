import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 系统启动时间
const startTime = Date.now();

// GET /api/system/health - 获取系统健康状态
export async function GET(request: NextRequest) {
  try {
    const healthCheck = await performHealthCheck();
    
    return NextResponse.json({
      success: true,
      data: healthCheck
    });

  } catch (error) {
    console.error('Error performing health check:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Health check failed',
        data: {
          status: 'critical',
          message: 'System health check failed',
          metrics: getDefaultMetrics()
        }
      },
      { status: 500 }
    );
  }
}

async function performHealthCheck() {
  const metrics = {
    api_response_time: 0,
    database_query_time: 0,
    memory_usage: 0,
    cpu_usage: 0,
    active_connections: 0,
    cache_hit_rate: 0,
    error_rate: 0,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    last_updated: new Date().toISOString()
  };

  // 测试API响应时间
  const apiStart = Date.now();
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100)); // 模拟API处理时间
  metrics.api_response_time = Date.now() - apiStart;

  // 测试数据库查询时间
  const dbStart = Date.now();
  try {
    await supabase.from('yt_users').select('count').limit(1);
    metrics.database_query_time = Date.now() - dbStart;
  } catch (error) {
    metrics.database_query_time = 5000; // 超时标记
  }

  // 模拟系统指标（在实际环境中，这些应该从系统监控工具获取）
  metrics.memory_usage = Math.floor(Math.random() * 40) + 30; // 30-70%
  metrics.cpu_usage = Math.floor(Math.random() * 30) + 10; // 10-40%
  metrics.active_connections = Math.floor(Math.random() * 50) + 10; // 10-60
  metrics.cache_hit_rate = Math.floor(Math.random() * 20) + 80; // 80-100%
  metrics.error_rate = Math.random() * 2; // 0-2%

  // 获取实际的数据库连接统计（如果可用）
  try {
    const { data: stats } = await supabase.rpc('get_db_stats');
    if (stats) {
      metrics.active_connections = stats.active_connections || metrics.active_connections;
    }
  } catch (error) {
    // 忽略统计获取错误
  }

  // 确定系统健康状态
  const status = determineSystemStatus(metrics);
  const message = getStatusMessage(status, metrics);

  return {
    status,
    message,
    metrics
  };
}

function determineSystemStatus(metrics: any): 'healthy' | 'warning' | 'critical' {
  // 关键指标检查
  if (
    metrics.api_response_time > 5000 ||
    metrics.database_query_time > 3000 ||
    metrics.memory_usage > 90 ||
    metrics.cpu_usage > 90 ||
    metrics.error_rate > 5
  ) {
    return 'critical';
  }

  // 警告指标检查
  if (
    metrics.api_response_time > 2000 ||
    metrics.database_query_time > 1000 ||
    metrics.memory_usage > 80 ||
    metrics.cpu_usage > 80 ||
    metrics.cache_hit_rate < 70 ||
    metrics.error_rate > 1
  ) {
    return 'warning';
  }

  return 'healthy';
}

function getStatusMessage(status: string, metrics: any): string {
  switch (status) {
    case 'healthy':
      return 'All systems operating normally';
    case 'warning':
      const warnings = [];
      if (metrics.api_response_time > 2000) warnings.push('slow API response');
      if (metrics.database_query_time > 1000) warnings.push('slow database queries');
      if (metrics.memory_usage > 80) warnings.push('high memory usage');
      if (metrics.cpu_usage > 80) warnings.push('high CPU usage');
      if (metrics.cache_hit_rate < 70) warnings.push('low cache hit rate');
      if (metrics.error_rate > 1) warnings.push('elevated error rate');
      
      return `Performance issues detected: ${warnings.join(', ')}`;
    case 'critical':
      const criticals = [];
      if (metrics.api_response_time > 5000) criticals.push('API timeout');
      if (metrics.database_query_time > 3000) criticals.push('database timeout');
      if (metrics.memory_usage > 90) criticals.push('memory exhaustion');
      if (metrics.cpu_usage > 90) criticals.push('CPU overload');
      if (metrics.error_rate > 5) criticals.push('high error rate');
      
      return `Critical issues: ${criticals.join(', ')}`;
    default:
      return 'System status unknown';
  }
}

function getDefaultMetrics() {
  return {
    api_response_time: 0,
    database_query_time: 0,
    memory_usage: 0,
    cpu_usage: 0,
    active_connections: 0,
    cache_hit_rate: 0,
    error_rate: 0,
    uptime: 0,
    last_updated: new Date().toISOString()
  };
}

// POST /api/system/health - 手动触发健康检查
export async function POST(request: NextRequest) {
  try {
    const healthCheck = await performHealthCheck();
    
    // 记录健康检查结果到数据库（可选）
    try {
      await supabase.from('yt_system_health_logs').insert({
        status: healthCheck.status,
        metrics: healthCheck.metrics,
        message: healthCheck.message,
        checked_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log health check:', logError);
    }
    
    return NextResponse.json({
      success: true,
      data: healthCheck,
      message: 'Health check completed'
    });

  } catch (error) {
    console.error('Error performing manual health check:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Manual health check failed' 
      },
      { status: 500 }
    );
  }
}