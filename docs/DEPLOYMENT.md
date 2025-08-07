# 部署指南

## 🚀 快速部署

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/JI000000/tubeanalyticshub.xyz.git
cd youtube-scraper

# 安装依赖
npm install
```

### 2. 环境变量配置

创建 `.env.local` 文件：

```env
# NextAuth.js
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. 数据库设置

```bash
# 运行数据库迁移
npx supabase db push

# 或使用脚本
npm run db:init
```

### 4. Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 部署

```bash
npm run deploy
```

## 🔧 常见问题

### 构建失败
- 检查 Node.js 版本 (需要 18+)
- 确认所有环境变量已配置
- 运行 `npm run dev:check` 检查项目状态

### 数据库连接问题
- 确认 Supabase 项目已创建
- 检查环境变量中的数据库 URL 和密钥
- 运行 `npm run db:check` 检查连接

### 认证问题
- 确认 OAuth 应用已正确配置
- 检查回调 URL 设置
- 验证 NEXTAUTH_SECRET 已设置

## 📊 部署检查清单

- [ ] 环境变量配置完成
- [ ] 数据库迁移已运行
- [ ] OAuth 应用已配置
- [ ] 域名已设置
- [ ] SSL 证书已激活
- [ ] 功能测试通过

## 🛠️ 维护命令

```bash
# 项目健康检查
npm run dev:health

# 完整项目检查
npm run dev:check

# 运行所有测试
npm run test:all

# 清理项目
npm run dev:cleanup
``` 