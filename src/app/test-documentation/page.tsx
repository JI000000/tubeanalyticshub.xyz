'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// 监控系统测试组件
const MonitoringTest = () => {
  const [healthData, setHealthData] = useState<any>(null)
  const [metricsData, setMetricsData] = useState<any>(null)
  const [alertsData, setAlertsData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchHealthData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/monitoring/health')
      const data = await response.json()
      setHealthData(data)
    } catch (error) {
      console.error('获取健康数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/monitoring/metrics?type=current')
      const data = await response.json()
      setMetricsData(data)
    } catch (error) {
      console.error('获取指标数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/monitoring/alerts?type=active')
      const data = await response.json()
      setAlertsData(data)
    } catch (error) {
      console.error('获取告警数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button onClick={fetchHealthData} disabled={loading}>
          获取系统健康状态
        </Button>
        <Button onClick={fetchMetrics} disabled={loading}>
          获取性能指标
        </Button>
        <Button onClick={fetchAlerts} disabled={loading}>
          获取告警信息
        </Button>
      </div>

      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              系统健康状态
              <Badge variant={healthData.status === 'healthy' ? 'default' : 'destructive'}>
                {healthData.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {metricsData && (
        <Card>
          <CardHeader>
            <CardTitle>性能指标</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(metricsData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {alertsData && (
        <Card>
          <CardHeader>
            <CardTitle>告警信息</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(alertsData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 反馈系统测试组件
const FeedbackTest = () => {
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'general_feedback',
    title: '',
    description: '',
    email: '',
    priority: 'medium'
  })
  const [feedbackList, setFeedbackList] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const submitFeedback = async () => {
    if (!feedbackForm.title || !feedbackForm.description) {
      alert('请填写标题和描述')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feedbackForm,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            language: navigator.language
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('反馈提交成功！')
        setFeedbackForm({
          type: 'general_feedback',
          title: '',
          description: '',
          email: '',
          priority: 'medium'
        })
        fetchFeedbackList()
      } else {
        alert('提交失败: ' + data.message)
      }
    } catch (error) {
      console.error('提交反馈失败:', error)
      alert('提交失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchFeedbackList = async () => {
    try {
      const response = await fetch('/api/feedback?limit=10')
      const data = await response.json()
      if (data.success) {
        setFeedbackList(data.data)
      }
    } catch (error) {
      console.error('获取反馈列表失败:', error)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/feedback/statistics')
      const data = await response.json()
      if (data.success) {
        setStatistics(data.data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  useEffect(() => {
    fetchFeedbackList()
    fetchStatistics()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>提交反馈</CardTitle>
          <CardDescription>测试反馈收集系统</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">反馈类型</Label>
              <Select
                value={feedbackForm.type}
                onValueChange={(value) => setFeedbackForm({ ...feedbackForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug_report">Bug报告</SelectItem>
                  <SelectItem value="feature_request">功能请求</SelectItem>
                  <SelectItem value="login_issue">登录问题</SelectItem>
                  <SelectItem value="performance_issue">性能问题</SelectItem>
                  <SelectItem value="ui_ux_feedback">UI/UX反馈</SelectItem>
                  <SelectItem value="general_feedback">一般反馈</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">优先级</Label>
              <Select
                value={feedbackForm.priority}
                onValueChange={(value) => setFeedbackForm({ ...feedbackForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="critical">紧急</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="email">邮箱（可选）</Label>
            <Input
              id="email"
              type="email"
              value={feedbackForm.email}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={feedbackForm.title}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
              placeholder="简短描述问题或建议"
            />
          </div>

          <div>
            <Label htmlFor="description">详细描述</Label>
            <Textarea
              id="description"
              value={feedbackForm.description}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
              placeholder="详细描述问题、重现步骤或改进建议"
              rows={4}
            />
          </div>

          <Button onClick={submitFeedback} disabled={loading}>
            {loading ? '提交中...' : '提交反馈'}
          </Button>
        </CardContent>
      </Card>

      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle>反馈统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.total}</div>
                <div className="text-sm text-gray-600">总反馈数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.avgResolutionTime.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">平均解决时间</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.satisfactionScore}</div>
                <div className="text-sm text-gray-600">满意度评分</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Object.values(statistics.byStatus).reduce((a: any, b: any) => a + b, 0) as number}
                </div>
                <div className="text-sm text-gray-600">活跃反馈</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>最近反馈</CardTitle>
          <CardDescription>显示最近提交的反馈</CardDescription>
        </CardHeader>
        <CardContent>
          {feedbackList.length > 0 ? (
            <div className="space-y-4">
              {feedbackList.map((feedback) => (
                <div key={feedback.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{feedback.title}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">{feedback.type}</Badge>
                      <Badge variant={
                        feedback.priority === 'critical' ? 'destructive' :
                        feedback.priority === 'high' ? 'destructive' :
                        feedback.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {feedback.priority}
                      </Badge>
                      <Badge variant="outline">{feedback.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{feedback.description}</p>
                  <div className="text-xs text-gray-500">
                    {new Date(feedback.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">暂无反馈记录</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DocumentationTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">智能登录系统文档和监控测试</h1>
        <Alert>
          <AlertDescription>
            这个页面用于测试智能登录系统的监控和反馈功能。所有功能都已完整实现并可以正常使用。
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitoring">系统监控</TabsTrigger>
          <TabsTrigger value="feedback">反馈系统</TabsTrigger>
          <TabsTrigger value="documentation">文档说明</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>系统监控测试</CardTitle>
              <CardDescription>
                测试系统健康检查、性能指标收集和告警功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonitoringTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>用户反馈系统测试</CardTitle>
              <CardDescription>
                测试反馈收集、分类和统计功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>文档说明</CardTitle>
              <CardDescription>
                智能登录系统的完整文档已创建完成
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">📚 技术文档</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    位置: <code>docs/SMART_LOGIN_SYSTEM.md</code>
                  </p>
                  <p className="text-sm">
                    包含系统架构、核心功能、API接口、数据模型等完整技术说明
                  </p>
                </div>

                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">🚀 部署指南</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    位置: <code>docs/OAUTH_DEPLOYMENT_GUIDE.md</code>
                  </p>
                  <p className="text-sm">
                    详细的OAuth配置、环境设置、数据库配置和部署流程说明
                  </p>
                </div>

                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">🔧 故障排除</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    位置: <code>docs/TROUBLESHOOTING_FAQ.md</code>
                  </p>
                  <p className="text-sm">
                    常见问题解答、故障诊断流程、性能优化建议和监控配置
                  </p>
                </div>

                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">📊 监控系统</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    位置: <code>src/lib/monitoring-system.ts</code>
                  </p>
                  <p className="text-sm">
                    完整的系统监控、指标收集、告警机制和健康检查功能
                  </p>
                </div>

                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">💬 反馈系统</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    位置: <code>src/lib/feedback-system.ts</code>
                  </p>
                  <p className="text-sm">
                    用户反馈收集、自动分类、处理流程和统计分析功能
                  </p>
                </div>

                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-2">🗄️ 数据库迁移</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    位置: <code>supabase/migrations/</code>
                  </p>
                  <p className="text-sm">
                    监控表、反馈表和相关索引的完整数据库迁移文件
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  所有文档都已创建完成，包含详细的技术说明、配置指南和维护信息。
                  监控和反馈系统已完整实现，可以立即投入使用。
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}