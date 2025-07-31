'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Eye, ThumbsUp, MessageSquare } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  channel_title: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  duration: number;
  sentiment_score?: number;
  keywords?: string[];
  ai_summary?: string;
}

interface DataVisualizationProps {
  videos: VideoData[];
  loading: boolean;
}

export function DataVisualization({ videos, loading }: DataVisualizationProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data to visualize</h3>
          <p className="text-gray-500">Add some videos to see analytics</p>
        </CardContent>
      </Card>
    );
  }

  const totalViews = videos.reduce((sum, video) => sum + (video.view_count || 0), 0);
  const totalLikes = videos.reduce((sum, video) => sum + (video.like_count || 0), 0);
  const totalComments = videos.reduce((sum, video) => sum + (video.comment_count || 0), 0);
  const avgSentiment = videos.filter(v => v.sentiment_score !== undefined)
    .reduce((sum, video) => sum + (video.sentiment_score || 0), 0) / 
    videos.filter(v => v.sentiment_score !== undefined).length || 0;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{formatNumber(totalViews)}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <ThumbsUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{formatNumber(totalLikes)}</div>
              <div className="text-sm text-gray-600">Total Likes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{formatNumber(totalComments)}</div>
              <div className="text-sm text-gray-600">Total Comments</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {avgSentiment ? (avgSentiment > 0 ? '+' : '') + avgSentiment.toFixed(2) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Avg Sentiment</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {videos
                .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                .slice(0, 5)
                .map((video, index) => (
                  <div key={video.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {video.title}
                      </div>
                      <div className="text-xs text-gray-500">{video.channel_title}</div>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {formatNumber(video.view_count || 0)} views
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {videos
                .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
                .slice(0, 5)
                .map((video) => (
                  <div key={video.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {video.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(video.published_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatNumber(video.view_count || 0)} views
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}