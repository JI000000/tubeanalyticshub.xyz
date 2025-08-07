'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoginRequiredWrapper, LoginRequiredButton, FeatureAccessIndicator } from '@/components/auth/LoginRequiredWrapper';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { 
  getFeatureConfig, 
  getLoginRequiredFeatures, 
  getTrialAllowedFeatures,
  generateFeatureMarkingReport 
} from '@/lib/feature-identification';
import { 
  Video, 
  FileText, 
  Download, 
  Users, 
  BarChart3, 
  Bookmark, 
  Share, 
  Eye,
  Zap,
  Crown,
  Lock
} from 'lucide-react';

export default function TestFeatureAccessPage() {
  const { isAuthenticated, user, trialRemaining } = useSmartAuth();
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  
  // 生成功能报告
  const report = generateFeatureMarkingReport();
  
  // 测试功能列表
  const testFeatures = [
    { id: 'video_analysis', name: '视频分析', icon: Video, color: 'text-blue-600' },
    { id: 'save_report', name: '保存报告', icon: FileText, color: 'text-green-600' },
    { id: 'export_data', name: '导出数据', icon: Download, color: 'text-purple-600' },
    { id: 'bookmark_content', name: '收藏内容', icon: Bookmark, color: 'text-yellow-600' },
    { id: 'advanced_analytics', name: '高级分析', icon: BarChart3, color: 'text-red-600' },
    { id: 'share_content', name: '分享内容', icon: Share, color: 'text-indigo-600' },
    { id: 'view_history', name: '查看历史', icon: Eye, color: 'text-gray-600' },
    { id: 'competitor_analysis', name: '竞争分析', icon: Users, color: 'text-orange-600' },
  ];

  const handleFeatureTest = (featureId: string) => {
    console.log(`测试功能: ${featureId}`);
    setSelectedFeature(featureId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            功能访问控制测试页面
          </h1>
          <p className="text-gray-600">
            测试和验证登录要求功能的实现效果
          </p>
        </div>

        {/* 用户状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              当前用户状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {isAuthenticated ? '已登录' : '未登录'}
                </div>
                <div className="text-sm text-gray-500">认证状态</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {trialRemaining}
                </div>
                <div className="text-sm text-gray-500">剩余试用次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {user?.plan || 'Free'}
                </div>
                <div className="text-sm text-gray-500">账户类型</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {report.summary.totalFeatures}
              </div>
              <div className="text-sm text-gray-500">总功能数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {report.summary.trialAllowed}
              </div>
              <div className="text-sm text-gray-500">试用功能</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600">
                {report.summary.loginRequired}
              </div>
              <div className="text-sm text-gray-500">需要登录</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {report.summary.publicFeatures}
              </div>
              <div className="text-sm text-gray-500">公开功能</div>
            </CardContent>
          </Card>
        </div>

        {/* 功能测试区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：功能按钮测试 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                功能按钮测试
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testFeatures.map((feature) => {
                const config = getFeatureConfig(feature.id);
                return (
                  <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                      <div>
                        <div className="font-medium">{feature.name}</div>
                        <div className="text-sm text-gray-500">
                          {config?.description}
                        </div>
                      </div>
                      <FeatureAccessIndicator featureId={feature.id} size="sm" />
                    </div>
                    <LoginRequiredButton
                      featureId={feature.id}
                      size="sm"
                      onClick={() => handleFeatureTest(feature.id)}
                    >
                      测试
                    </LoginRequiredButton>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 右侧：包装器测试 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                包装器模式测试
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 覆盖模式 */}
              <div>
                <h4 className="font-medium mb-2">覆盖模式 (Overlay)</h4>
                <LoginRequiredWrapper 
                  featureId="export_data" 
                  wrapperType="overlay"
                  className="h-24"
                >
                  <div className="h-24 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600">导出数据功能区域</span>
                  </div>
                </LoginRequiredWrapper>
              </div>

              {/* 替换模式 */}
              <div>
                <h4 className="font-medium mb-2">替换模式 (Replace)</h4>
                <LoginRequiredWrapper 
                  featureId="advanced_analytics" 
                  wrapperType="replace"
                >
                  <div className="h-24 bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600">高级分析功能</span>
                  </div>
                </LoginRequiredWrapper>
              </div>

              {/* 内联模式 */}
              <div>
                <h4 className="font-medium mb-2">内联模式 (Inline)</h4>
                <LoginRequiredWrapper 
                  featureId="team_collaboration" 
                  wrapperType="inline"
                >
                  <Button variant="outline">团队协作功能</Button>
                </LoginRequiredWrapper>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能详情 */}
        {selectedFeature && (
          <Card>
            <CardHeader>
              <CardTitle>功能详情: {selectedFeature}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">基本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div>功能ID: <code className="bg-gray-100 px-2 py-1 rounded">{selectedFeature}</code></div>
                    <div>访问级别: <Badge>{getFeatureConfig(selectedFeature)?.accessLevel}</Badge></div>
                    <div>描述: {getFeatureConfig(selectedFeature)?.description}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">登录配置</h4>
                  <div className="space-y-2 text-sm">
                    <div>登录消息: {getFeatureConfig(selectedFeature)?.loginMessage}</div>
                    <div>紧急程度: <Badge variant="outline">{getFeatureConfig(selectedFeature)?.urgency}</Badge></div>
                    <div>允许跳过: {getFeatureConfig(selectedFeature)?.allowSkip ? '是' : '否'}</div>
                  </div>
                </div>
              </div>
              
              {getFeatureConfig(selectedFeature)?.loginBenefits && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">登录权益</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {getFeatureConfig(selectedFeature)?.loginBenefits?.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 页面功能报告 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              页面功能分布报告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.byPage.map((page) => (
                <div key={page.pagePath} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{page.pageTitle}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">{page.totalFeatures} 总功能</Badge>
                      <Badge variant="outline" className="text-red-600">{page.loginRequiredFeatures} 需登录</Badge>
                      <Badge variant="outline" className="text-blue-600">{page.trialFeatures} 可试用</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    路径: <code className="bg-gray-100 px-2 py-1 rounded">{page.pagePath}</code>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {page.features.map((feature) => (
                      <Badge 
                        key={feature.featureId} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {feature.featureId}
                      </Badge>
                    ))}
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