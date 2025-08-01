# 手动数据库设置指南

由于网络连接问题，我们需要手动在Supabase控制台设置数据库。

## 步骤

1. 访问 Supabase 控制台: https://supabase.com/dashboard
2. 选择项目: uaqwcqwowxbdjrbcwcqg
3. 进入 SQL Editor
4. 执行以下SQL文件内容: `supabase/schema.sql`

## 验证

执行完成后，应该看到以下表：
- yt_users
- yt_videos  
- yt_channels
- yt_comments
- yt_scraping_tasks
- yt_ai_analysis

## 测试数据

会自动插入一个测试用户：
- ID: 00000000-0000-0000-0000-000000000001
- Email: demo@example.com
- Plan: free
- Quota: 1000

## 下一步

数据库设置完成后，运行：
```bash
npm run dev
```

开始测试应用功能。