'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslation } from '@/hooks/useTranslation';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoginRequiredButton, FeatureAccessIndicator } from '@/components/auth/LoginRequiredWrapper';
import { 
  Search, 
  Video, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Calendar, 
  RefreshCw, 
  ExternalLink,
  Play,
  Clock,
  TrendingUp,
  Bookmark,
  Download
} from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  description: string;
  channel_id: string;
  channel_title: string;
  published_at: string;
  duration: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  tags: string[];
  thumbnails: any;
  ai_summary?: string;
  sentiment_score?: number;
  keywords?: string[];
}

export default function VideosPage() {
  const { t } = useTranslation();
  const { requireAuth, shouldShowTrialIndicator } = useSmartAuth();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'published_at' | 'view_count' | 'like_count'>('published_at');

  const userId = '00000000-0000-0000-0000-000000000001';

  // 处理视频分析
  const handleVideoAnalysis = async (videoId: string) => {
    const canProceed = await requireAuth('video_analysis', {
      allowTrial: true,
      trialAction: 'video_analysis',
      message: '分析视频需要登录或使用试用次数',
      urgency: 'medium',
      metadata: { videoId }
    });
    
    if (canProceed) {
      // 执行视频分析逻辑
      console.log('开始分析视频:', videoId);
      // 这里可以添加实际的分析逻辑
    }
  };

  // 处理保存分析结果
  const handleSaveAnalysis = async (videoId: string) => {
    const canProceed = await requireAuth('save_report', {
      message: '保存分析结果需要登录，避免丢失宝贵的分析数据',
      urgency: 'high',
      metadata: { videoId, type: 'video_analysis' }
    });
    
    if (canProceed) {
      // 执行保存逻辑
      console.log('保存视频分析:', videoId);
    }
  };

  // 处理收藏视频
  const handleBookmarkVideo = async (videoId: string) => {
    const canProceed = await requireAuth('bookmark_content', {
      message: '收藏功能需要登录，建立您的专属视频库',
      urgency: 'medium',
      allowSkip: true,
      metadata: { videoId, type: 'video' }
    });
    
    if (canProceed) {
      // 执行收藏逻辑
      console.log('收藏视频:', videoId);
    }
  };

  // 处理导出数据
  const handleExportData = async () => {
    const canProceed = await requireAuth('export_data', {
      message: '导出视频数据需要登录，确保数据安全',
      urgency: 'high',
      metadata: { type: 'video_data' }
    });
    
    if (canProceed) {
      // 执行导出逻辑
      console.log('导出视频数据');
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/videos?userId=${userId}`);
      const result = await response.json();
      if (result.success) {
        setVideos(result.data || []);
      } else {
        console.error('Failed to fetch videos:', result.error);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredAndSortedVideos = (videos || [])
    .filter(video => 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.channel_title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'published_at':
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        case 'view_count':
          return (b.view_count || 0) - (a.view_count || 0);
        case 'like_count':
          return (b.like_count || 0) - (a.like_count || 0);
        default:
          return 0;
      }
    });

  const stats = {
    totalVideos: (videos || []).length,
    totalViews: (videos || []).reduce((sum, v) => sum + (v.view_count || 0), 0),
    totalLikes: (videos || []).reduce((sum, v) => sum + (v.like_count || 0), 0),
    totalComments: (videos || []).reduce((sum, v) => sum + (v.comment_count || 0), 0),
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
              <p className="text-gray-600">Analyze your YouTube videos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Videos
              {shouldShowTrialIndicator() && (
                <FeatureAccessIndicator featureId="video_analysis" size="sm" />
              )}
            </h1>
            <p className="text-gray-600">Analyze your YouTube videos</p>
          </div>
          <div className="flex gap-2">
            <LoginRequiredButton
              featureId="export_data"
              variant="outline"
              onClick={handleExportData}
              data-feature="export-video-data"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </LoginRequiredButton>
            <Button onClick={fetchVideos} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Video className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Videos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.totalViews)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ThumbsUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Likes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.totalLikes)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Comments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.totalComments)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Sort */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search and Sort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search videos, channels, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const value = e.target.value as 'published_at' | 'view_count' | 'like_count';
                    setSortBy(value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="published_at">Sort by date</option>
                  <option value="view_count">Sort by views</option>
                  <option value="like_count">Sort by likes</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        {filteredAndSortedVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedVideos.map((video) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {video.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {video.channel_title}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Eye className="h-3 w-3 text-gray-400" />
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatNumber(video.view_count || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ThumbsUp className="h-3 w-3 text-gray-400" />
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatNumber(video.like_count || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3 text-gray-400" />
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatNumber(video.comment_count || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Comments</div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(video.published_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(video.duration || 0)}
                    </div>
                  </div>

                  {/* AI Summary */}
                  {video.ai_summary && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium mb-1">AI Summary</p>
                      <p className="text-xs text-blue-700 line-clamp-2">
                        {video.ai_summary}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Watch
                    </Button>
                    <LoginRequiredButton
                      featureId="video_analysis"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleVideoAnalysis(video.id)}
                      data-feature="analyze-video"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analyze
                    </LoginRequiredButton>
                  </div>
                  
                  {/* Additional Actions */}
                  <div className="flex gap-2 mt-2">
                    <LoginRequiredButton
                      featureId="save_report"
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-xs"
                      onClick={() => handleSaveAnalysis(video.id)}
                      data-feature="save-video-analysis"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Save Analysis
                    </LoginRequiredButton>
                    <LoginRequiredButton
                      featureId="bookmark_content"
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-xs"
                      onClick={() => handleBookmarkVideo(video.id)}
                      data-feature="bookmark-video"
                    >
                      <Bookmark className="h-3 w-3 mr-1" />
                      Bookmark
                    </LoginRequiredButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No matching videos found" : 'No video data available'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? "Try adjusting your search terms" : 'Add channels to analyze their videos'}
              </p>
              {searchTerm ? (
                <Button onClick={() => setSearchTerm('')} variant="outline">
                  Clear Search
                </Button>
              ) : (
                <Button onClick={() => window.location.href = '/en-US/channels'}>
                  Add Channels
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}