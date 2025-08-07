/**
 * 登录漏斗分析API端点
 * 提供登录流程各步骤的转化率和流失率数据
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
    
    // 获取漏斗分析数据
    const funnelData = await LoginAnalyticsService.getFunnelData(startDate, endDate);
    
    // 计算总体漏斗指标
    const totalPrompts = funnelData.find(step => step.step === 'prompt_shown')?.count || 0;
    const totalAttempts = funnelData.find(step => step.step === 'login_attempt')?.count || 0;
    const totalSuccesses = funnelData.find(step => step.step === 'login_success')?.count || 0;
    
    const overallConversionRate = totalPrompts > 0 
      ? (totalSuccesses / totalPrompts) * 100 
      : 0;
    
    const promptToAttemptRate = totalPrompts > 0 
      ? (totalAttempts / totalPrompts) * 100 
      : 0;
    
    const attemptToSuccessRate = totalAttempts > 0 
      ? (totalSuccesses / totalAttempts) * 100 
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        funnel_steps: funnelData,
        summary: {
          total_prompts: totalPrompts,
          total_attempts: totalAttempts,
          total_successes: totalSuccesses,
          overall_conversion_rate: Math.round(overallConversionRate * 100) / 100,
          prompt_to_attempt_rate: Math.round(promptToAttemptRate * 100) / 100,
          attempt_to_success_rate: Math.round(attemptToSuccessRate * 100) / 100,
        },
      },
      meta: {
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get login funnel data:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to retrieve login funnel analysis data'
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