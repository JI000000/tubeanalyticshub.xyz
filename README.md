# YouTube Analytics Platform

一个基于 Next.js 15.4.2 的智能 YouTube 分析平台，提供内容分析、用户行为洞察和智能登录系统。

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn
- Supabase 账户
- Vercel 账户 (用于部署)

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/JI000000/tubeanalyticshub.xyz.git
cd youtube-scraper

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，填入你的配置

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🎯 核心功能

### 智能登录系统
- **智能登录模态框**: 根据用户行为动态触发
- **匿名试用系统**: 基于浏览器指纹的试用机制
- **多语言支持**: 完整的中英文国际化
- **设备同步**: 跨设备用户状态同步

### 认证和授权
- **NextAuth.js 集成**: 完整的 OAuth 支持
- **社交登录**: Google, GitHub, Discord 等
- **邮箱登录**: 自定义邮箱验证流程
- **安全机制**: 会话管理、隐私保护

### 用户体验优化
- **响应式设计**: 移动端和桌面端适配
- **性能优化**: Turbopack 编译优化
- **错误处理**: 完善的错误恢复机制
- **分析系统**: 用户行为分析和转化优化

## 🛠️ 开发工具

### 测试命令

```bash
# 运行所有测试
npm run test:all

# 运行单元测试
npm test

# 运行 E2E 测试
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage

# 清理测试结果
npm run test:clean
```

### 开发工具

```bash
# 项目健康检查
npm run dev:health

# 完整项目检查
npm run dev:check

# 清理项目
npm run dev:cleanup

# 数据库检查
npm run db:check

# 数据库初始化
npm run db:init
```

### 构建和部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start

# 部署到 Vercel
npm run deploy

# 部署预览
npm run deploy:preview
```

## 📁 项目结构

```
youtube-scraper/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # 多语言路由
│   │   ├── api/               # API 路由
│   │   └── auth/              # 认证页面
│   ├── components/            # React 组件
│   │   ├── auth/             # 认证相关组件
│   │   ├── ui/               # UI 组件库
│   │   └── layout/           # 布局组件
│   ├── hooks/                # 自定义 Hooks
│   ├── lib/                  # 工具库
│   ├── types/                # TypeScript 类型定义
│   └── i18n/                 # 国际化配置
├── e2e/                      # E2E 测试
├── scripts/                  # 开发脚本
├── docs/                     # 文档
└── supabase/                 # 数据库迁移
```

## 🔧 技术栈

- **前端**: Next.js 15.4.2, React 19, TypeScript
- **样式**: Tailwind CSS, Radix UI
- **数据库**: Supabase (PostgreSQL)
- **认证**: NextAuth.js
- **测试**: Jest, Playwright
- **部署**: Vercel

## 📊 性能指标

- **构建时间**: < 30s (Turbopack)
- **首屏加载**: < 2s
- **Lighthouse 分数**: > 90
- **测试覆盖率**: > 80%

## 🌐 环境变量

创建 `.env.local` 文件并配置以下变量：

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
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

## 🧪 测试

### 单元测试
```bash
npm test
```

### E2E 测试
```bash
npm run test:e2e
```

### 测试覆盖率
```bash
npm run test:coverage
```

## 🚀 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 运行数据库迁移
4. 部署

```bash
npm run deploy
```

### 数据库迁移

```bash
# 运行迁移
npx supabase db push

# 重置数据库
npx supabase db reset
```

## 📚 文档

- [实现总结](./docs/IMPLEMENTATION_SUMMARY.md)
- [API 文档](./docs/API_DOCUMENTATION.md)
- [部署指南](./docs/DEPLOYMENT_GUIDE.md)
- [故障排除](./docs/TROUBLESHOOTING_FAQ.md)

## 🤝 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果你遇到问题，请：

1. 查看 [故障排除文档](./docs/TROUBLESHOOTING_FAQ.md)
2. 搜索现有的 [Issues](../../issues)
3. 创建新的 Issue

## 🎉 项目状态

- **开发阶段**: 完成 ✅
- **测试阶段**: 完成 ✅
- **部署阶段**: 完成 ✅
- **文档阶段**: 完成 ✅

---

**YouTube Analytics Platform** - 智能分析，洞察未来 🚀
