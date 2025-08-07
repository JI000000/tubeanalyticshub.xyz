/**
 * 登录分析统计API端点
 * 提供登录转化率、成功率等统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoginAnalyticsService } from '@/lib/login-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 获取查询参数
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    
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
    
    // 获取转化率统计
    const stats = await LoginAnalyticsService.getConversionStats(startDate, endDate);
    
    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get login analytics stats:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to retrieve login analytics statistics'
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