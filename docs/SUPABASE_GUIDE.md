# Supabase数据库管理指南

## 概述

本项目使用Supabase作为数据库服务，包含完整的数据库结构、安全策略和NextAuth集成。

## 快速开始

### 1. 数据库检查
```bash
# 检查数据库连接、表结构和RLS状态
npm run db

# 或者
npm run db:check
```

### 2. 数据库同步
```bash
# 获取数据库结构同步指导
npm run db:sync
```

### 3. RLS安全策略管理
```bash
# 获取RLS管理指导
npm run db:rls
```

### 4. NextAuth表重命名
```bash
# 获取表重命名指导
npm run db:rename
```

## 脚本文件说明

### 核心脚本文件

| 文件名 | 用途 | 推荐度 |
|--------|------|--------|
| `schema-incremental-fixed.sql` | **推荐** - 增量更新，包含NextAuth表重命名 | ⭐⭐⭐⭐⭐ |
| `rls-management.sql` | **推荐** - RLS策略管理工具 | ⭐⭐⭐⭐⭐ |
| `rename-tables.sql` | **推荐** - NextAuth表重命名 | ⭐⭐⭐⭐⭐ |

### 备选脚本文件

| 文件名 | 用途 | 推荐度 |
|--------|------|--------|
| `schema-incremental.sql` | 备选 - 增量更新（旧版NextAuth表名） | ⭐⭐⭐ |
| `schema-fixed.sql` | 备选 - 完整重建（可能重复创建） | ⭐⭐ |
| `schema.sql` | 不推荐 - 原始版本（有依赖错误） | ⭐ |

## 执行顺序

### 首次设置
1. **重命名NextAuth表** → 执行 `rename-tables.sql`
2. **同步数据库结构** → 执行 `schema-incremental-fixed.sql`
3. **管理RLS策略** → 执行 `rls-management.sql`

### 日常维护
1. **检查状态** → `npm run db:check`
2. **根据需要执行相应脚本**

## 详细操作指南

### 1. NextAuth表重命名

**目的**: 将NextAuth相关表重命名为`yt_`前缀，符合团队命名规范

**执行步骤**:
1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `supabase/rename-tables.sql` 内容
4. 点击 "Run" 执行

**重命名内容**:
- `accounts` → `yt_accounts`
- `sessions` → `yt_sessions`
- `users` → `yt_users_auth`
- `verification_tokens` → `yt_verification_tokens`

### 2. 数据库结构同步

**目的**: 创建缺失的表、索引、触发器和函数

**执行步骤**:
1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `supabase/schema-incremental-fixed.sql` 内容
4. 点击 "Run" 执行

**特点**:
- 使用 `IF NOT EXISTS` 避免重复创建
- 包含所有必需的表和索引
- 支持增量更新

### 3. RLS安全策略管理

**目的**: 启用Row Level Security并创建安全策略

**执行步骤**:
1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `supabase/rls-management.sql` 内容
4. 点击 "Run" 执行

**功能**:
- 启用所有表的RLS
- 创建用户数据访问策略
- 创建团队协作策略
- 查看和管理现有策略

## 表结构概览

### 核心业务表
- `yt_users` - 用户信息
- `yt_channels` - YouTube频道
- `yt_videos` - 视频数据
- `yt_comments` - 评论数据
- `yt_scraping_tasks` - 采集任务
- `yt_ai_analysis` - AI分析结果
- `yt_analytics` - 分析数据
- `yt_insights` - 洞察数据
- `yt_reports` - 报告数据

### 团队协作表
- `yt_teams` - 团队信息
- `yt_team_members` - 团队成员
- `yt_team_invitations` - 团队邀请
- `yt_collaboration_comments` - 协作评论

### NextAuth认证表
- `yt_accounts` - 账户信息
- `yt_sessions` - 会话信息
- `yt_users_auth` - 认证用户
- `yt_verification_tokens` - 验证令牌

### 其他功能表
- `yt_dashboards` - 仪表板
- `yt_ai_insights` - AI洞察
- `yt_competitor_analysis` - 竞争对手分析
- `yt_anonymous_trials` - 匿名试用
- `yt_login_analytics` - 登录分析

## 安全策略

### RLS策略类型
1. **用户数据访问** - 用户只能访问自己的数据
2. **团队协作** - 团队成员可以访问团队数据
3. **管理员访问** - 企业版用户可以访问所有数据
4. **匿名试用** - 基于设备指纹的访问控制

### 策略示例
```sql
-- 用户只能访问自己的数据
CREATE POLICY "Users can only access their own data" ON yt_users
FOR ALL USING (auth.uid()::text = id::text);

-- 团队成员可以访问团队数据
CREATE POLICY "Team members can view team membership" ON yt_team_members
FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM yt_teams 
        WHERE id = yt_team_members.team_id 
        AND owner_id::text = auth.uid()::text
    )
);
```

## 故障排除

### 常见错误

1. **"relation does not exist"**
   - 原因: 表不存在
   - 解决: 执行 `schema-incremental-fixed.sql`

2. **"trigger already exists"**
   - 原因: 触发器已存在
   - 解决: 使用增量更新脚本

3. **"column forcerowsecurity does not exist"**
   - 原因: PostgreSQL版本差异
   - 解决: 已修复，使用 `rowsecurity` 字段

4. **"syntax error at or near NOT"**
   - 原因: `CREATE POLICY IF NOT EXISTS` 语法不支持
   - 解决: 已修复，使用 `DO $$ BEGIN IF NOT EXISTS ... END IF; END $$;`

### 检查命令
```bash
# 检查数据库状态
npm run db:check

# 查看帮助
npm run db:help
```

## 最佳实践

1. **定期检查**: 使用 `npm run db:check` 定期检查数据库状态
2. **备份数据**: 在执行重要操作前备份数据
3. **测试环境**: 在测试环境验证脚本后再在生产环境执行
4. **权限管理**: 确保使用正确的数据库权限执行操作
5. **版本控制**: 保持SQL脚本的版本控制

## 联系支持

如遇到问题，请：
1. 检查错误日志
2. 查看Supabase Dashboard的日志
3. 参考故障排除部分
4. 联系开发团队 