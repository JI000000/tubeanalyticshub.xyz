# 数据库同步指南

## 🔍 当前问题

通过检查发现，线上数据库缺少以下表：
- `yt_analytics` - 分析数据表
- `yt_insights` - 洞察报告表  
- `yt_reports` - 报告系统表
- `yt_teams` - 团队管理表
- `yt_team_members` - 团队成员表
- `yt_anonymous_trials` - 匿名试用表
- `yt_login_analytics` - 登录分析表
- `accounts` - NextAuth账户表
- `sessions` - NextAuth会话表
- `users` - NextAuth用户表
- `verification_tokens` - NextAuth验证令牌表

## 🔧 解决方案

### 方法1：通过Supabase控制台同步（推荐）

1. **登录Supabase控制台**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目：`data-platform`

2. **进入SQL编辑器**
   - 点击左侧菜单的 "SQL Editor"
   - 点击 "New query"

3. **执行增量更新版本的schema.sql**
   - 打开项目中的 `supabase/schema-incremental.sql` 文件（增量更新版本）
   - 复制全部内容到SQL编辑器
   - 点击 "Run" 执行
   
   **注意**: 
   - 原始 `schema.sql` 有依赖关系错误
   - `schema-fixed.sql` 会重复创建已存在的触发器
   - 请使用 `schema-incremental.sql` 只创建缺失的结构

4. **验证结果**
   - 执行完成后，检查 "Table Editor" 中是否出现所有表
   - 运行 `node scripts/check-db-structure.js` 验证

### 方法2：通过迁移文件逐个执行

如果schema.sql执行失败，可以逐个执行迁移文件：

1. **按时间顺序执行迁移**
   ```sql
   -- 1. 基础表结构
   -- 执行 20250722141818_create_youtube_scraper_tables.sql
   
   -- 2. 国际化支持
   -- 执行 20250725000001_create_translation_tables.sql
   
   -- 3. 团队功能
   -- 执行 20250731_add_team_member_status.sql
   
   -- 4. NextAuth集成
   -- 执行 20250801000001_add_nextauth_fields.sql
   
   -- 5. 匿名试用
   -- 执行 20250801000002_create_anonymous_trials_tables.sql
   
   -- 6. 用户同步增强
   -- 执行 20250801000003_enhance_user_sync_tables.sql
   
   -- 7. 设备同步
   -- 执行 20250801000004_create_device_sync_tables.sql
   
   -- 8. 转化优化
   -- 执行 20250801000005_create_conversion_optimization_tables.sql
   
   -- 9. 安全隐私
   -- 执行 20250803000001_create_security_privacy_tables.sql
   
   -- 10. 监控系统
   -- 执行 20250803000002_create_monitoring_tables.sql
   
   -- 11. 反馈系统
   -- 执行 20250803000003_create_feedback_tables.sql
   ```

## 🔒 安全设置建议

同步完成后，建议在Supabase控制台中启用Row Level Security (RLS)：

### 需要启用RLS的表：
- `yt_users` - 用户数据
- `yt_channels` - 频道数据
- `yt_videos` - 视频数据
- `yt_analytics` - 分析数据
- `yt_reports` - 报告数据
- `yt_teams` - 团队数据

### RLS策略示例：
```sql
-- 用户只能访问自己的数据
CREATE POLICY "Users can only access their own data" ON yt_users
FOR ALL USING (auth.uid()::text = id::text);

-- 频道数据按用户隔离
CREATE POLICY "Users can only access their own channels" ON yt_channels
FOR ALL USING (auth.uid()::text = user_id::text);

-- 视频数据按用户隔离
CREATE POLICY "Users can only access their own videos" ON yt_videos
FOR ALL USING (auth.uid()::text = user_id::text);
```

## ✅ 验证步骤

1. **检查表结构**
   ```bash
   node scripts/check-db-structure.js
   ```

2. **测试数据库连接**
   ```bash
   node scripts/dev-tools.js db
   ```

3. **运行健康检查**
   ```bash
   node scripts/dev-tools.js health
   ```

## 🚨 注意事项

- 执行SQL前请备份重要数据
- 建议在非生产环境先测试
- 如果遇到权限问题，确保使用Service Role Key
- 执行完成后检查所有表是否正确创建

## 📞 需要帮助？

如果遇到问题，可以：
1. 检查Supabase控制台的错误日志
2. 运行 `node scripts/check-db-structure.js` 查看具体缺失的表
3. 查看迁移文件中的具体SQL语句 