'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoginRequiredButton, FeatureAccessIndicator } from '@/components/auth/LoginRequiredWrapper';
import { 
  FileText, 
  Download, 
  Share, 
  Plus, 
  RefreshCw,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Save
} from 'lucide-react';

interface ReportData {
  id: string;
  title: string;
  description: string;
  type: string;
  template_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: {
    channels_count?: number;
    videos_count?: number;
    date_range?: string;
  };
  is_public: boolean;
  version: number;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const { getUserId, isAuthenticated, loading: authLoading } = useAuth();
  const { requireAuth, shouldShowTrialIndicator } = useSmartAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [selectedType, setSelectedType] = useState('performance');

  // 处理创建报告
  const handleCreateReport = async () => {
    const canProceed = await requireAuth('generate_report', {
      allowTrial: true,
      trialAction: 'save_report',
      message: '创建报告需要登录或使用试用次数',
      urgency: 'high',
      metadata: { reportType: selectedType, title: newReportTitle }
    });
    
    if (canProceed) {
      await createReport();
    }
  };

  // 处理保存报告
  const handleSaveReport = async (reportId: string) => {
    const canProceed = await requireAuth('save_report', {
      message: '保存报告需要登录，确保您的分析成果不会丢失',
      urgency: 'high',
      metadata: { reportId }
    });
    
    if (canProceed) {
      console.log('保存报告:', reportId);
    }
  };

  // 处理分享报告
  const handleShareReport = async (reportId: string) => {
    const canProceed = await requireAuth('share_content', {
      message: '分享报告需要登录，安全地分享您的分析成果',
      urgency: 'medium',
      allowSkip: true,
      metadata: { reportId, type: 'report' }
    });
    
    if (canProceed) {
      console.log('分享报告:', reportId);
    }
  };

  // 处理下载报告
  const handleDownloadReport = async (reportId: string) => {
    const canProceed = await requireAuth('export_data', {
      message: '下载报告需要登录，确保数据安全',
      urgency: 'high',
      metadata: { reportId, type: 'download' }
    });
    
    if (canProceed) {
      console.log('下载报告:', reportId);
    }
  };

  // 处理查看历史
  const handleViewHistory = async () => {
    const canProceed = await requireAuth('view_history', {
      message: '查看报告历史需要登录，管理您的所有报告',
      urgency: 'medium',
      metadata: { type: 'report_history' }
    });
    
    if (canProceed) {
      console.log('查看报告历史');
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      const response = await fetch(`/api/analytics/reports?userId=${userId}`);
      const result = await response.json();
      if (result.success) {
        setReports(result.data || []);
      } else {
        console.error('Failed to fetch reports:', result.error);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReport = async () => {
    if (!newReportTitle.trim()) return;

    setCreating(true);
    try {
      const userId = getUserId();
      const response = await fetch('/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          reportType: selectedType,
          templateId: 'standard',
          title: newReportTitle.trim()
        }),
      });
      const result = await response.json();
      if (result.success) {
        setNewReportTitle('');
        fetchReports(); // Refresh the list
      } else {
        console.error('Failed to create report:', result.error);
      }
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchReports();
    }
  }, [authLoading]);

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <BarChart3 className="h-5 w-5 text-blue-600" />;
      case 'competitor':
        return <Users className="h-5 w-5 text-purple-600" />;
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case 'performance':
        return 'bg-blue-50 border-blue-200';
      case 'competitor':
        return 'bg-purple-50 border-purple-200';
      case 'trend':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const reportTypes = [
    { value: 'performance', label: 'Performance Report', description: 'Analyze channel and video performance' },
    { value: 'competitor', label: 'Competitor Analysis', description: 'Compare with competitor channels' },
    { value: 'trend', label: 'Trend Analysis', description: 'Identify trending topics and patterns' },
    { value: 'custom', label: 'Custom Report', description: 'Create a custom analysis report' }
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Generate and manage analytics reports</p>
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
              Reports
              {shouldShowTrialIndicator() && (
                <FeatureAccessIndicator featureId="generate_report" size="sm" />
              )}
            </h1>
            <p className="text-gray-600">Generate and manage analytics reports</p>
          </div>
          <div className="flex gap-2">
            <LoginRequiredButton
              featureId="view_history"
              variant="outline"
              onClick={handleViewHistory}
              data-feature="view-report-history"
            >
              <Eye className="h-4 w-4 mr-2" />
              View History
            </LoginRequiredButton>
            <Button onClick={fetchReports} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>
        </div>

        {/* Create Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title
                </label>
                <Input
                  placeholder="Enter report title..."
                  value={newReportTitle}
                  onChange={(e) => setNewReportTitle(e.target.value)}
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  disabled={creating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedType(type.value)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getReportIcon(type.value)}
                    <h3 className="font-medium text-gray-900">{type.label}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              ))}
            </div>

            <LoginRequiredButton
              featureId="generate_report"
              onClick={handleCreateReport}
              disabled={creating || !newReportTitle.trim()}
              className="w-full md:w-auto"
              data-feature="create-report"
            >
              {creating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {creating ? 'Creating Report...' : 'Create Report'}
            </LoginRequiredButton>
          </CardContent>
        </Card>

        {/* Reports List */}
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className={`border-l-4 ${getReportColor(report.type)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getReportIcon(report.type)}
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {report.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      v{report.version}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metadata */}
                  {report.metadata && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {report.metadata.channels_count && (
                        <div>
                          <span className="text-gray-500">Channels:</span>
                          <span className="ml-1 font-medium">{report.metadata.channels_count}</span>
                        </div>
                      )}
                      {report.metadata.videos_count && (
                        <div>
                          <span className="text-gray-500">Videos:</span>
                          <span className="ml-1 font-medium">{report.metadata.videos_count}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status and Date */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    <Badge 
                      variant={report.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {report.status}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <LoginRequiredButton
                      featureId="export_data"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownloadReport(report.id)}
                      data-feature="download-report"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </LoginRequiredButton>
                    <LoginRequiredButton
                      featureId="share_content"
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareReport(report.id)}
                      data-feature="share-report"
                    >
                      <Share className="h-4 w-4" />
                    </LoginRequiredButton>
                  </div>
                  
                  {/* Save Action */}
                  <div className="mt-2">
                    <LoginRequiredButton
                      featureId="save_report"
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() => handleSaveReport(report.id)}
                      data-feature="save-report"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save to Account
                    </LoginRequiredButton>
                  </div>

                  {/* Public indicator */}
                  {report.is_public && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Share className="h-3 w-3" />
                      Public report
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first analytics report to get started
              </p>
              <Button onClick={() => setNewReportTitle('My First Report')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}