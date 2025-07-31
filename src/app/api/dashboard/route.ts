import { NextRequest } from 'next/server';
import { getUserStats } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // 获取用户统计数据
    const stats = await getUserStats(userId);

    // 如果没有真实数据，返回模拟数据用于演示
    if (stats.totalChannels === 0) {
      return Response.json({
        success: true,
        data: {
          totalChannels: 12,
          totalVideos: 156,
          totalComments: 2847,
          totalViews: 1250000,
          totalSubscribers: 45600,
          totalLikes: 8920,
          lastUpdated: new Date().toISOString()
        }
      });
    }

    return Response.json({ 
      success: true, 
      data: {
        ...stats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}