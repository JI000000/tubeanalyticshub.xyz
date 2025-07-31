import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI洞察生成器
class AIInsightsGenerator {
  static async generateInsights(userId: string) {
    try {
      // 获取用户的视频数据
      const { data: videos, error: videosError } = await supabase
        .from('yt_videos')
        .select('*')
        .eq('user_id', userId)
        .order('published_at', { ascending: false })
        .limit(50);

      if (videosError) throw videosError;

      // 获取用户的频道数据
      const { data: channels, error: channelsError } = await supabase
        .from('yt_channels')
        .select('*')
        .eq('user_id', userId);

      if (channelsError) throw channelsError;

      const insights = [];

      // 生成基于数据的洞察
      if (videos && videos.length > 0) {
        // 1. 视频表现分析
        const avgViews = videos.reduce((sum, v) => sum + (v.view_count || 0), 0) / videos.length;
        const topPerformers = videos.filter(v => (v.view_count || 0) > avgViews * 1.5);
        
        if (topPerformers.length > 0) {
          insights.push({
            id: `insight-performance-${Date.now()}`,
            type: 'opportunity',
            title: 'High-Performing Content Pattern Identified',
            description: `${topPerformers.length} videos are performing 50% above average. Consider creating similar content.`,
            confidence_score: 0.8,
            importance: 'high',
            category: 'content',
            created_at: new Date().toISOString(),
            metadata: {
              affected_videos: topPerformers.length,
              avg_views: Math.round(avgViews),
              top_performer_avg: Math.round(topPerformers.reduce((sum, v) => sum + (v.view_count || 0), 0) / topPerformers.length),
              action_items: ['Analyze top-performing video topics', 'Create similar content']
            }
          });
        }

        // 2. 发布频率分析
        const recentVideos = videos.filter(v => {
          const publishDate = new Date(v.published_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return publishDate > thirtyDaysAgo;
        });

        if (recentVideos.length < 4) {
          insights.push({
            id: `insight-frequency-${Date.now()}`,
            type: 'warning',
            title: 'Low Upload Frequency Detected',
            description: `Only ${recentVideos.length} videos uploaded in the last 30 days. Consistent uploading can improve channel growth.`,
            confidence_score: 0.9,
            importance: 'medium',
            category: 'timing',
            created_at: new Date().toISOString(),
            metadata: {
              recent_uploads: recentVideos.length,
              recommended_frequency: '2-3 videos per week',
              action_items: ['Create content calendar', 'Increase upload frequency']
            }
          });
        }

        // 3. 参与度分析
        const videosWithEngagement = videos.filter(v => v.like_count && v.comment_count);
        if (videosWithEngagement.length > 0) {
          const avgEngagementRate = videosWithEngagement.reduce((sum, v) => {
            const engagement = ((v.like_count || 0) + (v.comment_count || 0)) / (v.view_count || 1);
            return sum + engagement;
          }, 0) / videosWithEngagement.length;

          if (avgEngagementRate < 0.02) {
            insights.push({
              id: `insight-engagement-${Date.now()}`,
              type: 'recommendation',
              title: 'Engagement Rate Below Industry Average',
              description: `Current engagement rate is ${(avgEngagementRate * 100).toFixed(2)}%. Industry average is 2-3%.`,
              confidence_score: 0.75,
              importance: 'medium',
              category: 'audience',
              created_at: new Date().toISOString(),
              metadata: {
                current_rate: (avgEngagementRate * 100).toFixed(2) + '%',
                industry_average: '2-3%',
                action_items: ['Add call-to-actions', 'Improve thumbnail design', 'Engage with comments']
              }
            });
          }
        }
      }

      // 4. 频道增长分析
      if (channels && channels.length > 0) {
        const totalSubscribers = channels.reduce((sum, c) => sum + (c.subscriber_count || 0), 0);
        const totalVideos = channels.reduce((sum, c) => sum + (c.video_count || 0), 0);
        
        if (totalVideos > 10 && totalSubscribers < totalVideos * 100) {
          insights.push({
            id: `insight-growth-${Date.now()}`,
            type: 'opportunity',
            title: 'Subscriber Growth Potential Identified',
            description: `With ${totalVideos} videos, your channel could potentially reach ${totalVideos * 100} subscribers with optimization.`,
            confidence_score: 0.7,
            importance: 'high',
            category: 'audience',
            created_at: new Date().toISOString(),
            metadata: {
              current_subscribers: totalSubscribers,
              potential_subscribers: totalVideos * 100,
              video_count: totalVideos,
              action_items: ['Optimize video SEO', 'Create compelling thumbnails', 'Add end screens']
            }
          });
        }
      }

      // 如果没有足够数据生成洞察，提供通用建议
      if (insights.length === 0) {
        insights.push({
          id: `insight-general-${Date.now()}`,
          type: 'recommendation',
          title: 'Start Building Your Analytics Foundation',
          description: 'Add more videos and channels to get personalized AI insights based on your content performance.',
          confidence_score: 1.0,
          importance: 'medium',
          category: 'general',
          created_at: new Date().toISOString(),
          metadata: {
            action_items: ['Add more channels', 'Upload more videos', 'Enable analytics tracking']
          }
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 首先尝试从数据库获取已存储的洞察
    const { data: existingInsights, error: fetchError } = await supabase
      .from('yt_ai_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching existing insights:', fetchError);
    }

    // 如果有最近的洞察（24小时内），直接返回
    const recentInsights = existingInsights?.filter(insight => {
      const createdAt = new Date(insight.created_at);
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      return createdAt > twentyFourHoursAgo;
    }) || [];

    if (recentInsights.length > 0) {
      return NextResponse.json({
        success: true,
        data: recentInsights.map(insight => ({
          id: insight.id,
          type: insight.analysis_type,
          title: insight.insights.title || 'AI Insight',
          description: insight.insights.description || '',
          confidence_score: insight.confidence_score,
          importance: insight.insight_category,
          category: insight.analysis_type,
          created_at: insight.created_at,
          metadata: insight.insights.metadata || {}
        })),
        cached: true
      });
    }

    // 生成新的洞察
    const newInsights = await AIInsightsGenerator.generateInsights(userId);

    // 保存新洞察到数据库
    for (const insight of newInsights) {
      try {
        await supabase
          .from('yt_ai_insights')
          .insert({
            user_id: userId,
            target_id: 'general',
            target_type: 'channel',
            analysis_type: insight.category,
            insights: {
              title: insight.title,
              description: insight.description,
              metadata: insight.metadata
            },
            confidence_score: insight.confidence_score,
            insight_category: insight.importance,
            actionable_recommendations: insight.metadata.action_items || []
          });
      } catch (insertError) {
        console.error('Error saving insight:', insertError);
        // 继续处理其他洞察，不因单个失败而中断
      }
    }

    return NextResponse.json({
      success: true,
      data: newInsights,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, targetId, targetType } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (action === 'regenerate') {
      // 删除旧的洞察
      await supabase
        .from('yt_ai_insights')
        .delete()
        .eq('user_id', userId);

      // 生成新的洞察
      const newInsights = await AIInsightsGenerator.generateInsights(userId);

      // 保存新洞察到数据库
      for (const insight of newInsights) {
        try {
          await supabase
            .from('yt_ai_insights')
            .insert({
              user_id: userId,
              target_id: targetId || 'general',
              target_type: targetType || 'channel',
              analysis_type: insight.category,
              insights: {
                title: insight.title,
                description: insight.description,
                metadata: insight.metadata
              },
              confidence_score: insight.confidence_score,
              insight_category: insight.importance,
              actionable_recommendations: insight.metadata.action_items || []
            });
        } catch (insertError) {
          console.error('Error saving insight:', insertError);
        }
      }

      return NextResponse.json({
        success: true,
        data: newInsights,
        message: 'Insights regenerated successfully'
      });
    }

    if (action === 'feedback') {
      const { insightId, helpful, feedback } = body;
      
      // 这里可以保存用户反馈，用于改进AI算法
      // 暂时只记录日志
      console.log('User feedback:', { insightId, helpful, feedback, userId });

      return NextResponse.json({
        success: true,
        message: 'Feedback recorded successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error processing insights request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}