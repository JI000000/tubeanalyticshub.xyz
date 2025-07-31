/**
 * YouTube Data API v3 集成服务
 * 提供YouTube数据获取的核心功能
 */

// YouTube API配置
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.warn('YouTube API key not found. Please set YOUTUBE_API_KEY environment variable.');
}

// 类型定义
export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    high?: { url: string; width: number; height: number };
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  brandingSettings?: {
    channel?: {
      title: string;
      description: string;
      keywords?: string;
      country?: string;
    };
  };
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    high?: { url: string; width: number; height: number };
    standard?: { url: string; width: number; height: number };
    maxres?: { url: string; width: number; height: number };
  };
  duration: string;
  statistics: {
    viewCount: string;
    likeCount?: string;
    commentCount?: string;
  };
  tags?: string[];
}

export interface YouTubeComment {
  id: string;
  textDisplay: string;
  textOriginal: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelUrl: string;
  authorChannelId: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  parentId?: string;
  totalReplyCount?: number;
}

// 错误处理类
export class YouTubeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public quotaExceeded?: boolean
  ) {
    super(message);
    this.name = 'YouTubeAPIError';
  }
}

// API请求基础函数
async function makeYouTubeAPIRequest(endpoint: string, params: Record<string, string>) {
  if (!API_KEY) {
    throw new YouTubeAPIError('YouTube API key not configured');
  }

  const url = new URL(`${YOUTUBE_API_BASE_URL}/${endpoint}`);
  url.searchParams.set('key', API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 403 && errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
        throw new YouTubeAPIError('YouTube API quota exceeded', 403, true);
      }
      
      throw new YouTubeAPIError(
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      throw error;
    }
    throw new YouTubeAPIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// URL解析工具函数
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // 如果已经是视频ID格式
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

export function extractChannelId(url: string): string | null {
  const patterns = [
    /youtube\.com\/channel\/([^\/\n?#]+)/,
    /youtube\.com\/c\/([^\/\n?#]+)/,
    /youtube\.com\/user\/([^\/\n?#]+)/,
    /youtube\.com\/@([^\/\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // 如果已经是频道ID格式
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(url)) {
    return url;
  }

  return null;
}

// 时长转换工具函数
export function parseDuration(duration: string): number {
  // 将ISO 8601时长格式 (PT4M13S) 转换为秒数
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

// 主要API函数

/**
 * 获取频道信息
 */
export async function getChannelData(channelId: string): Promise<YouTubeChannel> {
  const response = await makeYouTubeAPIRequest('channels', {
    part: 'snippet,statistics,brandingSettings',
    id: channelId
  });

  if (!response.items || response.items.length === 0) {
    throw new YouTubeAPIError('Channel not found');
  }

  const channel = response.items[0];
  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    customUrl: channel.snippet.customUrl,
    publishedAt: channel.snippet.publishedAt,
    thumbnails: channel.snippet.thumbnails,
    statistics: channel.statistics,
    brandingSettings: channel.brandingSettings
  };
}

/**
 * 通过用户名或自定义URL获取频道信息
 */
export async function getChannelByUsername(username: string): Promise<YouTubeChannel> {
  const response = await makeYouTubeAPIRequest('channels', {
    part: 'snippet,statistics,brandingSettings',
    forUsername: username
  });

  if (!response.items || response.items.length === 0) {
    throw new YouTubeAPIError('Channel not found');
  }

  const channel = response.items[0];
  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    customUrl: channel.snippet.customUrl,
    publishedAt: channel.snippet.publishedAt,
    thumbnails: channel.snippet.thumbnails,
    statistics: channel.statistics,
    brandingSettings: channel.brandingSettings
  };
}

/**
 * 获取视频信息
 */
export async function getVideoData(videoId: string): Promise<YouTubeVideo> {
  const response = await makeYouTubeAPIRequest('videos', {
    part: 'snippet,statistics,contentDetails',
    id: videoId
  });

  if (!response.items || response.items.length === 0) {
    throw new YouTubeAPIError('Video not found');
  }

  const video = response.items[0];
  return {
    id: video.id,
    title: video.snippet.title,
    description: video.snippet.description,
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    thumbnails: video.snippet.thumbnails,
    duration: video.contentDetails.duration,
    statistics: video.statistics,
    tags: video.snippet.tags
  };
}

/**
 * 获取频道的视频列表
 */
export async function getChannelVideos(
  channelId: string, 
  maxResults: number = 50,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> {
  // 首先获取频道的上传播放列表ID
  const channelResponse = await makeYouTubeAPIRequest('channels', {
    part: 'contentDetails',
    id: channelId
  });

  if (!channelResponse.items || channelResponse.items.length === 0) {
    throw new YouTubeAPIError('Channel not found');
  }

  const uploadsPlaylistId = channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

  // 获取播放列表中的视频
  const playlistResponse = await makeYouTubeAPIRequest('playlistItems', {
    part: 'snippet',
    playlistId: uploadsPlaylistId,
    maxResults: maxResults.toString(),
    ...(pageToken && { pageToken })
  });

  const videoIds = playlistResponse.items.map((item: any) => item.snippet.resourceId.videoId);

  if (videoIds.length === 0) {
    return { videos: [] };
  }

  // 获取视频详细信息
  const videosResponse = await makeYouTubeAPIRequest('videos', {
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(',')
  });

  const videos = videosResponse.items.map((video: any) => ({
    id: video.id,
    title: video.snippet.title,
    description: video.snippet.description,
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    thumbnails: video.snippet.thumbnails,
    duration: video.contentDetails.duration,
    statistics: video.statistics,
    tags: video.snippet.tags
  }));

  return {
    videos,
    nextPageToken: playlistResponse.nextPageToken
  };
}

/**
 * 获取视频评论
 */
export async function getVideoComments(
  videoId: string,
  maxResults: number = 100,
  pageToken?: string
): Promise<{ comments: YouTubeComment[]; nextPageToken?: string }> {
  const response = await makeYouTubeAPIRequest('commentThreads', {
    part: 'snippet,replies',
    videoId,
    maxResults: maxResults.toString(),
    order: 'relevance',
    ...(pageToken && { pageToken })
  });

  const comments: YouTubeComment[] = [];

  response.items.forEach((thread: any) => {
    const topComment = thread.snippet.topLevelComment.snippet;
    comments.push({
      id: thread.snippet.topLevelComment.id,
      textDisplay: topComment.textDisplay,
      textOriginal: topComment.textOriginal,
      authorDisplayName: topComment.authorDisplayName,
      authorProfileImageUrl: topComment.authorProfileImageUrl,
      authorChannelUrl: topComment.authorChannelUrl,
      authorChannelId: topComment.authorChannelId?.value || '',
      likeCount: topComment.likeCount,
      publishedAt: topComment.publishedAt,
      updatedAt: topComment.updatedAt,
      totalReplyCount: thread.snippet.totalReplyCount
    });

    // 添加回复评论
    if (thread.replies) {
      thread.replies.comments.forEach((reply: any) => {
        const replySnippet = reply.snippet;
        comments.push({
          id: reply.id,
          textDisplay: replySnippet.textDisplay,
          textOriginal: replySnippet.textOriginal,
          authorDisplayName: replySnippet.authorDisplayName,
          authorProfileImageUrl: replySnippet.authorProfileImageUrl,
          authorChannelUrl: replySnippet.authorChannelUrl,
          authorChannelId: replySnippet.authorChannelId?.value || '',
          likeCount: replySnippet.likeCount,
          publishedAt: replySnippet.publishedAt,
          updatedAt: replySnippet.updatedAt,
          parentId: replySnippet.parentId
        });
      });
    }
  });

  return {
    comments,
    nextPageToken: response.nextPageToken
  };
}

/**
 * 搜索视频
 */
export async function searchVideos(
  query: string,
  maxResults: number = 25,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> {
  const searchResponse = await makeYouTubeAPIRequest('search', {
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: maxResults.toString(),
    order: 'relevance',
    ...(pageToken && { pageToken })
  });

  const videoIds = searchResponse.items.map((item: any) => item.id.videoId);

  if (videoIds.length === 0) {
    return { videos: [] };
  }

  // 获取视频详细信息
  const videosResponse = await makeYouTubeAPIRequest('videos', {
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(',')
  });

  const videos = videosResponse.items.map((video: any) => ({
    id: video.id,
    title: video.snippet.title,
    description: video.snippet.description,
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    thumbnails: video.snippet.thumbnails,
    duration: video.contentDetails.duration,
    statistics: video.statistics,
    tags: video.snippet.tags
  }));

  return {
    videos,
    nextPageToken: searchResponse.nextPageToken
  };
}

// 导出所有功能
export default {
  getChannelData,
  getChannelByUsername,
  getVideoData,
  getChannelVideos,
  getVideoComments,
  searchVideos,
  extractVideoId,
  extractChannelId,
  parseDuration,
  YouTubeAPIError
};