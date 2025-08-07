# 运行数据库迁移指南

## 方法1：使用 Supabase CLI（推荐）

```bash
# 在项目根目录运行
cd youtube-scraper
supabase db push
```

## 方法2：手动在 Supabase Dashboard 执行

1. 打开 Supabase Dashboard
2. 进入你的项目
3. 点击 "SQL Editor"
4. 复制 `supabase/migrations/20250801000005_create_conversion_optimization_tables.sql` 的内容
5. 粘贴并执行

## 方法3：使用 psql 命令行

```bash
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20250801000005_create_conversion_optimization_tables.sql
```

## 验证迁移成功

执行以下查询检查表是否创建成功：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'yt_%' 
AND table_schema = 'public';
```

应该看到这些新表：
- yt_ab_experiments
- yt_ab_assignments  
- yt_ab_events
- yt_optimization_candidates
- yt_optimization_interactions
- yt_user_behavior
- yt_user_personas
- yt_personalization_effects