# YouTube Scraper 项目配置文档

## Supabase 配置

### 项目信息
- **Project Name**: supabase-green-garden
- **Project ID**: uaqwcqwowxbdjrbcwcqg  
- **Project URL**: https://uaqwcqwowxbdjrbcwcqg.supabase.co
- **状态**: 与其他项目共用

### 数据库表命名规则
由于与其他项目共用Supabase实例，所有表名必须添加前缀 `yt_` 以避免冲突：

- `yt_users` - 用户表
- `yt_videos` - 视频数据表  
- `yt_channels` - 频道数据表
- `yt_comments` - 评论数据表
- `yt_scraping_tasks` - 采集任务表
- `yt_ai_analysis` - AI分析结果表

### API密钥
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcXdjcXdvd3hiZGpyYmN3Y3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTQ1NjUsImV4cCI6MjA2NTU5MDU2NX0.exMJ1dJo1fVhoI0jqhIC9pqlTNOjXbAFMVtACEQUpxk`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcXdjcXdvd3hiZGpyYmN3Y3FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAxNDU2NSwiZXhwIjoyMDY1NTkwNTY1fQ.6B5KmXRvnR3G9u5C_ulu_gIZqYHv2HXhVbQjoDI7aNU`

## YouTube Data API 配置

### API信息
- **服务**: YouTube Data API v3
- **费用**: 免费（有配额限制）
- **每日配额**: 10,000个单位
- **配额消耗**:
  - 获取视频信息: 1单位
  - 获取频道信息: 1单位
  - 搜索视频: 100单位
  - 获取评论: 1单位

### 申请步骤
1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建新项目或选择现有项目
3. 启用 "YouTube Data API v3"
4. 创建凭据 → API密钥
5. 限制API密钥只能访问YouTube Data API

## OpenAI API 配置（可选）

### 用途
- 高级AI分析功能
- 内容摘要生成
- 趋势预测

### 费用
- GPT-4o-mini: $0.15/1K tokens（输入）+ $0.60/1K tokens（输出）
- 预估成本: 每1000次分析约$2-5

## 安全注意事项

1. **环境变量**: 所有敏感信息存储在 `.env.local` 中
2. **Git忽略**: `.env.local` 已添加到 `.gitignore`
3. **生产环境**: 使用不同的API密钥和配置
4. **权限控制**: 使用Supabase RLS策略限制数据访问