-- 创建匿名试用跟踪表
CREATE TABLE IF NOT EXISTS yt_anonymous_trials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent_hash VARCHAR(255),
    trial_count INTEGER DEFAULT 0,
    max_trials INTEGER DEFAULT 5,
    actions JSONB DEFAULT '[]',
    first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    converted_user_id UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_yt_anonymous_trials_fingerprint 
ON yt_anonymous_trials(fingerprint);

CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_ip 
ON yt_anonymous_trials(ip_address);

CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_converted 
ON yt_anonymous_trials(converted_user_id);

CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_last_action 
ON yt_anonymous_trials(last_action_at);

CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_blocked 
ON yt_anonymous_trials(is_blocked, blocked_until);

-- 创建登录分析表
CREATE TABLE IF NOT EXISTS yt_login_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    user_id UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    fingerprint VARCHAR(255),
    event_type VARCHAR(50) NOT NULL, -- 'prompt_shown', 'login_attempt', 'login_success', 'login_failed', 'skip', 'trial_consumed'
    trigger_type VARCHAR(50), -- 'trial_exhausted', 'feature_required', 'save_action'
    provider VARCHAR(50), -- 'github', 'google', 'email'
    context JSONB DEFAULT '{}',
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建登录分析表索引
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_event_type 
ON yt_login_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_trigger_type 
ON yt_login_analytics(trigger_type);

CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_provider 
ON yt_login_analytics(provider);

CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_created_at 
ON yt_login_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_fingerprint 
ON yt_login_analytics(fingerprint);

CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_user_id 
ON yt_login_analytics(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为匿名试用表添加更新时间触发器
CREATE TRIGGER update_yt_anonymous_trials_updated_at 
    BEFORE UPDATE ON yt_anonymous_trials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建清理过期数据的函数
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_trials()
RETURNS void AS $$
BEGIN
    -- 删除超过30天未活动的匿名试用记录
    DELETE FROM yt_anonymous_trials 
    WHERE last_action_at < NOW() - INTERVAL '30 days'
    AND converted_user_id IS NULL;
    
    -- 删除超过7天的登录分析数据（保留重要事件）
    DELETE FROM yt_login_analytics 
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND event_type NOT IN ('login_success', 'trial_consumed');
END;
$$ LANGUAGE plpgsql;

-- 创建定期清理任务（需要pg_cron扩展，如果不可用则手动执行）
-- SELECT cron.schedule('cleanup-anonymous-trials', '0 2 * * *', 'SELECT cleanup_expired_anonymous_trials();');