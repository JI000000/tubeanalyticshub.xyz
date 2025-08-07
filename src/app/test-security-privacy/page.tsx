'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Eye, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import { SecurityDashboard } from '@/components/auth/SecurityDashboard'
import { PrivacySettingsPanel } from '@/components/auth/PrivacySettingsPanel'
import { toast } from 'sonner'

export default function TestSecurityPrivacyPage() {
  const { data: session, status } = useSession()
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const runSecurityTest = async (testType: string) => {
    if (!session?.user?.id) {
      toast.error('请先登录')
      return
    }

    setLoading(true)
    try {
      let response
      
      switch (testType) {
        case 'log-security-event':
          response = await fetch('/api/auth/security', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Device-Fingerprint': 'test-fingerprint-' + Date.now()
            },
            body: JSON.stringify({
              eventType: 'login_success',
              loginMethod: 'test',
              additionalData: {
                testEvent: true,
                timestamp: new Date().toISOString()
              }
            })
          })
          break

        case 'get-security-analytics':
          response = await fetch('/api/auth/security?type=analytics&days=30')
          break

        case 'get-security-events':
          response = await fetch('/api/auth/security?type=events&limit=10')
          break

        case 'get-anomalies':
          response = await fetch('/api/auth/security?type=anomalies&limit=5')
          break

        case 'get-privacy-settings':
          response = await fetch('/api/auth/privacy?type=settings')
          break

        case 'update-privacy-settings':
          response = await fetch('/api/auth/privacy', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              settings: {
                allowAnalytics: true,
                enableSecurityAlerts: true,
                dataRetentionPeriod: 90
              }
            })
          })
          break

        case 'export-user-data':
          response = await fetch('/api/auth/privacy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'export-data'
            })
          })
          break

        case 'create-deletion-request':
          response = await fetch('/api/auth/privacy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create-deletion-request',
              requestType: 'partial_deletion',
              deletionScope: {
                login_logs: true,
                analytics: false
              },
              reason: '测试数据删除功能'
            })
          })
          break

        case 'get-gdpr-logs':
          response = await fetch('/api/auth/privacy?type=gdpr-logs&limit=10')
          break

        default:
          throw new Error('Unknown test type')
      }

      const data = await response.json()
      
      if (response.ok) {
        setTestResults(prev => ({
          ...prev,
          [testType]: {
            success: true,
            data,
            timestamp: new Date().toISOString()
          }
        }))
        toast.success(`${testType} 测试成功`)
      } else {
        throw new Error(data.error || 'Test failed')
      }
    } catch (error) {
      console.error(`Test ${testType} failed:`, error)
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }))
      toast.error(`${testType} 测试失败`)
    } finally {
      setLoading(false)
    }
  }

  const clearTestResults = () => {
    setTestResults({})
    toast.success('测试结果已清除')
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            请先登录以测试安全和隐私功能
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">安全和隐私保护功能测试</h1>
        <p className="text-muted-foreground">
          测试登录安全记录、异常检测、隐私设置和GDPR合规功能
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">用户: {session.user.email}</Badge>
          <Badge variant="outline">ID: {session.user.id}</Badge>
        </div>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">功能测试</TabsTrigger>
          <TabsTrigger value="security">安全仪表板</TabsTrigger>
          <TabsTrigger value="privacy">隐私设置</TabsTrigger>
          <TabsTrigger value="results">测试结果</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-6">
          {/* 安全功能测试 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                安全功能测试
              </CardTitle>
              <CardDescription>
                测试登录安全记录、异常检测和风险评估功能
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => runSecurityTest('log-security-event')}
                disabled={loading}
                className="justify-start"
              >
                <Eye className="h-4 w-4 mr-2" />
                记录安全事件
              </Button>
              
              <Button
                onClick={() => runSecurityTest('get-security-analytics')}
                disabled={loading}
                variant="outline"
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                获取安全分析
              </Button>
              
              <Button
                onClick={() => runSecurityTest('get-security-events')}
                disabled={loading}
                variant="outline"
                className="justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                获取安全事件
              </Button>
              
              <Button
                onClick={() => runSecurityTest('get-anomalies')}
                disabled={loading}
                variant="outline"
                className="justify-start"
              >
                <Shield className="h-4 w-4 mr-2" />
                获取异常检测
              </Button>
            </CardContent>
          </Card>

          {/* 隐私功能测试 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                隐私功能测试
              </CardTitle>
              <CardDescription>
                测试隐私设置、数据导出和GDPR合规功能
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => runSecurityTest('get-privacy-settings')}
                disabled={loading}
                className="justify-start"
              >
                <Eye className="h-4 w-4 mr-2" />
                获取隐私设置
              </Button>
              
              <Button
                onClick={() => runSecurityTest('update-privacy-settings')}
                disabled={loading}
                variant="outline"
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                更新隐私设置
              </Button>
              
              <Button
                onClick={() => runSecurityTest('export-user-data')}
                disabled={loading}
                variant="outline"
                className="justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                导出用户数据
              </Button>
              
              <Button
                onClick={() => runSecurityTest('create-deletion-request')}
                disabled={loading}
                variant="destructive"
                className="justify-start"
              >
                <Shield className="h-4 w-4 mr-2" />
                创建删除请求
              </Button>
              
              <Button
                onClick={() => runSecurityTest('get-gdpr-logs')}
                disabled={loading}
                variant="outline"
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                获取GDPR日志
              </Button>
            </CardContent>
          </Card>

          {/* 测试控制 */}
          <Card>
            <CardHeader>
              <CardTitle>测试控制</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                onClick={clearTestResults}
                variant="outline"
              >
                清除测试结果
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                刷新页面
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacySettingsPanel />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>测试结果</CardTitle>
              <CardDescription>
                显示所有API测试的结果和响应数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(testResults).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  暂无测试结果。请在&quot;功能测试&quot;标签页中运行测试。
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(testResults).map(([testType, result]) => (
                    <div key={testType} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{testType}</h3>
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              成功
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              失败
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                      
                      {result.success ? (
                        <div className="bg-gray-50 rounded p-3">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="bg-red-50 rounded p-3">
                          <p className="text-sm text-red-600">
                            错误: {result.error}
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