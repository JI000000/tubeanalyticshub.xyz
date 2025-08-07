/**
 * 测试页面：功能访问权限的视觉指示器
 * 展示各种视觉指示器组件的使用效果
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  LockIcon, 
  LoginRequiredBadge, 
  FeaturePermissionTooltip, 
  DisabledFeatureOverlay,
  FeatureAccessIndicator 
} from '@/components/auth/FeatureAccessIndicators';
import { 
  FeatureButton,
  SaveReportButton,
  ExportDataButton,
  AdvancedAnalyticsButton,
  TeamCollaborationButton,
  VideoAnalysisButton
} from '@/components/auth/FeatureButton';
import { 
  FeatureAccessOverview,
  TrialFeaturesStatus,
  FeatureList
} from '@/components/auth/FeatureAccessStatus';

export default function TestFeatureIndicatorsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">功能访问权限视觉指示器测试</h1>
        <p className="text-muted-foreground">
          测试各种功能访问权限的视觉指示器组件
        </p>
      </div>

      {/* 锁定图标测试 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            锁定图标组件
            <LockIcon featureId="save_report" size="default" />
          </CardTitle>
          <CardDescription>
            在需要登录的功能按钮上添加锁定图标
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">小尺寸图标</h4>
              <div className="flex items-center gap-2">
                <span>保存报告</span>
                <LockIcon featureId="save_report" size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <span>高级分析</span>
                <LockIcon featureId="advanced_analytics" size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <span>API访问</span>
                <LockIcon featureId="api_access" size="sm" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">默认尺寸图标</h4>
              <div className="flex items-center gap-2">
                <span>团队协作</span>
                <LockIcon featureId="team_collaboration" size="default" />
              </div>
              <div className="flex items-center gap-2">
                <span>数据导出</span>
                <LockIcon featureId="export_data" size="default" />
              </div>
              <div className="flex items-center gap-2">
                <span>试用功能</span>
                <LockIcon featureId="video_analysis" size="default" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">大尺寸图标</h4>
              <div className="flex items-center gap-2">
                <span>管理面板</span>
                <LockIcon featureId="admin_panel" size="lg" />
              </div>
              <div className="flex items-center gap-2">
                <span>竞争对手分析</span>
                <LockIcon featureId="competitor_analysis" size="lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 登录标签测试 */}
      <Card>
        <CardHeader>
          <CardTitle>登录要求标签组件</CardTitle>
          <CardDescription>
            创建&quot;登录后可用&quot;的标签组件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">不同访问级别的标签</h4>
              <div className="flex flex-wrap gap-2">
                <LoginRequiredBadge featureId="save_report" />
                <LoginRequiredBadge featureId="video_analysis" />
                <LoginRequiredBadge featureId="admin_panel" />
                <LoginRequiredBadge featureId="team_collaboration" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">不同尺寸的标签</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <LoginRequiredBadge featureId="export_data" size="sm" />
                <LoginRequiredBadge featureId="export_data" size="default" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 工具提示测试 */}
      <Card>
        <CardHeader>
          <CardTitle>功能权限工具提示</CardTitle>
          <CardDescription>
            添加hover提示显示登录要求的原因
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">带工具提示的按钮</h4>
              <div className="space-y-2">
                <FeaturePermissionTooltip featureId="save_report">
                  <Button variant="outline" className="w-full">
                    保存分析报告
                  </Button>
                </FeaturePermissionTooltip>
                
                <FeaturePermissionTooltip featureId="video_analysis">
                  <Button variant="outline" className="w-full">
                    视频分析 (试用)
                  </Button>
                </FeaturePermissionTooltip>
                
                <FeaturePermissionTooltip featureId="team_collaboration">
                  <Button variant="outline" className="w-full">
                    团队协作
                  </Button>
                </FeaturePermissionTooltip>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">带工具提示的功能卡片</h4>
              <FeaturePermissionTooltip featureId="advanced_analytics" showBenefits={true}>
                <Card className="cursor-help">
                  <CardHeader>
                    <CardTitle className="text-sm">高级AI分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      使用最新AI模型进行深度分析
                    </p>
                  </CardContent>
                </Card>
              </FeaturePermissionTooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 禁用状态覆盖测试 */}
      <Card>
        <CardHeader>
          <CardTitle>功能禁用状态覆盖</CardTitle>
          <CardDescription>
            实现功能禁用状态的视觉样式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">模糊覆盖</h4>
              <DisabledFeatureOverlay featureId="export_data" overlayType="blur">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">数据导出</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">导出CSV</Button>
                    <Button variant="outline" className="w-full mt-2">导出Excel</Button>
                  </CardContent>
                </Card>
              </DisabledFeatureOverlay>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">变暗覆盖</h4>
              <DisabledFeatureOverlay featureId="competitor_analysis" overlayType="dim">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">竞争对手分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">开始分析</Button>
                    <Button variant="outline" className="w-full mt-2">查看报告</Button>
                  </CardContent>
                </Card>
              </DisabledFeatureOverlay>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">完全替换</h4>
              <DisabledFeatureOverlay featureId="admin_panel" overlayType="replace">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">管理面板</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">用户管理</Button>
                    <Button variant="outline" className="w-full mt-2">系统设置</Button>
                  </CardContent>
                </Card>
              </DisabledFeatureOverlay>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 综合指示器测试 */}
      <Card>
        <CardHeader>
          <CardTitle>综合功能访问指示器</CardTitle>
          <CardDescription>
            统一的功能访问状态指示器组件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <h4 className="font-medium text-sm">图标类型</h4>
              <FeatureAccessIndicator 
                featureId="save_report" 
                type="icon" 
                size="lg"
              />
            </div>
            
            <div className="text-center space-y-2">
              <h4 className="font-medium text-sm">标签类型</h4>
              <FeatureAccessIndicator 
                featureId="team_collaboration" 
                type="badge" 
                size="default"
              />
            </div>
            
            <div className="text-center space-y-2">
              <h4 className="font-medium text-sm">工具提示类型</h4>
              <FeatureAccessIndicator 
                featureId="advanced_analytics" 
                type="tooltip"
              >
                <Button variant="outline" size="sm">
                  高级分析
                </Button>
              </FeatureAccessIndicator>
            </div>
            
            <div className="text-center space-y-2">
              <h4 className="font-medium text-sm">覆盖类型</h4>
              <FeatureAccessIndicator 
                featureId="api_access" 
                type="overlay"
              >
                <Button variant="outline" size="sm" className="w-full">
                  API密钥
                </Button>
              </FeatureAccessIndicator>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能按钮组件测试 */}
      <Card>
        <CardHeader>
          <CardTitle>功能按钮组件</CardTitle>
          <CardDescription>
            集成了权限检查和视觉指示器的按钮组件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 预设功能按钮 */}
          <div className="space-y-3">
            <h4 className="font-medium">预设功能按钮</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <VideoAnalysisButton 
                variant="outline" 
                className="w-full"
                onClick={() => console.log('视频分析')}
              />
              <SaveReportButton 
                variant="outline" 
                className="w-full"
                onClick={() => console.log('保存报告')}
              />
              <ExportDataButton 
                variant="outline" 
                className="w-full"
                onClick={() => console.log('导出数据')}
              />
              <TeamCollaborationButton 
                variant="outline" 
                className="w-full"
                onClick={() => console.log('团队协作')}
              />
            </div>
          </div>

          <Separator />

          {/* 自定义功能按钮 */}
          <div className="space-y-3">
            <h4 className="font-medium">自定义功能按钮</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <FeatureButton
                featureId="advanced_analytics"
                variant="outline"
                className="w-full"
                lockIconPosition="right"
                onClick={() => console.log('高级分析')}
              >
                高级AI分析
              </FeatureButton>
              
              <FeatureButton
                featureId="competitor_analysis"
                variant="outline"
                className="w-full"
                showLockIcon={true}
                onClick={() => console.log('竞争对手分析')}
              >
                竞争对手分析
              </FeatureButton>
              
              <FeatureButton
                featureId="api_access"
                variant="outline"
                className="w-full"
                customLoginMessage="获取API密钥需要登录"
                onClick={() => console.log('API访问')}
              >
                API访问
              </FeatureButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能访问状态组件 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeatureAccessOverview />
        <TrialFeaturesStatus />
      </div>

      {/* 功能列表组件 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeatureList 
          accessLevel="authenticated"
        />
        <FeatureList 
          showOnlyRestricted={true}
        />
      </div>

      {/* 实际使用场景测试 */}
      <Card>
        <CardHeader>
          <CardTitle>实际使用场景</CardTitle>
          <CardDescription>
            模拟真实应用中的使用场景
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 功能卡片网格 */}
          <div className="space-y-3">
            <h4 className="font-medium">功能卡片网格</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureAccessIndicator featureId="advanced_analytics" type="overlay">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      高级AI分析
                      <FeatureAccessIndicator featureId="advanced_analytics" type="badge" size="sm" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      使用最新AI模型进行深度分析
                    </p>
                    <AdvancedAnalyticsButton size="sm" className="w-full" />
                  </CardContent>
                </Card>
              </FeatureAccessIndicator>

              <FeatureAccessIndicator featureId="competitor_analysis" type="overlay">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      竞争对手分析
                      <FeatureAccessIndicator featureId="competitor_analysis" type="badge" size="sm" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      对比多个竞争对手数据
                    </p>
                    <FeatureButton 
                      featureId="competitor_analysis" 
                      size="sm" 
                      className="w-full"
                    >
                      开始对比
                    </FeatureButton>
                  </CardContent>
                </Card>
              </FeatureAccessIndicator>

              <FeatureAccessIndicator featureId="admin_panel" type="overlay">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      管理面板
                      <FeatureAccessIndicator featureId="admin_panel" type="badge" size="sm" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      系统管理和用户管理
                    </p>
                    <FeatureButton 
                      featureId="admin_panel" 
                      size="sm" 
                      className="w-full"
                    >
                      进入管理
                    </FeatureButton>
                  </CardContent>
                </Card>
              </FeatureAccessIndicator>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}