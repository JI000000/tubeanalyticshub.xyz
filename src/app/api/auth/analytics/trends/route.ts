/**
 * 登录趋势分析API端点
 * 提供登录事件的时间序列数据，用于趋势分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoginAnalyticsService, type LoginAnalyticsEventType } from '@/lib/login-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 获取查询参数
    const eventType = searchParams.get('event_type') as LoginAnalyticsEventType;
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const interval = searchParams.get('interval') as 'hour' | 'day' | 'week' || 'day';
    
    // 验证事件类型
    const validEventTypes: LoginAnalyticsEventType[] = [
      'prompt_shown',
      'login_attempt',
      'login_success',
      'login_failed',
      'login_cancelled',
      'login_skipped',
    ];
    
    if (!eventType || !validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { 
          error: 'Invalid event_type parameter',
          valid_types: validEventTypes
        },
        { status: 400 }
      );
    }
    
    // 验证时间间隔
    const validIntervals = ['hour', 'day', 'week'];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { 
          error: 'Invalid interval parameter',
          valid_intervals: validIntervals
        },
        { status: 400 }
      );
    }
    
    // 解析日期参数
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    
    // 验证日期参数
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start_date parameter' },
        { status: 400 }
      );
    }
    
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid end_date parameter' },
        { status: 400 }
      );
    }
    
    // 获取时间序列数据
    const timeSeriesData = await LoginAnalyticsService.getTimeSeriesData(
      eventType,
      startDate,
      endDate,
      interval
    );
    
    // 计算趋势指标
    const totalCount = timeSeriesData.reduce((sum, item) => sum + item.count, 0);
    const averagePerPeriod = timeSeriesData.length > 0 
      ? totalCount / timeSeriesData.length 
      : 0;
    
    // 计算增长率（与前一个周期比较）
    let growthRate = 0;
    if (timeSeriesData.length >= 2) {
      const latest = timeSeriesData[timeSeriesData.length - 1].count;
      const previous = timeSeriesData[timeSeriesData.length - 2].count;
      growthRate = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
    }
    
    // 找出峰值和低谷
    const maxCount = Math.max(...timeSeriesData.map(item => item.count));
    const minCount = Math.min(...timeSeriesData.map(item => item.count));
    const peakDate = timeSeriesData.find(item => item.count === maxCount)?.date;
    const lowDate = timeSeriesData.find(item => item.count === minCount)?.date;
    
    return NextResponse.json({
      success: true,
      data: {
        event_type: eventType,
        interval,
        time_series: timeSeriesData,
        summary: {
          total_count: totalCount,
          average_per_period: Math.round(averagePerPeriod * 100) / 100,
          growth_rate: Math.round(growthRate * 100) / 100,
          peak_count: maxCount,
          peak_date: peakDate,
          low_count: minCount,
          low_date: lowDate,
          data_points: timeSeriesData.length,
        },
      },
      meta: {
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get login trends data:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to retrieve login trends analysis data'
      },
      { status: 500 }
    );
  }
}

// 支持CORS预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}