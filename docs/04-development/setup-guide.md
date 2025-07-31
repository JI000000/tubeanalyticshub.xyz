# YouTube Scraper 数据库设置指南

由于网络连接问题，我们需要手动在 Supabase 控制台设置数据库。

## 🎯 立即行动步骤

### 1. 访问 Supabase 控制台
- 打开浏览器访问: https://supabase.com/dashboard
- 登录你的账户
- 选择项目: **supabase-green-garden** (ID: uaqwcqwowxbdjrbcwcqg)

### 2. 执行数据库初始化
1. 在左侧菜单点击 **SQL Editor**
2. 点击 **New Query** 创建新查询
3. 复制 `supabase/schema.sql` 文件的完整内容
4. 粘贴到查询编辑器中
5. 点击 **Run** 执行

### 3. 验证表创建
执行完成后，应该看到以下表被创建：
- ✅ yt_users (用户表)
- ✅ yt_videos (视频表)  
- ✅ yt_channels (频道表)
- ✅ yt_comments (评论表)
- ✅ yt_scraping_tasks (任务表)
- ✅ yt_ai_analysis (AI分析表)

### 4. 检查测试数据
在 **Table Editor** 中检查 `yt_users` 表，应该有一条测试记录：
- ID: 00000000-0000-0000-0000-000000000001
- Email: demo@example.com
- Plan: free

## 🔧 如果遇到问题

### 权限错误
如果看到权限相关错误，请：
1. 确认你是项目的 Owner
2. 检查 RLS (Row Level Security) 设置
3. 可以暂时禁用 RLS 进行测试

### 表已存在错误
如果看到 "table already exists" 错误：
1. 这是正常的，说明表已经创建过了
2. 可以忽略这些错误
3. 重点检查是否有其他错误

## ✅ 完成后的验证

数据库设置完成后，运行以下命令验证：

```bash
# 启动开发服务器
npm run dev

# 在浏览器访问
http://localhost:3000
```

如果页面正常加载且没有数据库错误，说明设置成功！

## 📞 需要协助

如果在设置过程中遇到任何问题，请：
1. 截图错误信息
2. 告诉我具体在哪一步遇到问题
3. 我会立即协助解决

---

**重要提醒**: 
- 确保使用正确的项目 (uaqwcqwowxbdjrbcwcqg)
- 不要修改现有的环境变量配置
- 如果不确定，随时问我！