'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Shield, Download, Trash2, Eye, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'
import { privacySettingsService, type PrivacySettings, type DataDeletionRequest, type GDPRComplianceLog } from '@/lib/privacy-settings'
import { toast } from 'sonner'

interface PrivacySettingsPanelProps {
  className?: string
}

export function PrivacySettingsPanel({ className }: PrivacySettingsPanelProps) {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<PrivacySettings | null>(null)
  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>([])
  const [gdprLogs, setGdprLogs] = useState<GDPRComplianceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeletionDialog, setShowDeletionDialog] = useState(false)
  const [deletionType, setDeletionType] = useState<'partial_deletion' | 'full_account_deletion'>('partial_deletion')
  const [deletionReason, setDeletionReason] = useState('')
  const [deletionScope, setDeletionScope] = useState({
    login_logs: false,
    analytics: false,
    device_info: false,
    user_preferences: false
  })

  useEffect(() => {
    if (session?.user?.id) {
      loadData()
    }
  }, [session?.user?.id])

  const loadData = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const [settingsData, requestsData, logsData] = await Promise.all([
        privacySettingsService.getUserPrivacySettings(session.user.id),
        privacySettingsService.getUserDeletionRequests(session.user.id),
        privacySettingsService.getGDPRComplianceLogs(session.user.id, 20)
      ])

      setSettings(settingsData)
      setDeletionRequests(requestsData)
      setGdprLogs(logsData)
    } catch (error) {
      console.error('Error loading privacy data:', error)
      toast.error('加载隐私设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = async (key: keyof PrivacySettings, value: any) => {
    if (!session?.user?.id || !settings) return

    try {
      setSaving(true)
      const updatedSettings = { ...settings, [key]: value }
      setSettings(updatedSettings)

      const success = await privacySettingsService.updatePrivacySettings(session.user.id, {
        [key]: value
      })

      if (success) {
        toast.success('设置已保存')
        // 重新加载GDPR日志以显示最新的合规记录
        const logsData = await privacySettingsService.getGDPRComplianceLogs(session.user.id, 20)
        setGdprLogs(logsData)
      } else {
        toast.error('保存设置失败')
        // 回滚设置
        setSettings(settings)
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      toast.error('保存设置失败')
      setSettings(settings)
    } finally {
      setSaving(false)
    }
  }

  const handleGDPRConsent = async (consent: boolean) => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const success = await privacySettingsService.updatePrivacySettings(session.user.id, {
        gdprConsentGiven: consent,
        ...(consent ? {} : {
          allowAnalytics: false,
          allowPerformanceTracking: false,
          allowUsageStatistics: false,
          marketingConsent: false
        })
      })

      if (success) {
        toast.success(consent ? 'GDPR同意已确认' : 'GDPR同意已撤销')
        await loadData()
      } else {
        toast.error('更新GDPR同意状态失败')
      }
    } catch (error) {
      console.error('Error updating GDPR consent:', error)
      toast.error('更新GDPR同意状态失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDataExport = async () => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const userData = await privacySettingsService.exportUserData(session.user.id)
      
      if (userData) {
        // 创建并下载JSON文件
        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast.success('数据导出成功')
        await loadData() // 重新加载以显示导出记录
      } else {
        toast.error('数据导出失败')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('数据导出失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDataDeletion = async () => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const requestId = await privacySettingsService.createDataDeletionRequest(
        session.user.id,
        deletionType,
        deletionScope,
        deletionReason
      )

      if (requestId) {
        toast.success('数据删除请求已提交')
        setShowDeletionDialog(false)
        setDeletionReason('')
        setDeletionScope({
          login_logs: false,
          analytics: false,
          device_info: false,
          user_preferences: false
        })
        await loadData()
      } else {
        toast.error('提交删除请求失败')
      }
    } catch (error) {
      console.error('Error creating deletion request:', error)
      toast.error('提交删除请求失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          无法加载隐私设置。请刷新页面重试。
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={className}>
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">隐私设置</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR合规</TabsTrigger>
          <TabsTrigger value="data">数据管理</TabsTrigger>
          <TabsTrigger value="logs">操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* 数据收集设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                数据收集设置
              </CardTitle>
              <CardDescription>
                控制我们收集和使用您数据的方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>分析数据收集</Label>
                  <p className="text-sm text-muted-foreground">
                    允许收集使用分析数据以改进服务
                  </p>
                </div>
                <Switch
                  checked={settings.allowAnalytics}
                  onCheckedChange={(checked) => handleSettingChange('allowAnalytics', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>性能跟踪</Label>
                  <p className="text-sm text-muted-foreground">
                    收集性能数据以优化应用体验
                  </p>
                </div>
                <Switch
                  checked={settings.allowPerformanceTracking}
                  onCheckedChange={(checked) => handleSettingChange('allowPerformanceTracking', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>错误报告</Label>
                  <p className="text-sm text-muted-foreground">
                    自动发送错误报告帮助我们修复问题
                  </p>
                </div>
                <Switch
                  checked={settings.allowErrorReporting}
                  onCheckedChange={(checked) => handleSettingChange('allowErrorReporting', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>使用统计</Label>
                  <p className="text-sm text-muted-foreground">
                    收集功能使用统计数据
                  </p>
                </div>
                <Switch
                  checked={settings.allowUsageStatistics}
                  onCheckedChange={(checked) => handleSettingChange('allowUsageStatistics', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* 安全设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                安全设置
              </CardTitle>
              <CardDescription>
                管理您的账户安全和通知偏好
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>登录通知</Label>
                  <p className="text-sm text-muted-foreground">
                    新设备登录时发送通知
                  </p>
                </div>
                <Switch
                  checked={settings.enableLoginNotifications}
                  onCheckedChange={(checked) => handleSettingChange('enableLoginNotifications', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>安全警报</Label>
                  <p className="text-sm text-muted-foreground">
                    检测到可疑活动时发送警报
                  </p>
                </div>
                <Switch
                  checked={settings.enableSecurityAlerts}
                  onCheckedChange={(checked) => handleSettingChange('enableSecurityAlerts', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>位置跟踪</Label>
                  <p className="text-sm text-muted-foreground">
                    记录登录位置信息用于安全检测
                  </p>
                </div>
                <Switch
                  checked={settings.enableLocationTracking}
                  onCheckedChange={(checked) => handleSettingChange('enableLocationTracking', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* 数据保留设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                数据保留设置
              </CardTitle>
              <CardDescription>
                控制数据的保留时间和自动清理
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>数据保留期限</Label>
                  <p className="text-sm text-muted-foreground">
                    数据保留天数（1-365天）
                  </p>
                </div>
                <Select
                  value={settings.dataRetentionPeriod.toString()}
                  onValueChange={(value) => handleSettingChange('dataRetentionPeriod', parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30天</SelectItem>
                    <SelectItem value="90">90天</SelectItem>
                    <SelectItem value="180">180天</SelectItem>
                    <SelectItem value="365">365天</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>自动删除日志</Label>
                  <p className="text-sm text-muted-foreground">
                    超过保留期限后自动删除日志
                  </p>
                </div>
                <Switch
                  checked={settings.autoDeleteLogs}
                  onCheckedChange={(checked) => handleSettingChange('autoDeleteLogs', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>仅保留必要数据</Label>
                  <p className="text-sm text-muted-foreground">
                    只保留服务运行必需的最少数据
                  </p>
                </div>
                <Switch
                  checked={settings.keepEssentialDataOnly}
                  onCheckedChange={(checked) => handleSettingChange('keepEssentialDataOnly', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gdpr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GDPR合规状态</CardTitle>
              <CardDescription>
                根据欧盟通用数据保护条例管理您的数据处理同意
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base">GDPR同意状态</Label>
                    {settings.gdprConsentGiven ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        已同意
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        未同意
                      </Badge>
                    )}
                  </div>
                  {settings.gdprConsentDate && (
                    <p className="text-sm text-muted-foreground">
                      同意时间: {settings.gdprConsentDate.toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
                <div className="space-x-2">
                  {!settings.gdprConsentGiven ? (
                    <Button
                      onClick={() => handleGDPRConsent(true)}
                      disabled={saving}
                    >
                      给予同意
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleGDPRConsent(false)}
                      disabled={saving}
                    >
                      撤销同意
                    </Button>
                  )}
                </div>
              </div>

              {!settings.gdprConsentGiven && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    未给予GDPR同意将限制某些功能的使用，包括数据分析和个性化服务。
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-base">营销同意</Label>
                <div className="flex items-center justify-between p-3 border rounded">
                  <p className="text-sm">接收产品更新和营销信息</p>
                  <Switch
                    checked={settings.marketingConsent}
                    onCheckedChange={(checked) => handleSettingChange('marketingConsent', checked)}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>数据管理</CardTitle>
              <CardDescription>
                导出或删除您的个人数据
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-5 w-5" />
                    <h3 className="font-medium">导出数据</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    下载您的所有个人数据副本
                  </p>
                  <Button
                    onClick={handleDataExport}
                    disabled={saving}
                    className="w-full"
                  >
                    导出我的数据
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-5 w-5" />
                    <h3 className="font-medium">删除数据</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    永久删除您的部分或全部数据
                  </p>
                  <Dialog open={showDeletionDialog} onOpenChange={setShowDeletionDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        删除数据
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>数据删除请求</DialogTitle>
                        <DialogDescription>
                          请选择要删除的数据类型。此操作不可撤销。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>删除类型</Label>
                          <Select
                            value={deletionType}
                            onValueChange={(value: any) => setDeletionType(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="partial_deletion">部分数据删除</SelectItem>
                              <SelectItem value="full_account_deletion">完整账户删除</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {deletionType === 'partial_deletion' && (
                          <div className="space-y-2">
                            <Label>选择要删除的数据</Label>
                            {Object.entries({
                              login_logs: '登录日志',
                              analytics: '分析数据',
                              device_info: '设备信息',
                              user_preferences: '用户偏好'
                            }).map(([key, label]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={key}
                                  checked={deletionScope[key as keyof typeof deletionScope]}
                                  onChange={(e) => setDeletionScope(prev => ({
                                    ...prev,
                                    [key]: e.target.checked
                                  }))}
                                />
                                <Label htmlFor={key}>{label}</Label>
                              </div>
                            ))}
                          </div>
                        )}

                        <div>
                          <Label>删除原因（可选）</Label>
                          <Textarea
                            value={deletionReason}
                            onChange={(e) => setDeletionReason(e.target.value)}
                            placeholder="请说明删除数据的原因..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeletionDialog(false)}
                        >
                          取消
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDataDeletion}
                          disabled={saving}
                        >
                          确认删除
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* 删除请求历史 */}
              {deletionRequests.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base">删除请求历史</Label>
                  <div className="space-y-2">
                    {deletionRequests.map((request) => (
                      <div key={request.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {request.requestType === 'partial_deletion' ? '部分删除' : '完整删除'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.createdAt?.toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <Badge
                            variant={
                              request.status === 'completed' ? 'default' :
                              request.status === 'failed' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {request.status === 'pending' ? '待处理' :
                             request.status === 'processing' ? '处理中' :
                             request.status === 'completed' ? '已完成' :
                             request.status === 'failed' ? '失败' : '已取消'}
                          </Badge>
                        </div>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground mt-2">
                            原因: {request.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                GDPR合规操作日志
              </CardTitle>
              <CardDescription>
                查看所有数据处理活动的合规记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gdprLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  暂无操作日志
                </p>
              ) : (
                <div className="space-y-3">
                  {gdprLogs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {log.actionType === 'consent_given' ? '同意数据处理' :
                             log.actionType === 'consent_withdrawn' ? '撤销数据处理同意' :
                             log.actionType === 'data_exported' ? '数据导出' :
                             log.actionType === 'data_deleted' ? '数据删除' :
                             log.actionType === 'data_rectified' ? '数据更正' : log.actionType}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {log.processingPurpose}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {log.createdAt?.toLocaleString('zh-CN')}
                          </p>
                          <Badge variant="outline">
                            {log.legalBasis === 'consent' ? '用户同意' :
                             log.legalBasis === 'contract' ? '合同履行' :
                             log.legalBasis === 'legal_obligation' ? '法律义务' :
                             log.legalBasis === 'vital_interests' ? '重要利益' :
                             log.legalBasis === 'public_task' ? '公共任务' :
                             log.legalBasis === 'legitimate_interests' ? '合法利益' : log.legalBasis}
                          </Badge>
                        </div>
                      </div>
                      {log.dataCategories.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            涉及数据类别: {log.dataCategories.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}