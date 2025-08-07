# Supabase Database Management

## 目录结构

```
supabase/
├── schema.sql              # 主数据库结构文件（推荐）
├── rls.sql                 # RLS安全策略管理
├── config.toml             # Supabase配置
├── .gitignore              # Git忽略文件
└── README.md               # 本文件
```

## 文件说明

### 核心SQL文件

| 文件名 | 用途 | 执行顺序 |
|--------|------|----------|
| `schema.sql` | **主数据库结构** - 包含所有表、索引、触发器 | 1 |
| `rls.sql` | **安全策略管理** - RLS启用和策略创建 | 2 |

### 配置文件

| 文件名 | 用途 | 说明 |
|--------|------|------|
| `config.toml` | Supabase本地开发配置 | 本地开发环境配置 |
| `.gitignore` | Git忽略规则 | 忽略临时和敏感文件 |

## 使用指南

### 首次设置（按顺序执行）

1. **创建数据库结构**
   ```sql
   -- 在Supabase Dashboard执行
   -- 文件：schema.sql
   ```

2. **配置安全策略**
   ```sql
   -- 在Supabase Dashboard执行
   -- 文件：rls.sql
   ```

### 日常维护

- 使用 `npm run db:check` 检查数据库状态
- 使用 `npm run db:help` 查看帮助信息

## 命名规范

- 所有表名使用 `yt_` 前缀
- NextAuth表：`yt_accounts`, `yt_sessions`, `yt_users_auth`, `yt_verification_tokens`
- 业务表：`yt_users`, `yt_channels`, `yt_videos` 等

## 注意事项

- 所有SQL操作需要在Supabase Dashboard中手动执行
- 执行前请备份重要数据
- 建议在测试环境先验证
- 遵循执行顺序，避免依赖问题

## 相关文档

- [Supabase使用指南](../docs/SUPABASE_GUIDE.md)
- [数据库管理脚本](../../scripts/supabase-manager.js) 