import { NextRequest } from 'next/server';
import { saveVideosToDatabase } from '@/lib/database';
import { getChannelVideos, YouTubeAPIError } from '@/lib/youtube-api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const body = await request.json();
    const { userId, maxResults = 50 } = body;

    if (!userId) {
      return Response.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // 从YouTube API获取频道视频
    let result;
    try {
      result = await getChannelVideos(channelId, maxResults);
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

    if (result.videos.length === 0) {
      return Response.json({ 
        success: true, 
        data: [],
        message: 'No videos found for this channel'
      });
    }

    // 批量保存视频到数据库
    const savedVideos = await saveVideosToDatabase(result.videos, userId);

    return Response.json({ 
      success: true, 
      data: savedVideos,
      message: `Successfully imported ${savedVideos.length} videos`,
      nextPageToken: result.nextPageToken
    });

  } catch (error) {
    console.error('Channel videos API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}