/**
 * 数据库操作工具函数
 * 处理YouTube数据的存储和检索
 */

import { createClient } from '@supabase/supabase-js';
import { YouTubeChannel, YouTubeVideo, YouTubeComment, parseDuration } from './youtube-api';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 数据库类型定义
export interface DBChannel {
  id: string;
  title: string;
  description: string;
  custom_url?: string;
  published_at: string;
  thumbnails: any;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  user_id: string;
  scraped_at: string;
  updated_at?: string;
}

export interface DBVideo {
  id: string;
  title: string;
  description: string;
  channel_id: string;
  channel_title: string;
  published_at: string;
  duration: number; // 以秒为单位
  view_count: number;
  like_count: number;
  comment_count: number;
  tags: string[];
  thumbnails: any;
  ai_summary?: string;
  sentiment_score?: number;
  keywords?: string[];
  user_id: string;
  scraped_at: string;
  updated_at?: string;
}

export interface DBComment {
  id: string;
  video_id: string;
  text_display: string;
  text_original: string;
  author_display_name: string;
  author_profile_image_url: string;
  author_channel_url: string;
  author_channel_id: string;
  like_count: number;
  published_at: string;
  updated_at: string;
  parent_id?: string;
  total_reply_count?: number;
  sentiment_score?: number;
  user_id: string;
  scraped_at: string;
}

// 错误处理类
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * 保存频道数据到数据库
 */
export async function saveChannelToDatabase(
  channelData: YouTubeChannel,
  userId: string
): Promise<DBChannel> {
  try {
    const dbChannel: Omit<DBChannel, 'updated_at'> = {
      id: channelData.id,
      title: channelData.title,
      description: channelData.description,
      custom_url: channelData.customUrl,
      published_at: channelData.publishedAt,
      thumbnails: channelData.thumbnails,
      subscriber_count: parseInt(channelData.statistics.subscriberCount) || 0,
      video_count: parseInt(channelData.statistics.videoCount) || 0,
      view_count: parseInt(channelData.statistics.viewCount) || 0,
      user_id: userId,
      scraped_at: new Date().toISOString()
    };

    // 使用upsert来处理重复数据
    const { data, error } = await supabase
      .from('yt_channels')
      .upsert(dbChannel, { 
        onConflict: 'id,user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to save channel to database', error);
    }

    return data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error saving channel', error);
  }
}

/**
 * 保存视频数据到数据库
 */
export async function saveVideoToDatabase(
  videoData: YouTubeVideo,
  userId: string
): Promise<DBVideo> {
  try {
    const dbVideo: Omit<DBVideo, 'updated_at'> = {
      id: videoData.id,
      title: videoData.title,
      description: videoData.description,
      channel_id: videoData.channelId,
      channel_title: videoData.channelTitle,
      published_at: videoData.publishedAt,
      duration: parseDuration(videoData.duration),
      view_count: parseInt(videoData.statistics.viewCount) || 0,
      like_count: parseInt(videoData.statistics.likeCount || '0') || 0,
      comment_count: parseInt(videoData.statistics.commentCount || '0') || 0,
      tags: videoData.tags || [],
      thumbnails: videoData.thumbnails,
      user_id: userId,
      scraped_at: new Date().toISOString()
    };

    // 使用upsert来处理重复数据
    const { data, error } = await supabase
      .from('yt_videos')
      .upsert(dbVideo, { 
        onConflict: 'id,user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to save video to database', error);
    }

    return data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error saving video', error);
  }
}

/**
 * 批量保存视频数据到数据库
 */
export async function saveVideosToDatabase(
  videosData: YouTubeVideo[],
  userId: string
): Promise<DBVideo[]> {
  try {
    const dbVideos: Omit<DBVideo, 'updated_at'>[] = videosData.map(videoData => ({
      id: videoData.id,
      title: videoData.title,
      description: videoData.description,
      channel_id: videoData.channelId,
      channel_title: videoData.channelTitle,
      published_at: videoData.publishedAt,
      duration: parseDuration(videoData.duration),
      view_count: parseInt(videoData.statistics.viewCount) || 0,
      like_count: parseInt(videoData.statistics.likeCount || '0') || 0,
      comment_count: parseInt(videoData.statistics.commentCount || '0') || 0,
      tags: videoData.tags || [],
      thumbnails: videoData.thumbnails,
      user_id: userId,
      scraped_at: new Date().toISOString()
    }));

    // 使用upsert来处理重复数据
    const { data, error } = await supabase
      .from('yt_videos')
      .upsert(dbVideos, { 
        onConflict: 'id,user_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      throw new DatabaseError('Failed to save videos to database', error);
    }

    return data || [];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error saving videos', error);
  }
}

/**
 * 保存评论数据到数据库
 */
export async function saveCommentsToDatabase(
  commentsData: YouTubeComment[],
  videoId: string,
  userId: string
): Promise<DBComment[]> {
  try {
    const dbComments: Omit<DBComment, 'updated_at'>[] = commentsData.map(commentData => ({
      id: commentData.id,
      video_id: videoId,
      text_display: commentData.textDisplay,
      text_original: commentData.textOriginal,
      author_display_name: commentData.authorDisplayName,
      author_profile_image_url: commentData.authorProfileImageUrl,
      author_channel_url: commentData.authorChannelUrl,
      author_channel_id: commentData.authorChannelId,
      like_count: commentData.likeCount,
      published_at: commentData.publishedAt,
      updated_at: commentData.updatedAt,
      parent_id: commentData.parentId,
      total_reply_count: commentData.totalReplyCount,
      user_id: userId,
      scraped_at: new Date().toISOString()
    }));

    // 使用upsert来处理重复数据
    const { data, error } = await supabase
      .from('yt_comments')
      .upsert(dbComments, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      throw new DatabaseError('Failed to save comments to database', error);
    }

    return data || [];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error saving comments', error);
  }
}

/**
 * 从数据库获取用户的频道列表
 */
export async function getUserChannels(userId: string): Promise<DBChannel[]> {
  try {
    const { data, error } = await supabase
      .from('yt_channels')
      .select('*')
      .eq('user_id', userId)
      .order('subscriber_count', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to fetch user channels', error);
    }

    return data || [];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error fetching channels', error);
  }
}

/**
 * 从数据库获取用户的视频列表
 */
export async function getUserVideos(
  userId: string,
  channelId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ videos: DBVideo[]; total: number }> {
  try {
    let query = supabase
      .from('yt_videos')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new DatabaseError('Failed to fetch user videos', error);
    }

    return {
      videos: data || [],
      total: count || 0
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error fetching videos', error);
  }
}

/**
 * 从数据库获取视频的评论
 */
export async function getVideoComments(
  videoId: string,
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ comments: DBComment[]; total: number }> {
  try {
    const { data, error, count } = await supabase
      .from('yt_comments')
      .select('*', { count: 'exact' })
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new DatabaseError('Failed to fetch video comments', error);
    }

    return {
      comments: data || [],
      total: count || 0
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error fetching comments', error);
  }
}

/**
 * 获取用户的统计数据
 */
export async function getUserStats(userId: string): Promise<{
  totalChannels: number;
  totalVideos: number;
  totalComments: number;
  totalViews: number;
  totalSubscribers: number;
  totalLikes: number;
}> {
  try {
    const [channelsResult, videosResult, commentsResult] = await Promise.all([
      supabase
        .from('yt_channels')
        .select('subscriber_count, video_count, view_count')
        .eq('user_id', userId),
      
      supabase
        .from('yt_videos')
        .select('view_count, like_count, comment_count')
        .eq('user_id', userId),
      
      supabase
        .from('yt_comments')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
    ]);

    const channels = channelsResult.data || [];
    const videos = videosResult.data || [];
    const commentsCount = commentsResult.count || 0;

    const stats = {
      totalChannels: channels.length,
      totalVideos: videos.length,
      totalComments: commentsCount,
      totalViews: channels.reduce((sum, channel) => sum + (channel.view_count || 0), 0),
      totalSubscribers: channels.reduce((sum, channel) => sum + (channel.subscriber_count || 0), 0),
      totalLikes: videos.reduce((sum, video) => sum + (video.like_count || 0), 0)
    };

    return stats;
  } catch (error) {
    throw new DatabaseError('Failed to fetch user stats', error);
  }
}

/**
 * 检查频道是否已存在
 */
export async function channelExists(channelId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('yt_channels')
      .select('id')
      .eq('id', channelId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new DatabaseError('Failed to check channel existence', error);
    }

    return !!data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error checking channel existence', error);
  }
}

/**
 * 检查视频是否已存在
 */
export async function videoExists(videoId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('yt_videos')
      .select('id')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new DatabaseError('Failed to check video existence', error);
    }

    return !!data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error checking video existence', error);
  }
}

// 导出所有功能
export default {
  saveChannelToDatabase,
  saveVideoToDatabase,
  saveVideosToDatabase,
  saveCommentsToDatabase,
  getUserChannels,
  getUserVideos,
  getVideoComments,
  getUserStats,
  channelExists,
  videoExists,
  DatabaseError
};