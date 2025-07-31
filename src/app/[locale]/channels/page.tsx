'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Video, Eye, TrendingUp, Calendar, RefreshCw, ExternalLink, BarChart3, Plus, AlertCircle, CheckCircle } from 'lucide-react';

interface ChannelData {
  id: string;
  title: string;
  description: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  thumbnails: Record<string, unknown> | null;
  created_at: string;
  scraped_at: string;
}

interface AddChannelFormProps {
  onChannelAdded: () => void;
  userId: string;
}

function AddChannelForm({ onChannelAdded, userId }: AddChannelFormProps) {
  const { t } = useTranslation();
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelUrl.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelUrl: channelUrl.trim(),
          userId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message || t('channels.addSuccess') });
        setChannelUrl('');
        onChannelAdded();
      } else {
        setMessage({ type: 'error', text: result.error || t('channels.addError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('channels.networkError') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="url"
            placeholder={t('channels.urlPlaceholder')}
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            disabled={loading}
            className="w-full"
          />
        </div>
        <Button type="submit" disabled={loading || !channelUrl.trim()}>
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {loading ? t('channels.adding') : t('channels.addButton')}
        </Button>
      </form>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p className="mb-1">{t('channels.supportedFormats')}</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>https://www.youtube.com/channel/CHANNEL_ID</li>
          <li>https://www.youtube.com/c/CUSTOM_NAME</li>
          <li>https://www.youtube.com/user/USERNAME</li>
          <li>https://www.youtube.com/@HANDLE</li>
        </ul>
      </div>
    </div>
  );
}

export default function ChannelsPage() {
  const { t } = useTranslation();
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'subscriber_count' | 'video_count' | 'view_count'>('subscriber_count');

  const userId = '00000000-0000-0000-0000-000000000001';

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/channels?userId=${userId}`);
      const result = await response.json();
      if (result.success) {
        setChannels(result.data || []);
      } else {
        console.error('Failed to fetch channels:', result.error);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filteredAndSortedChannels = (channels || [])
    .filter(channel => 
      channel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'subscriber_count':
          return b.subscriber_count - a.subscriber_count;
        case 'video_count':
          return b.video_count - a.video_count;
        case 'view_count':
          return b.view_count - a.view_count;
        default:
          return 0;
      }
    });

  const stats = {
    totalChannels: (channels || []).length,
    totalSubscribers: (channels || []).reduce((sum, c) => sum + c.subscriber_count, 0),
    totalVideos: (channels || []).reduce((sum, c) => sum + c.video_count, 0),
    totalViews: (channels || []).reduce((sum, c) => sum + c.view_count, 0),
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
              <p className="text-gray-600">Manage your YouTube channels</p>
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
            <h1 className="text-2xl font-bold text-gray-900">{t('channels.title')}</h1>
            <p className="text-gray-600">{t('channels.description')}</p>
          </div>
          <Button onClick={fetchChannels} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('channels.refreshData')}
          </Button>
        </div>

        {/* Stats Cards */}
        {channels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('channels.totalChannels')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalChannels}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('channels.totalSubscribers')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.totalSubscribers)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Video className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('channels.totalVideos')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.totalVideos)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Eye className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('channels.totalViews')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.totalViews)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('channels.addChannel')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddChannelForm onChannelAdded={fetchChannels} userId={userId} />
          </CardContent>
        </Card>

        {/* Search and Sort */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('channels.searchAndSort')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('channels.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const value = e.target.value as 'subscriber_count' | 'video_count' | 'view_count';
                    setSortBy(value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="subscriber_count">{t('channels.sortBySubscribers')}</option>
                  <option value="video_count">{t('channels.sortByVideos')}</option>
                  <option value="view_count">{t('channels.sortByViews')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channels Grid */}
        {filteredAndSortedChannels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedChannels.map((channel) => (
              <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {channel.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {channel.description || t('channels.noData')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://youtube.com/channel/${channel.id}`, '_blank')}
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
                        <Users className="h-3 w-3 text-gray-400" />
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatNumber(channel.subscriber_count)}
                      </div>
                      <div className="text-xs text-gray-500">{t('dashboard.channels')}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Video className="h-3 w-3 text-gray-400" />
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatNumber(channel.video_count)}
                      </div>
                      <div className="text-xs text-gray-500">{t('dashboard.videos')}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Eye className="h-3 w-3 text-gray-400" />
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatNumber(channel.view_count)}
                      </div>
                      <div className="text-xs text-gray-500">{t('channels.views')}</div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t('channels.analyzed')} {new Date(channel.scraped_at).toLocaleDateString()}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      ID: {channel.id.slice(-8)}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t('channels.analytics')}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {t('channels.trends')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? t('channels.noChannels') : t('channels.noData')}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? t('channels.tryAdjusting') : t('channels.getStarted')}
              </p>
              {searchTerm ? (
                <Button onClick={() => setSearchTerm('')} variant="outline">
                  {t('channels.clearSearch')}
                </Button>
              ) : (
                <Button onClick={() => window.location.href = '/'}>
                  {t('common.create')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}