# 常见问题和故障排除文档

## 概述

本文档收集了智能登录系统在开发、部署和运行过程中的常见问题及其解决方案，帮助开发者快速定位和解决问题。

## 常见问题 (FAQ)

### 1. 认证相关问题

#### Q1: 用户登录后立即被登出，会话无法保持？

**可能原因**:
- Cookie配置问题
- HTTPS/HTTP混用
- 跨域问题
- 时区设置问题

**解决方案**:
```typescript
// 检查NextAuth.js配置
export const authOptions: NextAuthOptions = {
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // 确保域名配置正确
        domain: process.env.NODE_ENV === 'production' ? '.your-domain.com' : undefined
      }
    }
  },
  // 确保时区设置正确
  session: {
    maxAge: 7 * 24 * 60 * 60, // 7天
    updateAge: 24 * 60 * 60,   // 24小时
  }
}
```

#### Q2: GitHub/Google OAuth登录失败，显示"invalid_client"错误？

**可能原因**:
- 客户端ID或密钥错误
- OAuth应用配置问题
- 环境变量未正确设置

**解决方案**:
1. 验证环境变量配置：
```bash
# 检查环境变量是否正确设置
echo $GITHUB_ID
echo $GOOGLE_CLIENT_ID
# 注意：不要打印密钥到控制台
```

2. 检查OAuth应用状态：
   - GitHub: 访问 https://github.com/settings/developers
   - Google: 访问 https://console.cloud.google.com/apis/credentials

3. 验证回调URL配置：
   - 开发环境: `http://localhost:3000/api/auth/callback/[provider]`
   - 生产环境: `https://your-domain.com/api/auth/callback/[provider]`

#### Q3: 匿名试用次数不准确或无法正常工作？

**可能原因**:
- 浏览器指纹生成失败
- 本地存储被清除
- 服务端验证逻辑错误

**解决方案**:
```typescript
// 调试指纹生成
import { generateFingerprint } from '@/lib/fingerprint'

const debugFingerprint = async () => {
  try {
    const fingerprint = await generateFingerprint()
    console.log('生成的指纹:', fingerprint)
    
    // 检查本地存储
    const stored = localStorage.getItem('trial_status')
    console.log('本地存储的试用状态:', stored)
  } catch (error) {
    console.error('指纹生成失败:', error)
  }
}
```

#### Q4: 移动端OAuth登录跳转后无法返回应用？

**可能原因**:
- 移动浏览器跳转处理问题
- 回调URL在移动端无法正确处理
- 应用间跳转配置问题

**解决方案**:
```typescript
// 优化移动端OAuth处理
const handleMobileOAuth = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  
  if (isMobile) {
    // 使用弹窗模式而不是重定向
    signIn('github', { 
      callbackUrl: window.location.href,
      redirect: false 
    })
  } else {
    signIn('github')
  }
}
```

### 2. 数据库相关问题

#### Q5: Supabase连接超时或连接失败？

**可能原因**:
- 网络连接问题
- Supabase项目暂停
- 连接池耗尽
- 服务角色密钥错误

**解决方案**:
```typescript
// 添加连接重试机制
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'youtube-scraper'
    }
  },
  // 添加重试配置
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 连接测试函数
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) throw error
    console.log('数据库连接正常')
    return true
  } catch (error) {
    console.error('数据库连接失败:', error)
    return false
  }
}
```

#### Q6: 数据库迁移失败或表结构不正确？

**解决方案**:
```bash
# 检查迁移状态
npx supabase migration list

# 重新运行迁移
npx supabase db reset

# 手动检查表结构
psql -h db.your-project.supabase.co -U postgres -d postgres -c "\dt"
```

### 3. 性能相关问题

#### Q7: 登录响应时间过长？

**可能原因**:
- 数据库查询未优化
- 网络延迟
- 第三方OAuth服务响应慢

**解决方案**:
```typescript
// 添加性能监控
export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    // 业务逻辑
    const result = await processLogin()
    
    const duration = Date.now() - startTime
    if (duration > 2000) {
      console.warn(`登录响应时间过长: ${duration}ms`)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`登录失败，耗时: ${duration}ms`, error)
    throw error
  }
}

// 优化数据库查询
const optimizedUserQuery = async (userId: string) => {
  const { data, error } = await supabase
    .from('yt_users')
    .select('id, email, display_name, avatar_url')
    .eq('nextauth_user_id', userId)
    .single()
  
  return { data, error }
}
```

#### Q8: 内存使用过高或内存泄漏？

**解决方案**:
```typescript
// 添加内存监控
const monitorMemory = () => {
  const used = process.memoryUsage()
  console.log('内存使用情况:')
  for (let key in used) {
    console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
  }
}

// 定期清理
setInterval(() => {
  if (global.gc) {
    global.gc()
  }
  monitorMemory()
}, 300000) // 每5分钟检查一次

// 清理事件监听器
useEffect(() => {
  const handleVisibilityChange = () => {
    // 处理页面可见性变化
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [])
```

### 4. 安全相关问题

#### Q9: 收到CSRF攻击警告？

**解决方案**:
NextAuth.js自动处理CSRF保护，但如果遇到问题：

```typescript
// 检查CSRF配置
export const authOptions: NextAuthOptions = {
  // 确保使用安全的Cookie设置
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  // 自定义CSRF令牌生成
  callbacks: {
    async signIn({ user, account, profile }) {
      // 添加额外的安全检查
      if (account?.provider === 'github') {
        // 验证GitHub用户信息
        if (!profile?.email) {
          return false
        }
      }
      return true
    }
  }
}
```

#### Q10: 检测到异常登录行为？

**解决方案**:
```typescript
// 实现异常登录检测
const detectAnomalousLogin = async (userId: string, loginInfo: any) => {
  const recentLogins = await supabase
    .from('yt_login_analytics')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10)
  
  // 检查异常模式
  const suspiciousPatterns = [
    // 短时间内多次登录失败
    recentLogins.data?.filter(log => log.event_type === 'login_failed').length > 5,
    // 来自不同地理位置的登录
    // 使用不常见的设备登录
  ]
  
  if (suspiciousPatterns.some(pattern => pattern)) {
    // 发送安全警报
    await sendSecurityAlert(userId, loginInfo)
  }
}
```

## 故障排除流程

### 1. 问题诊断步骤

#### 步骤1: 收集基本信息
```bash
# 检查系统状态
curl -I https://your-domain.com/api/auth/session

# 检查环境变量
env | grep -E "(NEXTAUTH|GITHUB|GOOGLE|SUPABASE)"

# 检查日志
tail -f /var/log/application.log
```

#### 步骤2: 启用调试模式
```bash
# 开发环境启用调试
NEXTAUTH_DEBUG=true npm run dev

# 生产环境临时启用调试（谨慎使用）
NEXTAUTH_DEBUG=true npm start
```

#### 步骤3: 检查网络连接
```bash
# 测试OAuth提供商连接
curl -I https://github.com/login/oauth/authorize
curl -I https://accounts.google.com/oauth2/auth

# 测试数据库连接
curl -I https://your-project.supabase.co/rest/v1/
```

### 2. 常见错误代码

#### 认证错误代码
- `OAuthAccountNotLinked`: OAuth账户未关联
- `OAuthCallback`: OAuth回调处理失败
- `OAuthCreateAccount`: 创建OAuth账户失败
- `EmailCreateAccount`: 邮箱账户创建失败
- `Callback`: 通用回调错误
- `OAuthSignin`: OAuth登录失败
- `EmailSignin`: 邮箱登录失败
- `CredentialsSignin`: 凭据登录失败
- `SessionRequired`: 需要会话但未找到

#### 数据库错误代码
- `23505`: 唯一约束违反
- `23503`: 外键约束违反
- `42P01`: 表不存在
- `42703`: 列不存在

### 3. 日志分析

#### 3.1 结构化日志格式
```typescript
// 统一日志格式
interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  context: {
    userId?: string
    sessionId?: string
    provider?: string
    action?: string
    error?: any
  }
}

const logger = {
  info: (message: string, context: any = {}) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context
    }))
  },
  
  error: (message: string, context: any = {}) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context
    }))
  }
}
```

#### 3.2 关键日志点
```typescript
// 登录开始
logger.info('用户登录开始', {
  provider: 'github',
  userAgent: request.headers.get('user-agent'),
  ip: request.headers.get('x-forwarded-for')
})

// 登录成功
logger.info('用户登录成功', {
  userId: user.id,
  provider: 'github',
  isNewUser: account.isNewUser
})

// 登录失败
logger.error('用户登录失败', {
  provider: 'github',
  error: error.message,
  errorCode: error.code
})
```

## 性能优化建议

### 1. 前端优化

#### 1.1 组件懒加载
```typescript
// 懒加载登录模态框
const SmartLoginModal = lazy(() => import('@/components/auth/SmartLoginModal'))

// 使用Suspense包装
<Suspense fallback={<div>加载中...</div>}>
  <SmartLoginModal />
</Suspense>
```

#### 1.2 状态管理优化
```typescript
// 使用useMemo缓存计算结果
const trialStatus = useMemo(() => {
  return calculateTrialStatus(fingerprint, actions)
}, [fingerprint, actions])

// 使用useCallback缓存函数
const handleLogin = useCallback(async (provider: string) => {
  await signIn(provider)
}, [])
```

### 2. 后端优化

#### 2.1 数据库查询优化
```sql
-- 添加必要的索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yt_users_nextauth_id 
ON yt_users(nextauth_user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yt_anonymous_trials_fingerprint 
ON yt_anonymous_trials(fingerprint);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yt_login_analytics_created_at 
ON yt_login_analytics(created_at DESC);
```

#### 2.2 缓存策略
```typescript
// 使用Redis缓存会话信息
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

const cacheSession = async (sessionId: string, sessionData: any) => {
  await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(sessionData))
}

const getCachedSession = async (sessionId: string) => {
  const cached = await redis.get(`session:${sessionId}`)
  return cached ? JSON.parse(cached) : null
}
```

## 监控和告警

### 1. 关键指标监控

#### 1.1 业务指标
```typescript
// 登录转化率监控
const trackLoginConversion = async () => {
  const stats = await supabase
    .from('yt_login_analytics')
    .select('event_type')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  
  const promptShown = stats.data?.filter(s => s.event_type === 'prompt_shown').length || 0
  const loginSuccess = stats.data?.filter(s => s.event_type === 'login_success').length || 0
  
  const conversionRate = promptShown > 0 ? (loginSuccess / promptShown) * 100 : 0
  
  console.log(`24小时登录转化率: ${conversionRate.toFixed(2)}%`)
  
  // 如果转化率过低，发送告警
  if (conversionRate < 10) {
    await sendAlert('登录转化率过低', { conversionRate })
  }
}
```

#### 1.2 技术指标
```typescript
// API响应时间监控
const monitorApiPerformance = () => {
  const startTime = Date.now()
  
  return {
    end: () => {
      const duration = Date.now() - startTime
      
      // 记录响应时间
      console.log(`API响应时间: ${duration}ms`)
      
      // 如果响应时间过长，发送告警
      if (duration > 5000) {
        sendAlert('API响应时间过长', { duration })
      }
      
      return duration
    }
  }
}
```

### 2. 告警配置

#### 2.1 告警规则
```typescript
interface AlertRule {
  name: string
  condition: (metrics: any) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // 冷却时间（秒）
}

const alertRules: AlertRule[] = [
  {
    name: '登录失败率过高',
    condition: (metrics) => metrics.loginFailureRate > 20,
    severity: 'high',
    cooldown: 300
  },
  {
    name: 'API响应时间过长',
    condition: (metrics) => metrics.avgResponseTime > 3000,
    severity: 'medium',
    cooldown: 600
  },
  {
    name: '数据库连接失败',
    condition: (metrics) => metrics.dbConnectionFailures > 5,
    severity: 'critical',
    cooldown: 60
  }
]
```

#### 2.2 告警通知
```typescript
const sendAlert = async (message: string, context: any) => {
  // 发送到Slack
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 ${message}`,
      attachments: [{
        color: 'danger',
        fields: Object.entries(context).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        }))
      }]
    })
  })
  
  // 发送邮件通知
  await sendEmail({
    to: 'dev-team@your-domain.com',
    subject: `系统告警: ${message}`,
    body: JSON.stringify(context, null, 2)
  })
}
```

## 维护检查清单

### 日常维护 (每日)
- [ ] 检查系统错误日志
- [ ] 监控登录成功率
- [ ] 检查API响应时间
- [ ] 验证数据库连接状态

### 周度维护 (每周)
- [ ] 清理过期会话数据
- [ ] 分析用户登录模式
- [ ] 检查安全日志异常
- [ ] 更新依赖包版本

### 月度维护 (每月)
- [ ] 性能基准测试
- [ ] 安全漏洞扫描
- [ ] 备份策略验证
- [ ] 容量规划评估

### 季度维护 (每季度)
- [ ] OAuth应用配置审查
- [ ] 密钥轮换计划
- [ ] 灾难恢复演练
- [ ] 用户体验分析

---

**文档版本**: v1.0  
**最后更新**: 2025-01-03  
**维护者**: 开发团队