'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Monitor, 
  Clock, 
  Activity,
  TrendingUp,
  Eye,
  Ban
} from 'lucide-react'
import { securityLogger, type SecurityAnalytics } from '@/lib/security-logger'
import { toast } from 'sonner'

interface SecurityEvent {
  id: string
  eventType: string
  ipAddress: string
  userAgent?: string
  deviceFingerprint?: string
  locationData?: any
  riskScore: number
  isSuspicious: boolean
  createdAt: string
}

interface LoginAnomaly {
  id: string
  anomalyType: string
  severity: string
  detectionData: any
  userResponse?: string
  isConfirmedThreat: boolean
  isFalsePositive: boolean
  createdAt: string
  yt_login_security_logs?: {
    ip_address: string
    user_agent: string
    created_at: string
  }
}

interface SecurityDashboardProps {
  className?: string
}

export function SecurityDashboard({ className }: SecurityDashboardProps) {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<SecurityAnalytics | null>(null)
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([])
  const [anomalies, setAnomalies] = useState<LoginAnomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30) // 天数

  useEffect(() => {
    if (session?.user?.id) {
      loadSecurityData()
    }
  }, [session?.user?.id, timeRange])

  const loadSecurityData = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const [analyticsData, eventsData, anomaliesData] = await Promise.all([
        securityLogger.getUserSecurityAnalytics(session.user.id, timeRange),
        securityLogger.getRecentSecurityEvents(session.user.id, 20),
        securityLogger.getUserAnomalies(session.user.id, 10)
      ])

      setAnalytics(analyticsData)
      setRecentEvents(eventsData)
      setAnomalies(anomaliesData)
    } catch (error) {
      console.error('Error loading security data:', error)
      toast.error('加载安全数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAnomalyResponse = async (
    anomalyId: string, 
    response: 'approved' | 'blocked' | 'false_positive'
  ) => {
    if (!session?.user?.id) return

    try {
      const success = await securityLogger.updateAnomalyStatus(
        anomalyId,
        session.user.id,
        response
      )

      if (success) {
        toast.success('异常状态已更新')
        await loadSecurityData()
      } else {
        toast.error('更新异常状态失败')
      }
    } catch (error) {
      console.error('Error updating anomaly status:', error)
      toast.error('更新异常状态失败')
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getRiskScoreLabel = (score: number) => {
    if (score >= 80) return '高风险'
    if (score >= 60) return '中高风险'
    if (score >= 40) return '中等风险'
    if (score >= 20) return '低风险'
    return '安全'
  }

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'login_success': '登录成功',
      'login_failed': '登录失败',
      'logout': '登出',
      'session_refresh': '会话刷新',
      'password_change': '密码修改'
    }
    return labels[eventType] || eventType
  }

  const getAnomalyTypeLabel = (anomalyType: string) => {
    const labels: Record<string, string> = {
      'unusual_location': '异常位置',
      'unusual_time': '异常时间',
      'unusual_device': '异常设备',
      'brute_force': '暴力破解',
      'concurrent_sessions': '并发会话'
    }
    return labels[anomalyType] || anomalyType
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-blue-100 text-blue-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    }
    return colors[severity] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          无法加载安全数据。请刷新页面重试。
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={className}>
      {/* 时间范围选择 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">安全仪表板</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={timeRange === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(days)}
            >
              {days}天
            </Button>
          ))}
        </div>
      </div>

      {/* 安全概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总登录次数</p>
                <p className="text-2xl font-bold">{analytics.totalLogins}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">失败登录</p>
                <p className="text-2xl font-bold text-red-600">{analytics.failedLogins}</p>
              </div>
              <Ban className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">可疑登录</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.suspiciousLogins}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">风险评分</p>
                <p className={`text-2xl font-bold ${getRiskScoreColor(analytics.riskScore)}`}>
                  {analytics.riskScore}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getRiskScoreLabel(analytics.riskScore)}
                </p>
              </div>
              <Shield className={`h-8 w-8 ${getRiskScoreColor(analytics.riskScore)}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 风险评分详情 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            安全风险评估
          </CardTitle>
          <CardDescription>
            基于登录行为和异常检测的综合风险评分
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">整体风险评分</span>
                <span className={`text-sm font-bold ${getRiskScoreColor(analytics.riskScore)}`}>
                  {analytics.riskScore}/100
                </span>
              </div>
              <Progress value={analytics.riskScore} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span>唯一IP地址:</span>
                <span className="font-medium">{analytics.uniqueIPs}</span>
              </div>
              <div className="flex justify-between">
                <span>唯一设备:</span>
                <span className="font-medium">{analytics.uniqueDevices}</span>
              </div>
              <div className="flex justify-between">
                <span>检测到异常:</span>
                <span className="font-medium">{analytics.anomaliesDetected}</span>
              </div>
            </div>

            {analytics.riskScore > 60 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  检测到较高的安全风险。建议检查最近的登录活动并启用额外的安全措施。
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">登录事件</TabsTrigger>
          <TabsTrigger value="anomalies">异常检测</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                最近登录事件
              </CardTitle>
              <CardDescription>
                显示最近的登录活动和安全事件
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  暂无登录事件记录
                </p>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          event.eventType === 'login_success' ? 'bg-green-100' :
                          event.eventType === 'login_failed' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          {event.eventType === 'login_success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : event.eventType === 'login_failed' ? (
                            <Ban className="h-4 w-4 text-red-600" />
                          ) : (
                            <Activity className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {getEventTypeLabel(event.eventType)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.ipAddress}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(event.createdAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.isSuspicious && (
                          <Badge variant="destructive">可疑</Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={getRiskScoreColor(event.riskScore)}
                        >
                          风险: {event.riskScore}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                异常登录检测
              </CardTitle>
              <CardDescription>
                系统检测到的异常登录行为和您的处理状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    未检测到异常登录行为，您的账户安全状况良好
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {anomalies.map((anomaly) => (
                    <div key={anomaly.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {getAnomalyTypeLabel(anomaly.anomalyType)}
                            </h3>
                            <Badge className={getSeverityColor(anomaly.severity)}>
                              {anomaly.severity === 'low' ? '低' :
                               anomaly.severity === 'medium' ? '中' :
                               anomaly.severity === 'high' ? '高' : '严重'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            检测时间: {new Date(anomaly.createdAt).toLocaleString('zh-CN')}
                          </p>
                          {anomaly.yt_login_security_logs && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>IP地址: {anomaly.yt_login_security_logs.ip_address}</p>
                              {anomaly.detectionData.device_fingerprint && (
                                <p>设备指纹: {anomaly.detectionData.device_fingerprint}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {!anomaly.userResponse && !anomaly.isConfirmedThreat && !anomaly.isFalsePositive && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAnomalyResponse(anomaly.id, 'approved')}
                              >
                                这是我
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAnomalyResponse(anomaly.id, 'blocked')}
                              >
                                不是我
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAnomalyResponse(anomaly.id, 'false_positive')}
                              >
                                误报
                              </Button>
                            </>
                          )}
                          {anomaly.userResponse && (
                            <Badge
                              variant={
                                anomaly.userResponse === 'approved' ? 'default' :
                                anomaly.userResponse === 'blocked' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {anomaly.userResponse === 'approved' ? '已确认' :
                               anomaly.userResponse === 'blocked' ? '已阻止' :
                               anomaly.userResponse === 'false_positive' ? '误报' : anomaly.userResponse}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* 异常详情 */}
                      <div className="text-sm text-muted-foreground">
                        {anomaly.anomalyType === 'unusual_location' && (
                          <p>检测到来自新位置的登录尝试</p>
                        )}
                        {anomaly.anomalyType === 'unusual_device' && (
                          <p>检测到来自新设备的登录尝试</p>
                        )}
                        {anomaly.anomalyType === 'unusual_time' && (
                          <p>检测到异常时间的登录尝试</p>
                        )}
                        {anomaly.anomalyType === 'brute_force' && (
                          <p>检测到可能的暴力破解尝试</p>
                        )}
                        {anomaly.anomalyType === 'concurrent_sessions' && (
                          <p>检测到异常的并发会话</p>
                        )}
                      </div>
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