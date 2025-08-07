'use client';

import { useState, useEffect } from 'react';
// import { useTranslation } from '@/hooks/useTranslation';
import { AppShell } from '@/components/layout/app-shell';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoginRequiredButton, FeatureAccessIndicator } from '@/components/auth/LoginRequiredWrapper';
import { Download, FileText, Table, BarChart3, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';

interface ExportTask {
  id: string;
  type: 'csv' | 'json' | 'excel' | 'pdf';
  dataType: 'videos' | 'channels' | 'comments' | 'all';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  fileSize?: number;
}

export default function ExportPage() {
  const { requireAuth } = useSmartAuth();
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([]);
  const [loading, setLoading] = useState(false);

  // 处理导出任务创建（需要登录检查）
  const handleCreateExportTask = async (type: ExportTask['type'], dataType: ExportTask['dataType']) => {
    const canProceed = await requireAuth('export_data', {
      message: '数据导出需要登录，确保数据安全和归属权',
      urgency: 'high',
      metadata: { exportType: type, dataType }
    });
    
    if (canProceed) {
      await createExportTask(type, dataType);
    }
  };

  // 处理查看导出历史
  const handleViewHistory = async () => {
    const canProceed = await requireAuth('view_history', {
      message: '查看导出历史需要登录',
      urgency: 'medium',
      metadata: { type: 'export_history' }
    });
    
    if (canProceed) {
      console.log('查看导出历史');
    }
  };

  const createExportTask = async (type: ExportTask['type'], dataType: ExportTask['dataType']) => {
    setLoading(true);
    try {
      const newTask: ExportTask = {
        id: `export_${Date.now()}`,
        type,
        dataType,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString()
      };
      setExportTasks(prev => [newTask, ...prev]);
      
      // Simulate processing
      setTimeout(() => {
        setExportTasks(prev => prev.map(task => 
          task.id === newTask.id 
            ? { ...task, status: 'processing', progress: 50 }
            : task
        ));
        
        setTimeout(() => {
          setExportTasks(prev => prev.map(task => 
            task.id === newTask.id 
              ? { 
                  ...task, 
                  status: 'completed', 
                  progress: 100,
                  completedAt: new Date().toISOString(),
                  downloadUrl: `/downloads/${dataType}_export.${type}`,
                  fileSize: Math.floor(Math.random() * 5000000) + 1000000
                }
              : task
          ));
        }, 3000);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating export task:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ExportTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ExportTask['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusLabel = (status: ExportTask['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
    }
  };

  const getTypeIcon = (type: ExportTask['type']) => {
    switch (type) {
      case 'csv':
        return <Table className="h-5 w-5 text-green-600" />;
      case 'json':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'excel':
        return <Table className="h-5 w-5 text-green-700" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
    }
  };

  const getDataTypeLabel = (dataType: ExportTask['dataType']) => {
    switch (dataType) {
      case 'videos':
        return 'Videos';
      case 'channels':
        return 'Channels';
      case 'comments':
        return 'Comments';
      case 'all':
        return 'All Data';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  useEffect(() => {
    const mockTasks: ExportTask[] = [
      {
        id: 'export_1',
        type: 'csv',
        dataType: 'videos',
        status: 'completed',
        progress: 100,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3000000).toISOString(),
        downloadUrl: '/downloads/videos_export.csv',
        fileSize: 2048576
      }
    ];
    setExportTasks(mockTasks);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Data Export
              <FeatureAccessIndicator featureId="export_data" size="sm" />
            </h1>
            <p className="text-gray-600">Export your YouTube analytics data in various formats</p>
          </div>
          <LoginRequiredButton
            featureId="view_history"
            variant="outline"
            onClick={handleViewHistory}
            data-feature="export-history"
          >
            <Eye className="h-4 w-4 mr-2" />
            View History
          </LoginRequiredButton>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="p-3 bg-green-100 rounded-lg inline-block">
                  <Table className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">CSV Export</h3>
                  <p className="text-sm text-gray-500">Compatible with Excel and spreadsheet apps</p>
                </div>
                <div className="space-y-2">
                  <LoginRequiredButton
                    featureId="export_data"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCreateExportTask('csv', 'videos')}
                    disabled={loading}
                    data-feature="export-csv"
                  >
                    Export Videos
                  </LoginRequiredButton>
                  <LoginRequiredButton
                    featureId="export_data"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCreateExportTask('csv', 'all')}
                    disabled={loading}
                    data-feature="export-csv"
                  >
                    Export All
                  </LoginRequiredButton>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="p-3 bg-blue-100 rounded-lg inline-block">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">JSON Export</h3>
                  <p className="text-sm text-gray-500">For developers and API integration</p>
                </div>
                <div className="space-y-2">
                  <LoginRequiredButton
                    featureId="export_data"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCreateExportTask('json', 'videos')}
                    disabled={loading}
                    data-feature="export-json"
                  >
                    Export Videos
                  </LoginRequiredButton>
                  <LoginRequiredButton
                    featureId="export_data"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCreateExportTask('json', 'comments')}
                    disabled={loading}
                    data-feature="export-json"
                  >
                    Export Comments
                  </LoginRequiredButton>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="p-3 bg-green-100 rounded-lg inline-block">
                  <Table className="h-8 w-8 text-green-700" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Excel Export</h3>
                  <p className="text-sm text-gray-500">Advanced spreadsheet format</p>
                </div>
                <div className="space-y-2">
                  <LoginRequiredButton
                    featureId="export_data"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCreateExportTask('excel', 'channels')}
                    disabled={loading}
                    data-feature="export-excel"
                  >
                    Export Channels
                  </LoginRequiredButton>
                  <LoginRequiredButton
                    featureId="export_data"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCreateExportTask('excel', 'all')}
                    disabled={loading}
                    data-feature="export-excel"
                  >
                    Export All
                  </LoginRequiredButton>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="p-3 bg-red-100 rounded-lg inline-block">
                  <BarChart3 className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">PDF Report</h3>
                  <p className="text-sm text-gray-500">Professional formatted reports</p>
                </div>
                <div className="space-y-2">
                  <LoginRequiredButton
                    featureId="export_data"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCreateExportTask('pdf', 'videos')}
                    disabled={loading}
                    data-feature="export-pdf"
                  >
                    Video Report
                  </LoginRequiredButton>
                  <LoginRequiredButton
                    featureId="export_data"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCreateExportTask('pdf', 'all')}
                    disabled={loading}
                    data-feature="export-pdf"
                  >
                    Full Report
                  </LoginRequiredButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exportTasks.length > 0 ? (
              <div className="space-y-4">
                {exportTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(task.type)}
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {getDataTypeLabel(task.dataType)} - {task.type.toUpperCase()}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(task.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1">{getStatusLabel(task.status)}</span>
                        </Badge>
                        {task.status === 'completed' && task.downloadUrl && (
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>

                    {task.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing...</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="w-full" />
                      </div>
                    )}

                    {task.status === 'completed' && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>
                          Completed: {task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}
                        </span>
                        <span>File size: {formatFileSize(task.fileSize)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No exports yet</h3>
                <p className="text-gray-500">Start by creating your first data export above</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Export Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Available Formats</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-green-600" />
                    <span><strong>CSV:</strong> Spreadsheet format, compatible with Excel</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span><strong>JSON:</strong> Structured data format for developers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-green-700" />
                    <span><strong>Excel:</strong> Advanced spreadsheet with formatting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-red-600" />
                    <span><strong>PDF:</strong> Professional formatted reports</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Data Types</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><strong>Videos:</strong> Title, views, likes, AI analysis</li>
                  <li><strong>Channels:</strong> Channel info, subscribers, metrics</li>
                  <li><strong>Comments:</strong> Content, sentiment, keywords</li>
                  <li><strong>All:</strong> Complete dataset export</li>
                </ul>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Large exports may take several minutes to process. Download links expire after 7 days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}