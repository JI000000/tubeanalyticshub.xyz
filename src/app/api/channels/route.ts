import { NextRequest } from 'next/server';
import { getUserChannels, saveChannelToDatabase, channelExists } from '@/lib/database';
import { getChannelData, getChannelByUsername, extractChannelId, YouTubeAPIError } from '@/lib/youtube-api';

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

    // 从数据库获取用户的频道数据
    const channels = await getUserChannels(userId);

    return Response.json({ 
      success: true, 
      data: channels 
    });

  } catch (error) {
    console.error('Channels GET API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelUrl, userId } = body;

    if (!channelUrl || !userId) {
      return Response.json({ 
        success: false, 
        error: 'Channel URL and User ID are required' 
      }, { status: 400 });
    }

    // 提取频道ID
    const channelId = extractChannelId(channelUrl);
    let channelData;

    try {
      if (channelId) {
        // 如果是频道ID，直接获取频道数据
        if (channelId.startsWith('UC')) {
          channelData = await getChannelData(channelId);
        } else {
          // 如果是用户名或自定义URL，通过用户名获取
          channelData = await getChannelByUsername(channelId);
        }
      } else {
        return Response.json({ 
          success: false, 
          error: 'Invalid YouTube channel URL' 
        }, { status: 400 });
      }
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

    // 检查频道是否已存在
    const exists = await channelExists(channelData.id, userId);
    if (exists) {
      return Response.json({ 
        success: false, 
        error: 'Channel already exists in your account' 
      }, { status: 409 });
    }

    // 保存频道数据到数据库
    const savedChannel = await saveChannelToDatabase(channelData, userId);

    return Response.json({ 
      success: true, 
      data: savedChannel,
      message: 'Channel added successfully'
    });

  } catch (error) {
    console.error('Channels POST API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}