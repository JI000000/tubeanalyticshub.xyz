import { NextRequest } from 'next/server';
import { getUserVideos, saveVideoToDatabase, videoExists } from '@/lib/database';
import { getVideoData, extractVideoId, YouTubeAPIError } from '@/lib/youtube-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const channelId = searchParams.get('channelId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return Response.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // 从数据库获取用户的视频数据
    const { videos, total } = await getUserVideos(userId, channelId || undefined, limit, offset);

    // 如果没有数据，返回模拟数据用于演示
    if (videos.length === 0) {
      const mockVideos = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
        id: `mock_video_${i + 1}`,
        title: `Sample Video ${i + 1}: How to Create Amazing Content`,
        description: `This is a sample video description for video ${i + 1}. It contains useful information about content creation and YouTube optimization.`,
        channel_id: channelId || 'sample_channel',
        channel_title: 'Sample Channel',
        published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
        view_count: Math.floor(Math.random() * 100000) + 1000,
        like_count: Math.floor(Math.random() * 5000) + 100,
        comment_count: Math.floor(Math.random() * 500) + 10,
        tags: ['tutorial', 'youtube', 'content creation', 'tips'],
        thumbnails: null,
        ai_summary: `This video covers key strategies for ${i % 2 === 0 ? 'content creation' : 'audience engagement'}.`,
        sentiment_score: (Math.random() * 2 - 1).toFixed(2), // -1 to 1
        keywords: ['youtube', 'tutorial', 'tips', 'strategy'],
        user_id: userId,
        scraped_at: new Date().toISOString()
      }));

      return Response.json({ 
        success: true, 
        data: mockVideos,
        pagination: {
          offset,
          limit,
          total: mockVideos.length,
          hasMore: false
        }
      });
    }

    return Response.json({ 
      success: true, 
      data: videos,
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Videos GET API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, userId } = body;

    if (!videoUrl || !userId) {
      return Response.json({ 
        success: false, 
        error: 'Video URL and User ID are required' 
      }, { status: 400 });
    }

    // 提取视频ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return Response.json({ 
        success: false, 
        error: 'Invalid YouTube video URL' 
      }, { status: 400 });
    }

    // 检查视频是否已存在
    const exists = await videoExists(videoId, userId);
    if (exists) {
      return Response.json({ 
        success: false, 
        error: 'Video already exists in your account' 
      }, { status: 409 });
    }

    // 从YouTube API获取视频数据
    let videoData;
    try {
      videoData = await getVideoData(videoId);
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        if (error.quotaExceeded) {
          return Response.json({ 
            success: false, 
            error: 'YouTube API quota exceeded. Please try again later.' 
          }, { status: 429 });
        }
        return Response.json({ 
          success: false, 
          error: `YouTube API error: ${error.message}` 
        }, { status: 400 });
      }
      throw error;
    }

    // 保存视频数据到数据库
    const savedVideo = await saveVideoToDatabase(videoData, userId);

    return Response.json({ 
      success: true, 
      data: savedVideo,
      message: 'Video added successfully'
    });

  } catch (error) {
    console.error('Videos POST API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}