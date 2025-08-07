/**
 * 安全中间件
 * 自动记录登录安全事件和检测异常行为
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { securityLogger } from '@/lib/security-logger'

export interface SecurityEventContext {
  ipAddress: string
  userAgent?: string
  deviceFingerprint?: string
  sessionId?: string
}

/**
 * 从请求中提取安全上下文信息
 */
export function extractSecurityContext(request: NextRequest): SecurityEventContext {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0] || realIp || '127.0.0.1'
  
  const userAgent = request.headers.get('user-agent') || undefined
  const deviceFingerprint = request.headers.get('x-device-fingerprint') || undefined
  const sessionId = request.headers.get('x-session-id') || undefined

  return {
    ipAddress,
    userAgent,
    deviceFingerprint,
    sessionId
  }
}

/**
 * 记录登录成功事件
 */
export async function logLoginSuccess(
  request: NextRequest,
  userId: string,
  loginMethod?: string,
  additionalData?: Record<string, any>
) {
  try {
    const context = extractSecurityContext(request)
    
    await securityLogger.logSecurityEvent({
      nextauthUserId: userId,
      eventType: 'login_success',
      loginMethod: loginMethod as any,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      additionalData: {
        ...additionalData,
        sessionId: context.sessionId,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log login success:', error)
  }
}

/**
 * 记录登录失败事件
 */
export async function logLoginFailure(
  request: NextRequest,
  identifier: string,
  reason?: string,
  additionalData?: Record<string, any>
) {
  try {
    const context = extractSecurityContext(request)
    
    await securityLogger.logSecurityEvent({
      eventType: 'login_failed',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      additionalData: {
        identifier,
        failureReason: reason,
        ...additionalData,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log login failure:', error)
  }
}

/**
 * 记录登出事件
 */
export async function logLogout(
  request: NextRequest,
  userId: string,
  reason?: string,
  additionalData?: Record<string, any>
) {
  try {
    const context = extractSecurityContext(request)
    
    await securityLogger.logSecurityEvent({
      nextauthUserId: userId,
      eventType: 'logout',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      additionalData: {
        logoutReason: reason,
        ...additionalData,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log logout:', error)
  }
}

/**
 * 记录会话刷新事件
 */
export async function logSessionRefresh(
  request: NextRequest,
  userId: string,
  additionalData?: Record<string, any>
) {
  try {
    const context = extractSecurityContext(request)
    
    await securityLogger.logSecurityEvent({
      nextauthUserId: userId,
      eventType: 'session_refresh',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      additionalData: {
        ...additionalData,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log session refresh:', error)
  }
}

/**
 * 检查IP是否被黑名单阻止
 */
export async function checkIpBlacklist(ipAddress: string): Promise<boolean> {
  try {
    return await securityLogger.isIpBlacklisted(ipAddress)
  } catch (error) {
    console.error('Failed to check IP blacklist:', error)
    return false
  }
}

/**
 * 安全中间件函数
 * 在认证相关的API路由中使用
 */
export async function securityMiddleware(
  request: NextRequest,
  handler: (request: NextRequest, context: SecurityEventContext) => Promise<Response>
): Promise<Response> {
  const context = extractSecurityContext(request)
  
  // 检查IP黑名单
  const isBlacklisted = await checkIpBlacklist(context.ipAddress)
  if (isBlacklisted) {
    // 记录被阻止的访问尝试
    await securityLogger.logSecurityEvent({
      eventType: 'login_failed',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      additionalData: {
        blockedReason: 'ip_blacklisted',
        timestamp: new Date().toISOString()
      }
    })
    
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // 执行原始处理器
  return await handler(request, context)
}

/**
 * 创建安全感知的API处理器
 */
export function withSecurity<T extends any[]>(
  handler: (request: NextRequest, context: SecurityEventContext, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    return securityMiddleware(request, async (req, ctx) => {
      return handler(req, ctx, ...args)
    })
  }
}

/**
 * 验证设备指纹
 */
export function validateDeviceFingerprint(fingerprint?: string): boolean {
  if (!fingerprint) return true // 可选的
  
  // 基本验证：检查指纹格式
  const fingerprintRegex = /^[a-f0-9]{32,64}$/i
  return fingerprintRegex.test(fingerprint)
}

/**
 * 检测可疑的用户代理
 */
export function detectSuspiciousUserAgent(userAgent?: string): boolean {
  if (!userAgent) return false
  
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * 计算请求风险评分
 */
export function calculateRequestRiskScore(context: SecurityEventContext): number {
  let score = 0
  
  // 检查用户代理
  if (detectSuspiciousUserAgent(context.userAgent)) {
    score += 30
  }
  
  // 检查设备指纹
  if (context.deviceFingerprint && !validateDeviceFingerprint(context.deviceFingerprint)) {
    score += 20
  }
  
  // 检查IP地址模式
  if (context.ipAddress.startsWith('10.') || 
      context.ipAddress.startsWith('192.168.') || 
      context.ipAddress.startsWith('172.')) {
    // 内网IP，风险较低
    score -= 10
  }
  
  return Math.max(0, Math.min(100, score))
}

/**
 * 生成安全事件摘要
 */
export function generateSecuritySummary(
  eventType: string,
  context: SecurityEventContext,
  additionalData?: Record<string, any>
): string {
  const parts = [
    `Event: ${eventType}`,
    `IP: ${context.ipAddress}`,
    context.userAgent ? `UA: ${context.userAgent.substring(0, 50)}...` : null,
    context.deviceFingerprint ? `Device: ${context.deviceFingerprint.substring(0, 16)}...` : null,
    additionalData?.reason ? `Reason: ${additionalData.reason}` : null
  ].filter(Boolean)
  
  return parts.join(' | ')
}