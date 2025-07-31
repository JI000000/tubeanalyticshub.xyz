'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Target, Lightbulb, Star, AlertTriangle, CheckCircle, ArrowLeft, Calendar, BarChart3, Users, Video, MessageSquare, Share2, Download } from 'lucide-react';

interface DetailedInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence_score: number;
  importance: 'high' | 'medium' | 'low';
  category: 'content' | 'timing' | 'audience' | 'competition';
  created_at: string;
  detailed_analysis: {
    summary: string;
    key_findings: Array<{
      title: string;
      description: string;
      impact: string;
      evidence: string[];
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      effort: 'low' | 'medium' | 'high';
      expected_impact: string;
      steps: string[];
    }>;
    data_sources: string[];
    methodology: string;
  };
  metadata?: {
    affected_videos?: number;
    potential_impact?: string;
    action_items?: string[];
    related_insights?: string[];
  };
}

export default function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const [insight, setInsight] = useState<DetailedInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightId, setInsightId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setInsightId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (insightId) {
      fetchInsightDetail();
    }
  }, [insightId]);

  const fetchInsightDetail = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockInsight: DetailedInsight = {
        id: insightId,
        type: 'opportunity',
        title: 'Optimal Upload Time Identified',
        description: 'Your audience is most active between 7-9 PM on weekdays. Consider scheduling uploads during this time.',
        confidence_score: 0.85,
        importance: 'high',
        category: 'timing',
        created_at: '2024-01-16T08:00:00Z',
        detailed_analysis: {
          summary: 'Based on analysis of your audience engagement patterns over the past 90 days, we have identified optimal upload times that could significantly increase your video performance.',
          key_findings: [
            {
              title: 'Peak Engagement Window',
              description: 'Your audience shows highest activity between 7-9 PM on weekdays',
              impact: 'Could increase initial views by 25-40%',
              evidence: [
                'Average engagement rate 35% higher during this window',
                'Comments and likes peak at 8:15 PM',
                'Watch time completion rate increases by 22%'
              ]
            }
          ],
          recommendations: [
            {
              title: 'Schedule Uploads for Peak Hours',
              description: 'Use YouTube Studio scheduler to publish videos at 7:30 PM on weekdays',
              priority: 'high',
              effort: 'low',
              expected_impact: '+25% initial engagement',
              steps: [
                'Access YouTube Studio scheduler',
                'Set default upload time to 7:30 PM',
                'Monitor performance for 2 weeks',
                'Adjust timing based on results'
              ]
            }
          ],
          data_sources: ['YouTube Analytics', 'Audience Insights', 'Engagement Metrics'],
          methodology: 'Statistical analysis of 90-day engagement patterns with time-series clustering'
        },
        metadata: {
          affected_videos: 12,
          potential_impact: 'Could increase views by 25-40%',
          action_items: ['Schedule uploads for 7-9 PM', 'Test different time slots', 'Monitor engagement patterns']
        }
      };
      
      setInsight(mockInsight);
    } catch (error) {
      console.error('Error fetching insight detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      opportunity: <Target className="h-6 w-6" />,
      warning: <AlertTriangle className="h-6 w-6" />,
      trend: <TrendingUp className="h-6 w-6" />,
      recommendation: <Lightbulb className="h-6 w-6" />
    };
    return icons[type as keyof typeof icons] || <Brain className="h-6 w-6" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      opportunity: 'text-green-600 bg-green-100',
      warning: 'text-red-600 bg-red-100',
      trend: 'text-blue-600 bg-blue-100',
      recommendation: 'text-purple-600 bg-purple-100'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getImportanceColor = (importance: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[importance as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEffortColor = (effort: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[effort as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      content: <Video className="h-4 w-4" />,
      timing: <Calendar className="h-4 w-4" />,
      audience: <Users className="h-4 w-4" />,
      competition: <Target className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons] || <BarChart3 className="h-4 w-4" />;
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/insights/${insightId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      prompt('Share link:', shareUrl);
    }
  };

  const handleExport = () => {
    alert('Export functionality coming soon!');
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppShell>
    );
  }

  if (!insight) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Insight Not Found</h3>
          <p className="text-gray-500 mb-4">The requested insight could not be found.</p>
          <Button onClick={() => window.location.href = '/insights'}>
            Back to Insights
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Insight Details</h1>
              <p className="text-gray-600">Detailed analysis and recommendations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getTypeColor(insight.type)}`}>
                  {getTypeIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{insight.title}</CardTitle>
                    <Badge className={getImportanceColor(insight.importance)}>
                      {insight.importance === 'high' ? 'High Priority' : 
                       insight.importance === 'medium' ? 'Medium Priority' : 'Low Priority'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{insight.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      <span>
                        {insight.category === 'content' ? 'Content Strategy' :
                         insight.category === 'timing' ? 'Upload Timing' :
                         insight.category === 'audience' ? 'Audience Analysis' : 'Competitor Analysis'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>Confidence: {Math.round(insight.confidence_score * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(insight.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {insight.detailed_analysis?.summary || insight.description}
                </p>
              </CardContent>
            </Card>

            {/* Key Findings */}
            {insight.detailed_analysis?.key_findings && insight.detailed_analysis.key_findings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Findings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insight.detailed_analysis.key_findings.map((finding, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium text-gray-900 mb-2">{finding.title}</h4>
                        <p className="text-gray-600 mb-2">{finding.description}</p>
                        <div className="bg-blue-50 p-3 rounded-lg mb-2">
                          <div className="text-sm font-medium text-blue-900 mb-1">Expected Impact</div>
                          <div className="text-sm text-blue-800">{finding.impact}</div>
                        </div>
                        {finding.evidence && finding.evidence.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Supporting Evidence:</div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {finding.evidence.map((evidence, evidenceIndex) => (
                                <li key={evidenceIndex} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {evidence}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {insight.detailed_analysis?.recommendations && insight.detailed_analysis.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Action Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {insight.detailed_analysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(recommendation.priority)}>
                              {recommendation.priority === 'high' ? 'High Priority' :
                               recommendation.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                            </Badge>
                            <Badge className={getEffortColor(recommendation.effort)}>
                              {recommendation.effort === 'low' ? 'Low Effort' :
                               recommendation.effort === 'medium' ? 'Medium Effort' : 'High Effort'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{recommendation.description}</p>
                        <div className="bg-green-50 p-3 rounded-lg mb-3">
                          <div className="text-sm font-medium text-green-900 mb-1">Expected Impact</div>
                          <div className="text-sm text-green-800">{recommendation.expected_impact}</div>
                        </div>
                        {recommendation.steps && recommendation.steps.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Execution Steps:</div>
                            <ol className="text-sm text-gray-600 space-y-1">
                              {recommendation.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex items-start gap-2">
                                  <span className="bg-blue-100 text-blue-800 text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {stepIndex + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Impact Scope */}
            {insight.metadata && (
              <Card>
                <CardHeader>
                  <CardTitle>Impact Scope</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insight.metadata.affected_videos && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Affected Videos</span>
                      <Badge variant="outline">{insight.metadata.affected_videos} videos</Badge>
                    </div>
                  )}
                  {insight.metadata.potential_impact && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Potential Impact</div>
                      <div className="text-sm text-gray-600">{insight.metadata.potential_impact}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Methodology */}
            {insight.detailed_analysis?.methodology && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{insight.detailed_analysis.methodology}</p>
                </CardContent>
              </Card>
            )}

            {/* Data Sources */}
            {insight.detailed_analysis?.data_sources && insight.detailed_analysis.data_sources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {insight.detailed_analysis.data_sources.map((source, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <BarChart3 className="h-4 w-4" />
                        {source}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}