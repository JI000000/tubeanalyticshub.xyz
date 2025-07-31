import { NextRequest } from 'next/server';
import { getVideoComments as getDBVideoComments, saveCommentsToDatabase } from '@/lib/database';
import { getVideoComments, YouTubeAPIError } from '@/lib/youtube-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return Response.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // 从数据库获取视频评论
    const { comments, total } = await getDBVideoComments(videoId, userId, limit, offset);

    return Response.json({ 
      success: true, 
      data: comments,
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Video comments GET API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { userId, maxResults = 100 } = body;

    if (!userId) {
      return Response.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // 从YouTube API获取视频评论
    let result;
    try {
      result = await getVideoComments(videoId, maxResults);
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

    if (result.comments.length === 0) {
      return Response.json({ 
        success: true, 
        data: [],
        message: 'No comments found for this video'
      });
    }

    // 保存评论到数据库
    const savedComments = await saveCommentsToDatabase(result.comments, videoId, userId);

    return Response.json({ 
      success: true, 
      data: savedComments,
      message: `Successfully imported ${savedComments.length} comments`,
      nextPageToken: result.nextPageToken
    });

  } catch (error) {
    console.error('Video comments POST API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}