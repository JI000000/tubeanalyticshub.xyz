'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Target, Clock, Image, TrendingUp, Star, ThumbsUp, ThumbsDown, RefreshCw, Filter } from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'topic' | 'keyword' | 'timing' | 'thumbnail' | 'growth' | 'performance';
  title: string;
  content: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  metadata?: any;
  feedback_rating?: number;
  created_at?: string;
}

export default function RecommendationsPage() {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'topic' | 'keyword' | 'timing' | 'thumbnail'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recommendations?userId=00000000-0000-0000-0000-000000000001&type=${filterType}&limit=20`);
      const result = await response.json();
      if (result.success) {
        setRecommendations(result.data || []);
      } else {
        console.error('Failed to fetch recommendations:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (recommendationId: string, rating: number) => {
    try {
      setRecommendations(prev => prev.map(rec => 
        rec.id === recommendationId 
          ? { ...rec, feedback_rating: rating }
          : rec
      ));
      console.log('Feedback submitted:', recommendationId, rating);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      topic: <Target className="h-5 w-5" />,
      keyword: <Lightbulb className="h-5 w-5" />,
      timing: <Clock className="h-5 w-5" />,
      thumbnail: <Image className="h-5 w-5" />,
      growth: <TrendingUp className="h-5 w-5" />,
      performance: <Star className="h-5 w-5" />
    };
    return icons[type as keyof typeof icons] || <Lightbulb className="h-5 w-5" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      topic: 'text-blue-600 bg-blue-100',
      keyword: 'text-purple-600 bg-purple-100',
      timing: 'text-green-600 bg-green-100',
      thumbnail: 'text-orange-600 bg-orange-100',
      growth: 'text-pink-600 bg-pink-100',
      performance: 'text-red-600 bg-red-100'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesPriority = filterPriority === 'all' || rec.priority === filterPriority;
    return matchesPriority;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Recommendations</h1>
            <p className="text-gray-600">AI-powered recommendations to improve your content strategy</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchRecommendations} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="topic">Content Topics</option>
                  <option value="keyword">Keywords</option>
                  <option value="timing">Upload Timing</option>
                  <option value="thumbnail">Thumbnails</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading recommendations...</span>
          </div>
        ) : filteredRecommendations.length > 0 ? (
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${getTypeColor(recommendation.type)}`}>
                        {getTypeIcon(recommendation.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                          <Badge className={getPriorityColor(recommendation.priority)}>
                            {recommendation.priority} Priority
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{recommendation.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            <span className={getConfidenceColor(recommendation.confidence)}>
                              Confidence: {Math.round(recommendation.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-500">Was this recommendation helpful?</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={recommendation.feedback_rating === 1 ? "default" : "outline"}
                        onClick={() => submitFeedback(recommendation.id, 1)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful
                      </Button>
                      <Button
                        size="sm"
                        variant={recommendation.feedback_rating === -1 ? "default" : "outline"}
                        onClick={() => submitFeedback(recommendation.id, -1)}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Not Helpful
                      </Button>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
              <p className="text-gray-500 mb-4">Check back later for new AI-powered recommendations</p>
              <Button onClick={fetchRecommendations}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}