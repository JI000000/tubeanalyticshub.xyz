import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 报告生成器
class ReportGenerator {
  static async generateReport(userId: string, reportType: string, templateId: string, title: string) {
    try {
      // 获取用户数据
      const [channelsResult, videosResult] = await Promise.all([
        supabase
          .from('yt_channels')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('yt_videos')
          .select('*')
          .eq('user_id', userId)
          .order('published_at', { ascending: false })
      ]);

      const channels = channelsResult.data || [];
      const videos = videosResult.data || [];

      // 生成报告内容
      const reportContent = this.generateReportContent(channels, videos, reportType, templateId);

      // 创建报告记录
      const reportData = {
        user_id: userId,
        title: title || `${reportType} Report`,
        report_type: reportType,
        template_type: templateId,
        content: reportContent,
        metadata: {
          channels_count: channels.length,
          videos_count: videos.length,
          generated_at: new Date().toISOString(),
          template_id: templateId
        },
        is_public: false,
        version: 1
      };

      const { data: report, error } = await supabase
        .from('yt_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        console.error('Error saving report:', error);
        // 如果数据库保存失败，仍然返回生成的内容
        return {
          id: `temp_${Date.now()}`,
          ...reportData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  static generateReportContent(channels: any[], videos: any[], reportType: string, templateId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 基础统计
    const totalViews = videos.reduce((sum, v) => sum + (v.view_count || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.like_count || 0), 0);
    const totalComments = videos.reduce((sum, v) => sum + (v.comment_count || 0), 0);
    const totalSubscribers = channels.reduce((sum, c) => sum + (c.subscriber_count || 0), 0);

    // 最近30天的视频
    const recentVideos = videos.filter(v => new Date(v.published_at) > thirtyDaysAgo);
    const avgViewsRecent = recentVideos.length > 0 
      ? recentVideos.reduce((sum, v) => sum + (v.view_count || 0), 0) / recentVideos.length 
      : 0;

    // 根据报告类型生成不同内容
    switch (reportType) {
      case 'performance':
        return {
          summary: {
            total_channels: channels.length,
            total_videos: videos.length,
            total_views: totalViews,
            total_subscribers: totalSubscribers,
            avg_views_per_video: videos.length > 0 ? Math.round(totalViews / videos.length) : 0,
            engagement_rate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : '0.00'
          },
          recent_performance: {
            videos_last_30_days: recentVideos.length,
            avg_views_recent: Math.round(avgViewsRecent),
            upload_frequency: (recentVideos.length / 30 * 7).toFixed(1) + ' per week'
          },
          top_performers: videos
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 5)
            .map(v => ({
              title: v.title,
              views: v.view_count || 0,
              likes: v.like_count || 0,
              comments: v.comment_count || 0,
              published_at: v.published_at
            })),
          recommendations: this.generateRecommendations(channels, videos)
        };

      case 'competitor':
        return {
          summary: 'Competitor analysis report',
          channels_analyzed: channels.length,
          comparison_metrics: {
            subscriber_growth: 'Analysis pending',
            content_strategy: 'Analysis pending',
            engagement_comparison: 'Analysis pending'
          }
        };

      case 'trend':
        return {
          summary: 'Trend analysis report',
          trending_topics: this.extractTrendingTopics(videos),
          performance_trends: this.analyzeTrends(videos),
          predictions: 'Trend predictions based on historical data'
        };

      default:
        return {
          summary: `Custom ${reportType} report`,
          data_overview: {
            channels: channels.length,
            videos: videos.length,
            total_views: totalViews
          }
        };
    }
  }

  static generateRecommendations(channels: any[], videos: any[]) {
    const recommendations = [];

    // 上传频率建议
    const recentVideos = videos.filter(v => {
      const publishDate = new Date(v.published_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return publishDate > thirtyDaysAgo;
    });

    if (recentVideos.length < 4) {
      recommendations.push({
        type: 'upload_frequency',
        priority: 'high',
        title: 'Increase Upload Frequency',
        description: 'Consider uploading 2-3 videos per week for better channel growth.'
      });
    }

    // 参与度建议
    const avgEngagement = videos.length > 0 
      ? videos.reduce((sum, v) => sum + ((v.like_count || 0) + (v.comment_count || 0)) / Math.max(v.view_count || 1, 1), 0) / videos.length
      : 0;

    if (avgEngagement < 0.02) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        title: 'Improve Engagement',
        description: 'Add call-to-actions and engage more with your audience in comments.'
      });
    }

    return recommendations;
  }

  static extractTrendingTopics(videos: any[]) {
    // 简单的关键词提取
    const keywords: { [key: string]: number } = {};
    
    videos.forEach(video => {
      if (video.tags && Array.isArray(video.tags)) {
        video.tags.forEach((tag: string) => {
          keywords[tag] = (keywords[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, frequency: count }));
  }

  static analyzeTrends(videos: any[]) {
    // 按月分组分析趋势
    const monthlyData: { [key: string]: { views: number, count: number } } = {};
    
    videos.forEach(video => {
      const month = new Date(video.published_at).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { views: 0, count: 0 };
      }
      monthlyData[month].views += video.view_count || 0;
      monthlyData[month].count += 1;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        total_views: data.views,
        video_count: data.count,
        avg_views: data.count > 0 ? Math.round(data.views / data.count) : 0
      }));
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

    // 从数据库获取用户的报告
    const { data: reports, error } = await supabase
      .from('yt_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching reports from database:', error);
      // 如果数据库查询失败，返回空数组而不是错误
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No reports found or database unavailable'
      });
    }

    // 格式化报告数据
    const formattedReports = (reports || []).map(report => ({
      id: report.id,
      title: report.title,
      description: `${report.report_type} report generated on ${new Date(report.created_at).toLocaleDateString()}`,
      type: report.report_type,
      template_type: report.template_type,
      status: 'completed',
      created_at: report.created_at,
      updated_at: report.updated_at,
      metadata: report.metadata,
      is_public: report.is_public,
      version: report.version
    }));

    return NextResponse.json({
      success: true,
      data: formattedReports
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reportType, templateId, title, description } = body;

    if (!userId || !reportType) {
      return NextResponse.json(
        { success: false, error: 'User ID and report type are required' },
        { status: 400 }
      );
    }

    // 设置默认值
    const finalTemplateId = templateId || 'standard';
    const finalTitle = title || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;

    // 生成报告
    const report = await ReportGenerator.generateReport(
      userId,
      reportType,
      finalTemplateId,
      finalTitle
    );

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        title: report.title,
        type: report.report_type,
        template_type: report.template_type,
        status: 'completed',
        created_at: report.created_at,
        content: report.content,
        metadata: report.metadata
      },
      message: 'Report generated successfully'
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    );
  }
}