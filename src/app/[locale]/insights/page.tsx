'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoginRequiredWrapper, LoginRequiredButton, FeatureAccessIndicator } from '@/components/auth/LoginRequiredWrapper';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Save
} from 'lucide-react';

interface InsightData {
  id: string;
  type: 'opportunity' | 'warning' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence_score: number;
  importance: 'high' | 'medium' | 'low';
  category: string;
  created_at: string;
  metadata: {
    affected_videos?: number;
    potential_impact?: string;
    action_items?: string[];
  };
}

export default function InsightsPage() {
  const { t } = useTranslation();
  const { getUserId, isAuthenticated, loading: authLoading } = useAuth();
  const { requireAuth } = useSmartAuth();
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // 处理生成洞察
  const handleGenerateInsights = async () => {
    const canProceed = await requireAuth('advanced_analytics', {
      message: '生成AI洞察需要登录，解锁更深度的数据洞察',
      urgency: 'high',
      metadata: { type: 'generate_insights' }
    });
    
    if (canProceed) {
      await regenerateInsights();
    }
  };

  // 处理保存洞察
  const handleSaveInsights = async () => {
    const canProceed = await requireAuth('save_report', {
      message: '保存洞察报告需要登录',
      urgency: 'high',
      metadata: { type: 'insights_report' }
    });
    
    if (canProceed) {
      console.log('保存洞察报告');
    }
  };

  // 处理趋势分析
  const handleTrendAnalysis = async () => {
    const canProceed = await requireAuth('trend_analysis', {
      message: '趋势分析需要登录，把握内容创作方向',
      urgency: 'medium',
      metadata: { type: 'trend_analysis' }
    });
    
    if (canProceed) {
      console.log('开始趋势分析');
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      const response = await fetch(`/api/analytics/insights?userId=${userId}`);
      const result = await response.json();
      if (result.success) {
        setInsights(result.data || []);
      } else {
        console.error('Failed to fetch insights:', result.error);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateInsights = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      const response = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'regenerate'
        }),
      });
      const result = await response.json();
      if (result.success) {
        setInsights(result.data || []);
      }
    } catch (error) {
      console.error('Error regenerating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchInsights();
    }
  }, [authLoading]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'recommendation':
        return 'bg-blue-50 border-blue-200';
      case 'trend':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const filteredInsights = insights.filter(insight => {
    if (filter === 'all') return true;
    return insight.importance === filter;
  });

  const stats = {
    total: insights.length,
    high: insights.filter(i => i.importance === 'high').length,
    medium: insights.filter(i => i.importance === 'medium').length,
    low: insights.filter(i => i.importance === 'low').length,
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
              <p className="text-gray-600">AI-powered analytics insights</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
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
              AI Insights
              <FeatureAccessIndicator featureId="advanced_analytics" size="sm" />
            </h1>
            <p className="text-gray-600">AI-powered analytics insights and recommendations</p>
          </div>
          <div className="flex gap-2">
            <LoginRequiredButton
              featureId="save_report"
              variant="outline"
              onClick={handleSaveInsights}
              data-feature="save-insights"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Insights
            </LoginRequiredButton>
            <Button onClick={fetchInsights} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
            <LoginRequiredButton
              featureId="advanced_analytics"
              onClick={handleGenerateInsights}
              disabled={loading}
              data-feature="generate-insights"
            >
              <Zap className="h-4 w-4 mr-2" />
              Regenerate
            </LoginRequiredButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Insights</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.high}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Medium Priority</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.medium}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Priority</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.low}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All ({stats.total})
              </Button>
              <Button
                variant={filter === 'high' ? 'default' : 'outline'}
                onClick={() => setFilter('high')}
                size="sm"
              >
                High Priority ({stats.high})
              </Button>
              <Button
                variant={filter === 'medium' ? 'default' : 'outline'}
                onClick={() => setFilter('medium')}
                size="sm"
              >
                Medium Priority ({stats.medium})
              </Button>
              <Button
                variant={filter === 'low' ? 'default' : 'outline'}
                onClick={() => setFilter('low')}
                size="sm"
              >
                Low Priority ({stats.low})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Insights List */}
        {filteredInsights.length > 0 ? (
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <Card key={insight.id} className={`border-l-4 ${getInsightColor(insight.type)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <p className="text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getImportanceBadge(insight.importance)}
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence_score * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Metadata */}
                    {insight.metadata && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {insight.metadata.affected_videos && (
                          <div>
                            <span className="font-medium text-gray-700">Affected Videos:</span>
                            <span className="ml-2 text-gray-600">{insight.metadata.affected_videos}</span>
                          </div>
                        )}
                        {insight.metadata.potential_impact && (
                          <div>
                            <span className="font-medium text-gray-700">Potential Impact:</span>
                            <span className="ml-2 text-gray-600">{insight.metadata.potential_impact}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Items */}
                    {insight.metadata?.action_items && insight.metadata.action_items.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Recommended Actions:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {insight.metadata.action_items.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Generated: {new Date(insight.created_at).toLocaleString()}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {insight.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No insights available' : `No ${filter} priority insights`}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' 
                  ? 'Add channels and videos to generate AI insights'
                  : `Try adjusting the filter or generate new insights`
                }
              </p>
              <div className="flex gap-2 justify-center">
                {filter !== 'all' && (
                  <Button onClick={() => setFilter('all')} variant="outline">
                    Show All Insights
                  </Button>
                )}
                <LoginRequiredButton
                  featureId="advanced_analytics"
                  onClick={handleGenerateInsights}
                  data-feature="generate-insights"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Insights
                </LoginRequiredButton>
                <LoginRequiredButton
                  featureId="trend_analysis"
                  variant="outline"
                  onClick={handleTrendAnalysis}
                  data-feature="trend-analysis"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trend Analysis
                </LoginRequiredButton>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}