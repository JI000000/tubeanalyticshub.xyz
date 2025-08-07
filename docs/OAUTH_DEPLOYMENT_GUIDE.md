# OAuth配置和部署指南

## 概述

本指南详细说明如何配置和部署智能登录系统的OAuth认证功能，包括GitHub、Google等第三方登录提供商的设置步骤。

## OAuth提供商配置

### 1. GitHub OAuth应用配置

#### 1.1 创建GitHub OAuth应用

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息：
   - **Application name**: `YouTube Scraper`
   - **Homepage URL**: `https://your-domain.com`
   - **Application description**: `YouTube视频分析工具`
   - **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`

#### 1.2 获取客户端凭据

```bash
# 开发环境
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# 生产环境 (不同的OAuth应用)
GITHUB_ID_PROD=your_prod_github_client_id
GITHUB_SECRET_PROD=your_prod_github_client_secret
```

#### 1.3 GitHub OAuth权限范围

默认请求的权限：
- `user:email` - 获取用户邮箱地址
- `read:user` - 读取用户基本信息

```typescript
// src/app/api/auth/[...nextauth]/route.ts
GitHubProvider({
  clientId: process.env.GITHUB_ID!,
  clientSecret: process.env.GITHUB_SECRET!,
  authorization: {
    params: {
      scope: 'user:email read:user'
    }
  }
})
```

### 2. Google OAuth应用配置

#### 2.1 创建Google Cloud项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API 和 Google Identity API

#### 2.2 配置OAuth同意屏幕

1. 导航到 "APIs & Services" > "OAuth consent screen"
2. 选择用户类型（外部用户）
3. 填写应用信息：
   - **应用名称**: `YouTube Scraper`
   - **用户支持邮箱**: `support@your-domain.com`
   - **应用域名**: `your-domain.com`
   - **授权域名**: `your-domain.com`
   - **开发者联系信息**: `dev@your-domain.com`

#### 2.3 创建OAuth客户端ID

1. 导航到 "APIs & Services" > "Credentials"
2. 点击 "Create Credentials" > "OAuth client ID"
3. 选择应用类型：Web application
4. 配置重定向URI：
   - `http://localhost:3000/api/auth/callback/google` (开发环境)
   - `https://your-domain.com/api/auth/callback/google` (生产环境)

#### 2.4 环境变量配置

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### 2.5 Google OAuth权限范围

```typescript
// src/app/api/auth/[...nextauth]/route.ts
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'openid email profile'
    }
  }
})
```

### 3. 邮箱登录配置（降级方案）

#### 3.1 SMTP服务配置

```bash
# 邮件服务配置 (使用Resend或SendGrid)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your_resend_api_key
EMAIL_FROM=noreply@your-domain.com
```

#### 3.2 邮箱验证配置

```typescript
// NextAuth.js 邮箱提供商配置
EmailProvider({
  server: {
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  },
  from: process.env.EMAIL_FROM,
})
```

## 环境配置

### 1. 开发环境配置

#### 1.1 本地环境变量 (.env.local)

```bash
# NextAuth.js 基础配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-key

# GitHub OAuth (开发环境)
GITHUB_ID=your_dev_github_client_id
GITHUB_SECRET=your_dev_github_client_secret

# Google OAuth (开发环境)
GOOGLE_CLIENT_ID=your_dev_google_client_id
GOOGLE_CLIENT_SECRET=your_dev_google_client_secret

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 调试模式
NEXTAUTH_DEBUG=true
```

#### 1.2 本地开发服务器

```bash
# 启动开发服务器
npm run dev

# 验证OAuth配置
curl http://localhost:3000/api/auth/providers
```

### 2. 生产环境配置

#### 2.1 环境变量配置

```bash
# NextAuth.js 生产配置
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key-min-32-chars

# GitHub OAuth (生产环境)
GITHUB_ID=your_prod_github_client_id
GITHUB_SECRET=your_prod_github_client_secret

# Google OAuth (生产环境)
GOOGLE_CLIENT_ID=your_prod_google_client_id
GOOGLE_CLIENT_SECRET=your_prod_google_client_secret

# Supabase 生产配置
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key

# 安全配置
NODE_ENV=production
NEXTAUTH_DEBUG=false
```

#### 2.2 Vercel部署配置

```bash
# 使用Vercel CLI部署
vercel --prod

# 或者配置环境变量后推送到GitHub
git push origin main
```

## 数据库配置

### 1. Supabase数据库设置

#### 1.1 创建NextAuth.js所需表

```sql
-- 运行迁移文件
-- supabase/migrations/20250801000001_add_nextauth_fields.sql

-- 验证表创建
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('accounts', 'sessions', 'users', 'verification_tokens');
```

#### 1.2 配置行级安全策略 (RLS)

```sql
-- 启用RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY "Users can view own account" ON accounts
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (user_id = auth.uid()::text);
```

### 2. 数据库连接配置

#### 2.1 连接池设置

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
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
  }
})
```

## 安全配置

### 1. HTTPS配置

#### 1.1 SSL证书设置

```bash
# Vercel自动提供SSL证书
# 自定义域名需要在Vercel控制台配置

# 验证HTTPS配置
curl -I https://your-domain.com/api/auth/session
```

#### 1.2 安全头配置

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

### 2. CSRF保护

NextAuth.js自动提供CSRF保护，无需额外配置。

### 3. 会话安全

```typescript
// src/app/api/auth/[...nextauth]/route.ts
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7天
    updateAge: 24 * 60 * 60,   // 24小时更新一次
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,  // 7天
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}
```

## 部署流程

### 1. 预部署检查清单

- [ ] 所有环境变量已配置
- [ ] OAuth应用回调URL已更新
- [ ] 数据库迁移已执行
- [ ] SSL证书已配置
- [ ] 安全策略已设置

### 2. 部署步骤

#### 2.1 Vercel部署

```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录Vercel
vercel login

# 3. 配置项目
vercel

# 4. 设置环境变量
vercel env add NEXTAUTH_SECRET
vercel env add GITHUB_ID
vercel env add GITHUB_SECRET
# ... 其他环境变量

# 5. 部署到生产环境
vercel --prod
```

#### 2.2 自定义域名配置

1. 在Vercel控制台添加自定义域名
2. 配置DNS记录指向Vercel
3. 更新OAuth应用的回调URL
4. 更新NEXTAUTH_URL环境变量

### 3. 部署后验证

#### 3.1 功能测试

```bash
# 测试认证端点
curl https://your-domain.com/api/auth/providers

# 测试会话获取
curl https://your-domain.com/api/auth/session

# 测试OAuth回调
# 手动测试GitHub/Google登录流程
```

#### 3.2 性能监控

```typescript
// 添加性能监控
import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()
  
  try {
    // 业务逻辑
    const result = await someOperation()
    
    const duration = Date.now() - start
    console.log(`API响应时间: ${duration}ms`)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

## 故障排除

### 1. 常见OAuth错误

#### 1.1 回调URL不匹配

**错误信息**: `redirect_uri_mismatch`

**解决方案**:
1. 检查OAuth应用配置的回调URL
2. 确保NEXTAUTH_URL环境变量正确
3. 验证开发/生产环境URL一致性

#### 1.2 客户端ID/密钥错误

**错误信息**: `invalid_client`

**解决方案**:
1. 验证环境变量配置
2. 检查OAuth应用状态
3. 确认客户端密钥未过期

### 2. 会话问题

#### 2.1 会话无法保持

**可能原因**:
- Cookie设置问题
- HTTPS配置问题
- 跨域问题

**解决方案**:
```typescript
// 检查Cookie配置
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.your-domain.com' : undefined
    }
  }
}
```

### 3. 数据库连接问题

#### 3.1 连接超时

**解决方案**:
1. 检查Supabase项目状态
2. 验证服务角色密钥
3. 检查网络连接

#### 3.2 权限错误

**解决方案**:
1. 验证RLS策略
2. 检查服务角色权限
3. 确认表结构正确

## 监控和维护

### 1. 日志监控

```typescript
// 添加结构化日志
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    logger.info('OAuth登录开始', {
      provider: 'github',
      timestamp: new Date().toISOString()
    })
    
    // 业务逻辑
    
    logger.info('OAuth登录成功', {
      userId: user.id,
      provider: 'github'
    })
  } catch (error) {
    logger.error('OAuth登录失败', {
      error: error.message,
      stack: error.stack
    })
  }
}
```

### 2. 性能监控

```typescript
// 添加性能指标收集
const metrics = {
  loginAttempts: 0,
  loginSuccesses: 0,
  loginFailures: 0,
  averageResponseTime: 0
}

// 定期上报指标
setInterval(() => {
  console.log('登录系统指标:', metrics)
  // 发送到监控服务
}, 60000) // 每分钟上报一次
```

### 3. 定期维护任务

```bash
# 清理过期会话 (可以设置为定时任务)
# 创建清理脚本
cat > scripts/cleanup-sessions.js << 'EOF'
const { supabase } = require('../src/lib/supabase')

async function cleanupExpiredSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .delete()
    .lt('expires', new Date().toISOString())
  
  console.log(`清理了 ${data?.length || 0} 个过期会话`)
}

cleanupExpiredSessions()
EOF

# 设置定时任务 (使用GitHub Actions或Vercel Cron)
```

## 安全最佳实践

### 1. 密钥管理

- 使用强随机密钥 (至少32字符)
- 定期轮换OAuth客户端密钥
- 使用环境变量存储敏感信息
- 不在代码中硬编码密钥

### 2. 访问控制

- 实施最小权限原则
- 定期审查OAuth权限范围
- 监控异常登录行为
- 实施账户锁定机制

### 3. 数据保护

- 启用数据库加密
- 实施数据备份策略
- 遵循GDPR等隐私法规
- 定期安全审计

---

**文档版本**: v1.0  
**最后更新**: 2025-01-03  
**维护者**: 开发团队