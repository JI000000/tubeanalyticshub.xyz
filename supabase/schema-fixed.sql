-- YouTube Scraper Database Schema (修复版本)
-- 所有表使用 yt_ 前缀以避免与其他项目冲突
-- 按正确顺序组织，避免依赖关系错误

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建更新时间函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- 1. 基础表结构 (无依赖)
-- ========================================

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 洞察报告表 (Analytics Platform)
CREATE TABLE IF NOT EXISTS yt_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    channel_id VARCHAR(30) REFERENCES yt_channels(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('trend', 'anomaly', 'opportunity', 'risk')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    importance DECIMAL(3,2) DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
    data_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 团队表 (Team Collaboration)
CREATE TABLE IF NOT EXISTS yt_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 团队成员表
CREATE TABLE IF NOT EXISTS yt_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES yt_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- 匿名试用表 (Anonymous Trials)
CREATE TABLE IF NOT EXISTS yt_anonymous_trials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    device_fingerprint VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    trial_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 登录分析表 (Login Analytics)
CREATE TABLE IF NOT EXISTS yt_login_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    login_method VARCHAR(50) NOT NULL CHECK (login_method IN ('email', 'google', 'github', 'anonymous')),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. 扩展表结构 (依赖基础表)
-- ========================================

-- 仪表板表 (Analytics Platform)
CREATE TABLE IF NOT EXISTS yt_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB NOT NULL,
    widgets JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 报告表 (Analytics Platform)
CREATE TABLE IF NOT EXISTS yt_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('analytics', 'insights', 'comparison', 'custom')),
    template_type VARCHAR(50) DEFAULT 'standard',
    data JSONB NOT NULL,
    filters JSONB,
    schedule JSONB, -- 定时报告设置
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI洞察表 (Analytics Platform)
CREATE TABLE IF NOT EXISTS yt_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    target_id VARCHAR(50) NOT NULL, -- 可以是channel_id, video_id等
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('channel', 'video', 'comment')),
    insight_category VARCHAR(50) NOT NULL,
    insight_title VARCHAR(255) NOT NULL,
    insight_content TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    action_items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 竞争对手分析表 (Analytics Platform)
CREATE TABLE IF NOT EXISTS yt_competitor_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    primary_channel_id VARCHAR(30) REFERENCES yt_channels(id) ON DELETE CASCADE,
    competitor_channel_id VARCHAR(30) REFERENCES yt_channels(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('content', 'engagement', 'growth', 'audience')),
    comparison_data JSONB NOT NULL,
    insights JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 团队邀请表 (Team Collaboration)
CREATE TABLE IF NOT EXISTS yt_team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES yt_teams(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 协作评论表 (Team Collaboration)
CREATE TABLE IF NOT EXISTS yt_collaboration_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES yt_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('video', 'channel', 'report', 'dashboard')),
    target_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
    parent_id UUID REFERENCES yt_collaboration_comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. NextAuth相关表
-- ========================================

-- NextAuth账户表
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

-- NextAuth会话表
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NextAuth用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NextAuth验证令牌表
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(identifier, token)
);

-- ========================================
-- 4. 索引创建 (所有表创建完成后)
-- ========================================

-- 基础表索引
CREATE INDEX IF NOT EXISTS idx_yt_videos_channel_id ON yt_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_user_id ON yt_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_published_at ON yt_videos(published_at);
CREATE INDEX IF NOT EXISTS idx_yt_comments_video_id ON yt_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_yt_scraping_tasks_user_id ON yt_scraping_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_scraping_tasks_status ON yt_scraping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_yt_channels_user_id ON yt_channels(user_id);

-- 分析表索引
CREATE INDEX IF NOT EXISTS idx_yt_analytics_user_id ON yt_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_analytics_channel_id ON yt_analytics(channel_id);
CREATE INDEX IF NOT EXISTS idx_yt_analytics_date_recorded ON yt_analytics(date_recorded);
CREATE INDEX IF NOT EXISTS idx_yt_insights_user_id ON yt_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_insights_importance ON yt_insights(importance);

-- 团队表索引
CREATE INDEX IF NOT EXISTS idx_yt_teams_owner_id ON yt_teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_members_team_id ON yt_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_members_user_id ON yt_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_members_status ON yt_team_members(status);

-- 扩展表索引
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

-- 团队协作索引
CREATE INDEX IF NOT EXISTS idx_yt_team_invitations_team_id ON yt_team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_yt_team_invitations_token ON yt_team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_yt_team_invitations_status ON yt_team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_yt_collaboration_comments_team_id ON yt_collaboration_comments(team_id);
CREATE INDEX IF NOT EXISTS idx_yt_collaboration_comments_target ON yt_collaboration_comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_yt_collaboration_comments_status ON yt_collaboration_comments(status);

-- 匿名试用索引
CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_session_id ON yt_anonymous_trials(session_id);
CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_device_fingerprint ON yt_anonymous_trials(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_is_active ON yt_anonymous_trials(is_active);

-- 登录分析索引
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_user_id ON yt_login_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_login_method ON yt_login_analytics(login_method);
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_success ON yt_login_analytics(success);
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_login_at ON yt_login_analytics(login_at);

-- NextAuth索引
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);

-- ========================================
-- 5. 触发器创建 (所有表和索引创建完成后)
-- ========================================

-- 基础表触发器
CREATE TRIGGER update_yt_users_updated_at 
    BEFORE UPDATE ON yt_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_channels_updated_at 
    BEFORE UPDATE ON yt_channels 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_videos_updated_at 
    BEFORE UPDATE ON yt_videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_comments_updated_at 
    BEFORE UPDATE ON yt_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_scraping_tasks_updated_at 
    BEFORE UPDATE ON yt_scraping_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_ai_analysis_updated_at 
    BEFORE UPDATE ON yt_ai_analysis 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_analytics_updated_at 
    BEFORE UPDATE ON yt_analytics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_insights_updated_at 
    BEFORE UPDATE ON yt_insights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 扩展表触发器
CREATE TRIGGER update_yt_dashboards_updated_at 
    BEFORE UPDATE ON yt_dashboards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_reports_updated_at 
    BEFORE UPDATE ON yt_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_ai_insights_updated_at 
    BEFORE UPDATE ON yt_ai_insights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_competitor_analysis_updated_at 
    BEFORE UPDATE ON yt_competitor_analysis 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 团队表触发器
CREATE TRIGGER update_yt_teams_updated_at 
    BEFORE UPDATE ON yt_teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_team_members_updated_at 
    BEFORE UPDATE ON yt_team_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_team_invitations_updated_at 
    BEFORE UPDATE ON yt_team_invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_collaboration_comments_updated_at 
    BEFORE UPDATE ON yt_collaboration_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- NextAuth表触发器
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. Row Level Security (RLS) 策略
-- ========================================

-- 启用RLS
ALTER TABLE yt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_dashboards ENABLE ROW LEVEL SECURITY;

-- 用户数据访问策略
CREATE POLICY "Users can only access their own data" ON yt_users
FOR ALL USING (auth.uid()::text = id::text);

-- 频道数据访问策略
CREATE POLICY "Users can only access their own channels" ON yt_channels
FOR ALL USING (auth.uid()::text = user_id::text);

-- 视频数据访问策略
CREATE POLICY "Users can only access their own videos" ON yt_videos
FOR ALL USING (auth.uid()::text = user_id::text);

-- 分析数据访问策略
CREATE POLICY "Users can only access their own analytics" ON yt_analytics
FOR ALL USING (auth.uid()::text = user_id::text);

-- 洞察数据访问策略
CREATE POLICY "Users can only access their own insights" ON yt_insights
FOR ALL USING (auth.uid()::text = user_id::text);

-- 报告数据访问策略
CREATE POLICY "Users can only access their own reports" ON yt_reports
FOR ALL USING (auth.uid()::text = user_id::text);

-- 仪表板数据访问策略
CREATE POLICY "Users can only access their own dashboards" ON yt_dashboards
FOR ALL USING (auth.uid()::text = user_id::text);

-- 团队数据访问策略
CREATE POLICY "Team owners can manage their teams" ON yt_teams
FOR ALL USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Team members can view their teams" ON yt_teams
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM yt_team_members 
        WHERE team_id = yt_teams.id 
        AND user_id::text = auth.uid()::text
    )
);

-- 团队成员数据访问策略
CREATE POLICY "Team members can view team membership" ON yt_team_members
FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM yt_teams 
        WHERE id = yt_team_members.team_id 
        AND owner_id::text = auth.uid()::text
    )
);

-- 协作评论访问策略
CREATE POLICY "Team members can manage comments" ON yt_collaboration_comments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM yt_team_members 
        WHERE team_id = yt_collaboration_comments.team_id 
        AND user_id::text = auth.uid()::text
    )
); 