-- YouTube Scraper Database Schema
-- 所有表使用 yt_ 前缀以避免与其他项目冲突

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表 (Analytics Platform扩展)
CREATE TABLE IF NOT EXISTS yt_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    quota_used INTEGER DEFAULT 0,
    quota_limit INTEGER DEFAULT 50, -- Analytics Platform: 50个频道/月
    preferences JSONB DEFAULT '{}', -- 用户偏好设置
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 频道数据表
CREATE TABLE IF NOT EXISTS yt_channels (
    id VARCHAR(30) PRIMARY KEY, -- YouTube频道ID
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subscriber_count BIGINT DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    thumbnails JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE
);

-- 视频数据表
CREATE TABLE IF NOT EXISTS yt_videos (
    id VARCHAR(20) PRIMARY KEY, -- YouTube视频ID
    title TEXT NOT NULL,
    description TEXT,
    channel_id VARCHAR(30) NOT NULL REFERENCES yt_channels(id),
    channel_title VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- 秒数
    view_count BIGINT DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    tags TEXT[],
    thumbnails JSONB,
    ai_summary TEXT,
    sentiment_score DECIMAL(3,2), -- -1到1
    keywords TEXT[],
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE
);

-- 评论数据表
CREATE TABLE IF NOT EXISTS yt_comments (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(20) REFERENCES yt_videos(id) ON DELETE CASCADE,
    author_name VARCHAR(255),
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    parent_id INTEGER REFERENCES yt_comments(id),
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    ai_keywords TEXT[],
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 采集任务表
CREATE TABLE IF NOT EXISTS yt_scraping_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'channel', 'batch')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input_data JSONB NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    result_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- AI分析结果表
CREATE TABLE IF NOT EXISTS yt_ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id VARCHAR(20) REFERENCES yt_videos(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    result JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE
);

-- 分析数据表 (Analytics Platform)
CREATE TABLE IF NOT EXISTS yt_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    channel_id VARCHAR(30) REFERENCES yt_channels(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('views', 'subscribers', 'engagement', 'revenue')),
    metric_value DECIMAL(15,2) NOT NULL,
    date_recorded DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 报告表 (Analytics Platform)

-- AI洞察表 (Analytics Platform)
CREATE TABLE IF NOT EXISTS yt_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('opportunity', 'warning', 'trend', 'recommendation')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    importance VARCHAR(10) CHECK (importance IN ('high', 'medium', 'low')),
    category VARCHAR(50) CHECK (category IN ('content', 'timing', 'audience', 'competition')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 团队表 (Enterprise功能)
CREATE TABLE IF NOT EXISTS yt_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 团队成员表 (Enterprise功能)
CREATE TABLE IF NOT EXISTS yt_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES yt_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_yt_videos_channel_id ON yt_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_user_id ON yt_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_published_at ON yt_videos(published_at);
CREATE INDEX IF NOT EXISTS idx_yt_comments_video_id ON yt_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_yt_scraping_tasks_user_id ON yt_scraping_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_scraping_tasks_status ON yt_scraping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_yt_channels_user_id ON yt_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_analytics_user_id ON yt_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_analytics_channel_id ON yt_analytics(channel_id);
CREATE INDEX IF NOT EXISTS idx_yt_analytics_date_recorded ON yt_analytics(date_recorded);
CREATE INDEX IF NOT EXISTS idx_yt_reports_user_id ON yt_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_insights_user_id ON yt_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_insights_importance ON yt_insights(importance);
CREATE INDEX IF NOT EXISTS idx_yt_teams_owner_id ON yt_teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_members_team_id ON yt_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_members_user_id ON yt_team_members(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表添加更新时间触发器
CREATE TRIGGER update_yt_users_updated_at 
    BEFORE UPDATE ON yt_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 策略
ALTER TABLE yt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_scraping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_ai_analysis ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON yt_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON yt_users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own videos" ON yt_videos
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own channels" ON yt_channels
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view comments of own videos" ON yt_comments
    FOR SELECT USING (
        video_id IN (
            SELECT id FROM yt_videos WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own tasks" ON yt_scraping_tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analysis" ON yt_ai_analysis
    FOR ALL USING (auth.uid() = user_id);

-- 插入示例数据（开发环境）
-- 注意：生产环境中应该删除这些示例数据
INSERT INTO yt_users (id, email, plan, quota_limit) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'free', 1000)
ON CONFLICT (id) DO NOTHING;
-- Analytics Platform专用表

-- 1.1.1 分析仪表板表
CREATE TABLE IF NOT EXISTS yt_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}', -- 仪表板配置
    data_sources JSONB DEFAULT '[]', -- 数据源配置
    layout JSONB DEFAULT '{}', -- 布局配置
    is_public BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(255) UNIQUE,
    permissions JSONB DEFAULT '{}', -- 权限控制
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.1.2 分析报告表 (扩展版)
CREATE TABLE IF NOT EXISTS yt_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES yt_dashboards(id) ON DELETE SET NULL,
    task_id UUID REFERENCES yt_scraping_tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL DEFAULT 'standard',
    template_type VARCHAR(50) DEFAULT 'marketing', -- marketing/competitor/content
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}', -- 报告元数据
    share_token VARCHAR(255) UNIQUE,
    is_public BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    parent_report_id UUID REFERENCES yt_reports(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.1.3 AI洞察表 (扩展版)
CREATE TABLE IF NOT EXISTS yt_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    target_id VARCHAR(100) NOT NULL, -- video_id or channel_id
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('video', 'channel')),
    analysis_type VARCHAR(50) NOT NULL DEFAULT 'content',
    insights JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.8,
    insight_category VARCHAR(50) DEFAULT 'general', -- performance/content/audience/trend
    actionable_recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- 洞察过期时间
);

-- 1.1.4 竞品分析表
CREATE TABLE IF NOT EXISTS yt_competitor_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    primary_channel_id VARCHAR(30) NOT NULL,
    competitor_channel_ids TEXT[] NOT NULL,
    analysis_config JSONB DEFAULT '{}',
    analysis_result JSONB NOT NULL,
    comparison_metrics JSONB DEFAULT '{}',
    benchmark_data JSONB DEFAULT '{}',
    cache_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Platform索引
CREATE INDEX IF NOT EXISTS idx_yt_dashboards_user_id ON yt_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_dashboards_public ON yt_dashboards(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_yt_reports_user_id ON yt_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_reports_created_at ON yt_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_yt_reports_type ON yt_reports(report_type, template_type);
CREATE INDEX IF NOT EXISTS idx_yt_ai_insights_user_id ON yt_ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_ai_insights_target ON yt_ai_insights(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_yt_ai_insights_category ON yt_ai_insights(insight_category);
CREATE INDEX IF NOT EXISTS idx_yt_competitor_analysis_user_id ON yt_competitor_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_competitor_analysis_primary ON yt_competitor_analysis(primary_channel_id);

-- Analytics Platform RLS策略
ALTER TABLE yt_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_competitor_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dashboards" ON yt_dashboards
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public dashboards are viewable" ON yt_dashboards
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own reports" ON yt_reports
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public reports are viewable" ON yt_reports
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own insights" ON yt_ai_insights
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own competitor analysis" ON yt_competitor_analysis
    FOR ALL USING (auth.uid() = user_id);

-- 为新表添加更新时间触发器
CREATE TRIGGER update_yt_dashboards_updated_at 
    BEFORE UPDATE ON yt_dashboards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_reports_updated_at 
    BEFORE UPDATE ON yt_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_competitor_analysis_updated_at 
    BEFORE UPDATE ON yt_competitor_analysis 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 团队协作功能表

-- 团队表

-- 团队成员表

-- 团队邀请表
CREATE TABLE IF NOT EXISTS yt_team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES yt_teams(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    invitee_email VARCHAR(255) NOT NULL,
    invitee_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    permissions TEXT[] DEFAULT '{}',
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- 协作评论表
CREATE TABLE IF NOT EXISTS yt_collaboration_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES yt_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('dashboard', 'report', 'insight', 'video', 'channel')),
    target_id VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES yt_collaboration_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position JSONB, -- 标注位置信息
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'archived')),
    mentions TEXT[], -- @提及的用户ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES yt_users(id)
);

-- 团队协作索引
CREATE INDEX IF NOT EXISTS idx_yt_teams_owner_id ON yt_teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_members_team_id ON yt_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_members_user_id ON yt_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_members_status ON yt_team_members(status);
CREATE INDEX IF NOT EXISTS idx_yt_team_invitations_team_id ON yt_team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_invitations_token ON yt_team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_yt_team_invitations_status ON yt_team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_yt_collaboration_comments_team_id ON yt_collaboration_comments(team_id);
CREATE INDEX IF NOT EXISTS idx_yt_collaboration_comments_target ON yt_collaboration_comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_yt_collaboration_comments_status ON yt_collaboration_comments(status);

-- 团队协作RLS策略
ALTER TABLE yt_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_collaboration_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can manage teams" ON yt_teams
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view teams" ON yt_teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Team members can view team members" ON yt_team_members
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Team admins can manage members" ON yt_team_members
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active' 
            AND (role = 'owner' OR role = 'admin')
        )
    );

CREATE POLICY "Users can view own invitations" ON yt_team_invitations
    FOR SELECT USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

CREATE POLICY "Team admins can manage invitations" ON yt_team_invitations
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active' 
            AND (role = 'owner' OR role = 'admin')
        )
    );

CREATE POLICY "Team members can manage comments" ON yt_collaboration_comments
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 为团队表添加更新时间触发器
CREATE TRIGGER update_yt_teams_updated_at 
    BEFORE UPDATE ON yt_teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_collaboration_comments_updated_at 
    BEFORE UPDATE ON yt_collaboration_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();