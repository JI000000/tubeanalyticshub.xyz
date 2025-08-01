# 🚀 YouTube Analytics Platform - 设置指南

本指南将帮助你完成YouTube Analytics Platform的完整设置，包括YouTube API集成和数据库配置。

---

## 📋 前置要求

- Node.js 18+ 
- npm 或 yarn
- Google Cloud Platform 账户
- Supabase 账户

---

## 🔧 1. YouTube Data API v3 设置

### 1.1 创建Google Cloud项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 在项目中启用 YouTube Data API v3

### 1.2 创建API密钥

1. 在Google Cloud Console中，转到 "APIs & Services" > "Credentials"
2. 点击 "Create Credentials" > "API Key"
3. 复制生成的API密钥
4. （可选）为API密钥设置限制以提高安全性

### 1.3 配置API配额

- YouTube Data API v3 每日免费配额：10,000 units
- 每个API调用消耗不同的units：
  - 获取视频信息：1 unit
  - 获取频道信息：1 unit  
  - 获取评论：1 unit
  - 搜索：100 units

---

## 🗄️ 2. Supabase 数据库设置

### 2.1 创建Supabase项目

1. 访问 [Supabase](https://supabase.com/)
2. 创建新项目
3. 记录项目URL和API密钥

### 2.2 创建数据表

在Supabase SQL编辑器中执行以下SQL：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS yt_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 频道表
CREATE TABLE IF NOT EXISTS yt_channels (
  id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  custom_url VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE,
  thumbnails JSONB,
  subscriber_count BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  view_count BIGINT DEFAULT 0,
  user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- 视频表
CREATE TABLE IF NOT EXISTS yt_videos (
  id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  channel_id VARCHAR(255) NOT NULL,
  channel_title VARCHAR(500),
  published_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0,
  view_count BIGINT DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  tags TEXT[],
  thumbnails JSONB,
  ai_summary TEXT,
  sentiment_score DECIMAL(3,2),
  keywords TEXT[],
  user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- 评论表
CREATE TABLE IF NOT EXISTS yt_comments (
  id VARCHAR(255) PRIMARY KEY,
  video_id VARCHAR(255) NOT NULL,
  text_display TEXT NOT NULL,
  text_original TEXT NOT NULL,
  author_display_name VARCHAR(255),
  author_profile_image_url TEXT,
  author_channel_url TEXT,
  author_channel_id VARCHAR(255),
  like_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  parent_id VARCHAR(255),
  total_reply_count INTEGER DEFAULT 0,
  sentiment_score DECIMAL(3,2),
  user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_yt_channels_user_id ON yt_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_channels_subscriber_count ON yt_channels(subscriber_count DESC);
CREATE INDEX IF NOT EXISTS idx_yt_videos_user_id ON yt_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_channel_id ON yt_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_published_at ON yt_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_yt_comments_video_id ON yt_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_yt_comments_user_id ON yt_comments(user_id);
```

### 2.3 设置行级安全策略 (RLS)

```sql
-- 启用RLS
ALTER TABLE yt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_comments ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON yt_channels
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own data" ON yt_videos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own data" ON yt_comments
  FOR ALL USING (auth.uid() = user_id);
```

---

## ⚙️ 3. 环境变量配置

### 3.1 创建 .env.local 文件

复制 `.env.example` 文件并重命名为 `.env.local`：

```bash
cp .env.example .env.local
```

### 3.2 填写环境变量

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key

# Next.js Configuration
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

---

## 🚀 4. 启动应用

### 4.1 安装依赖

```bash
npm install
```

### 4.2 启动开发服务器

```bash
npm run dev
```

### 4.3 访问应用

打开浏览器访问 `http://localhost:3000`

---

## 🧪 5. 测试API集成

### 5.1 测试频道添加

1. 访问 Channels 页面
2. 输入YouTube频道URL，例如：
   - `https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw`
   - `https://www.youtube.com/@GoogleDevelopers`
3. 点击添加按钮

### 5.2 测试视频分析

1. 访问 Videos 页面
2. 输入YouTube视频URL，例如：
   - `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. 点击分析按钮

### 5.3 检查数据库

在Supabase控制台中检查数据是否正确保存到相应的表中。

---

## 🔍 6. 故障排除

### 6.1 YouTube API错误

**错误**: "YouTube API key not configured"
**解决**: 确保在 `.env.local` 中正确设置了 `YOUTUBE_API_KEY`

**错误**: "YouTube API quota exceeded"
**解决**: 等待配额重置（每日重置）或升级到付费计划

### 6.2 数据库连接错误

**错误**: "Failed to connect to Supabase"
**解决**: 检查 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 是否正确

### 6.3 权限错误

**错误**: "Row Level Security policy violation"
**解决**: 确保RLS策略正确设置，或临时禁用RLS进行测试

---

## 📈 7. 生产部署

### 7.1 Vercel部署

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 设置环境变量
4. 部署应用

### 7.2 环境变量设置

在Vercel项目设置中添加所有必要的环境变量。

---

## 🎯 8. 下一步

设置完成后，你可以：

1. **添加用户认证**: 集成Supabase Auth
2. **完善AI功能**: 集成OpenAI API进行内容分析
3. **添加更多功能**: 实现高级分析和报告功能
4. **优化性能**: 实现数据缓存和批量处理

---

## 📞 支持

如果在设置过程中遇到问题，请：

1. 检查控制台错误信息
2. 确认所有环境变量正确设置
3. 验证API密钥有效性
4. 检查数据库表结构

祝你使用愉快！🚀