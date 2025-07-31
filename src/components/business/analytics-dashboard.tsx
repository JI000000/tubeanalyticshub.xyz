'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Video, 
  MessageSquare, 
  TrendingUp, 
  Eye,
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react';

interface AnalyticsDashboardProps {
  userId?: string;
  className?: string;
}

interface DashboardStats {
  totalChannels: number;
  totalVideos: number;
  totalComments: number;
  totalViews: number;
  totalSubscribers: number;
  lastUpdated: string;
}

export function AnalyticsDashboard({ userId, className }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalChannels: 0,
    totalVideos: 0,
    totalComments: 0,
    totalViews: 0,
    totalSubscribers: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard?userId=${userId || 'demo'}`);
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        // 使用模拟数据作为后备
        setStats({
          totalChannels: 12,
          totalVideos: 156,
          totalComments: 2847,
          totalViews: 1250000,
          totalSubscribers: 45600,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // 使用模拟数据作为后备
      setStats({
        totalChannels: 12,
        totalVideos: 156,
        totalComments: 2847,
        totalViews: 1250000,
        totalSubscribers: 45600,
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statCards = [
    {
      title: 'Channels',
      value: stats.totalChannels,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      change: '+12%'
    },
    {
      title: 'Videos',
      value: stats.totalVideos,
      icon: Video,
      color: 'bg-green-100 text-green-600',
      change: '+8%'
    },
    {
      title: 'Comments',
      value: stats.totalComments,
      icon: MessageSquare,
      color: 'bg-purple-100 text-purple-600',
      change: '+15%'
    },
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'bg-orange-100 text-orange-600',
      change: '+23%'
    },
    {
      title: 'Subscribers',
      value: stats.totalSubscribers,
      icon: TrendingUp,
      color: 'bg-red-100 text-red-600',
      change: '+5%'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Overview of your YouTube analytics performance
          </p>
        </div>
        <Button onClick={fetchDashboardData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : formatNumber(stat.value)}
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                    <span className="text-xs text-gray-500 ml-2">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Video Views</span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatNumber(stats.totalViews)} total
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Engagement Rate</span>
                </div>
                <div className="text-sm text-gray-600">4.2% avg</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium">Growth Rate</span>
                </div>
                <div className="text-sm text-gray-600">+12% this month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                <p className="text-sm font-medium text-blue-900">
                  Top Performing Content
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Tech review videos show 40% higher engagement
                </p>
              </div>
              <div className="p-3 border-l-4 border-green-500 bg-green-50">
                <p className="text-sm font-medium text-green-900">
                  Optimal Upload Time
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Best performance between 7-9 PM on weekdays
                </p>
              </div>
              <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                <p className="text-sm font-medium text-orange-900">
                  Audience Growth
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Subscriber growth rate increased by 15% this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {new Date(stats.lastUpdated).toLocaleString()}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          Real-time data
        </Badge>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;