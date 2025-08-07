-- 增强用户数据同步相关表结构
-- 支持用户数据初始化、偏好设置、活动跟踪等功能

-- 扩展 yt_users 表以支持更多用户数据
ALTER TABLE yt_users 
ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS quota_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 创建用户项目表
CREATE TABLE IF NOT EXISTS yt_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户收藏夹表
CREATE TABLE IF NOT EXISTS yt_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户统计表
CREATE TABLE IF NOT EXISTS yt_user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    total_analyses INTEGER DEFAULT 0,
    total_reports INTEGER DEFAULT 0,
    total_exports INTEGER DEFAULT 0,
    total_bookmarks INTEGER DEFAULT 0,
    total_projects INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建用户活动记录表
CREATE TABLE IF NOT EXISTS yt_user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户事件记录表
CREATE TABLE IF NOT EXISTS yt_user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 扩展匿名试用表以支持数据迁移
ALTER TABLE yt_anonymous_trials 
ADD COLUMN IF NOT EXISTS migrated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS migrated_to_user_id UUID REFERENCES yt_users(id),
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_yt_users_nextauth_user_id ON yt_users(nextauth_user_id);
CREATE INDEX IF NOT EXISTS idx_yt_users_email ON yt_users(email);
CREATE INDEX IF NOT EXISTS idx_yt_users_plan ON yt_users(plan);
CREATE INDEX IF NOT EXISTS idx_yt_users_last_activity ON yt_users(last_activity);

CREATE INDEX IF NOT EXISTS idx_yt_projects_user_id ON yt_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_projects_is_default ON yt_projects(user_id, is_default);

CREATE INDEX IF NOT EXISTS idx_yt_bookmarks_user_id ON yt_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_bookmarks_is_default ON yt_bookmarks(user_id, is_default);

CREATE INDEX IF NOT EXISTS idx_yt_user_stats_user_id ON yt_user_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_yt_user_activities_user_id ON yt_user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_user_activities_type ON yt_user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_yt_user_activities_created_at ON yt_user_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_yt_user_events_user_id ON yt_user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_user_events_type ON yt_user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_yt_user_events_created_at ON yt_user_events(created_at);

CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_migrated ON yt_anonymous_trials(migrated);
CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_fingerprint_migrated ON yt_anonymous_trials(fingerprint, migrated);

-- 创建触发器以自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加 updated_at 触发器
DROP TRIGGER IF EXISTS update_yt_users_updated_at ON yt_users;
CREATE TRIGGER update_yt_users_updated_at 
    BEFORE UPDATE ON yt_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_yt_projects_updated_at ON yt_projects;
CREATE TRIGGER update_yt_projects_updated_at 
    BEFORE UPDATE ON yt_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_yt_bookmarks_updated_at ON yt_bookmarks;
CREATE TRIGGER update_yt_bookmarks_updated_at 
    BEFORE UPDATE ON yt_bookmarks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_yt_user_stats_updated_at ON yt_user_stats;
CREATE TRIGGER update_yt_user_stats_updated_at 
    BEFORE UPDATE ON yt_user_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建 RLS (Row Level Security) 策略
ALTER TABLE yt_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_user_events ENABLE ROW LEVEL SECURITY;

-- 项目表的 RLS 策略
CREATE POLICY "Users can view their own projects" ON yt_projects
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can insert their own projects" ON yt_projects
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update their own projects" ON yt_projects
    FOR UPDATE USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can delete their own projects" ON yt_projects
    FOR DELETE USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 收藏夹表的 RLS 策略
CREATE POLICY "Users can view their own bookmarks" ON yt_bookmarks
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can insert their own bookmarks" ON yt_bookmarks
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update their own bookmarks" ON yt_bookmarks
    FOR UPDATE USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can delete their own bookmarks" ON yt_bookmarks
    FOR DELETE USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 用户统计表的 RLS 策略
CREATE POLICY "Users can view their own stats" ON yt_user_stats
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 用户活动表的 RLS 策略
CREATE POLICY "Users can view their own activities" ON yt_user_activities
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 用户事件表的 RLS 策略
CREATE POLICY "Users can view their own events" ON yt_user_events
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 创建用于统计更新的函数
CREATE OR REPLACE FUNCTION update_user_stats(
    p_user_id UUID,
    p_stat_type VARCHAR(50),
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO yt_user_stats (user_id, total_analyses, total_reports, total_exports, total_bookmarks, total_projects)
    VALUES (p_user_id, 
        CASE WHEN p_stat_type = 'analyses' THEN p_increment ELSE 0 END,
        CASE WHEN p_stat_type = 'reports' THEN p_increment ELSE 0 END,
        CASE WHEN p_stat_type = 'exports' THEN p_increment ELSE 0 END,
        CASE WHEN p_stat_type = 'bookmarks' THEN p_increment ELSE 0 END,
        CASE WHEN p_stat_type = 'projects' THEN p_increment ELSE 0 END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_analyses = yt_user_stats.total_analyses + 
            CASE WHEN p_stat_type = 'analyses' THEN p_increment ELSE 0 END,
        total_reports = yt_user_stats.total_reports + 
            CASE WHEN p_stat_type = 'reports' THEN p_increment ELSE 0 END,
        total_exports = yt_user_stats.total_exports + 
            CASE WHEN p_stat_type = 'exports' THEN p_increment ELSE 0 END,
        total_bookmarks = yt_user_stats.total_bookmarks + 
            CASE WHEN p_stat_type = 'bookmarks' THEN p_increment ELSE 0 END,
        total_projects = yt_user_stats.total_projects + 
            CASE WHEN p_stat_type = 'projects' THEN p_increment ELSE 0 END,
        last_activity = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 添加注释
COMMENT ON TABLE yt_projects IS '用户项目表，用于组织和管理用户的分析项目';
COMMENT ON TABLE yt_bookmarks IS '用户收藏夹表，用于保存用户收藏的视频和频道';
COMMENT ON TABLE yt_user_stats IS '用户统计表，记录用户的使用统计数据';
COMMENT ON TABLE yt_user_activities IS '用户活动记录表，记录用户的详细活动历史';
COMMENT ON TABLE yt_user_events IS '用户事件记录表，记录用户的重要事件';

COMMENT ON COLUMN yt_users.plan IS '用户计划类型：free, pro, enterprise';
COMMENT ON COLUMN yt_users.quota_used IS '已使用的配额数量';
COMMENT ON COLUMN yt_users.quota_limit IS '配额限制';
COMMENT ON COLUMN yt_users.preferences IS '用户偏好设置，JSON格式';
COMMENT ON COLUMN yt_users.last_activity IS '最后活动时间';

COMMENT ON COLUMN yt_anonymous_trials.migrated IS '是否已迁移到认证用户';
COMMENT ON COLUMN yt_anonymous_trials.migrated_to_user_id IS '迁移到的用户ID';
COMMENT ON COLUMN yt_anonymous_trials.migrated_at IS '迁移时间';