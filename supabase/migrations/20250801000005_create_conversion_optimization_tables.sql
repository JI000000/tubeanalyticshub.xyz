-- 创建转化率优化相关表
-- 支持A/B测试、动态优化、智能时机和个性化引导功能

-- A/B测试实验表
CREATE TABLE IF NOT EXISTS yt_ab_experiments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    target_metric TEXT NOT NULL CHECK (target_metric IN ('conversion_rate', 'click_through_rate', 'completion_rate')),
    variants JSONB NOT NULL DEFAULT '[]',
    traffic_allocation INTEGER NOT NULL DEFAULT 100 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),
    segment_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B测试分配表
CREATE TABLE IF NOT EXISTS yt_ab_assignments (
    id BIGSERIAL PRIMARY KEY,
    experiment_id TEXT NOT NULL REFERENCES yt_ab_experiments(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    user_id TEXT,
    fingerprint TEXT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- A/B测试事件表
CREATE TABLE IF NOT EXISTS yt_ab_events (
    id BIGSERIAL PRIMARY KEY,
    experiment_id TEXT NOT NULL REFERENCES yt_ab_experiments(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    user_id TEXT,
    fingerprint TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion', 'skip', 'error')),
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 动态优化候选项表
CREATE TABLE IF NOT EXISTS yt_optimization_candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    performance JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 动态优化交互表
CREATE TABLE IF NOT EXISTS yt_optimization_interactions (
    id BIGSERIAL PRIMARY KEY,
    candidate_id TEXT NOT NULL REFERENCES yt_optimization_candidates(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('impression', 'click', 'conversion', 'dismissed')),
    user_context JSONB DEFAULT '{}',
    custom_metrics JSONB DEFAULT '{}',
    fingerprint TEXT,
    user_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户行为表（用于智能时机分析）
CREATE TABLE IF NOT EXISTS yt_user_behavior (
    id BIGSERIAL PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    user_id TEXT,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'page_view', 'feature_click', 'scroll', 'hover', 'search', 
        'export_attempt', 'save_attempt', 'share_attempt', 
        'idle_start', 'idle_end', 'tab_focus', 'tab_blur'
    )),
    event_data JSONB DEFAULT '{}',
    device_info JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户画像表
CREATE TABLE IF NOT EXISTS yt_user_personas (
    id BIGSERIAL PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    user_id TEXT,
    persona_id TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    identified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- 个性化效果表
CREATE TABLE IF NOT EXISTS yt_personalization_effects (
    id BIGSERIAL PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    user_id TEXT,
    persona_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('shown', 'clicked', 'converted', 'dismissed')),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能

-- A/B测试相关索引
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON yt_ab_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_dates ON yt_ab_experiments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment_fingerprint ON yt_ab_assignments(experiment_id, fingerprint);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_assigned_at ON yt_ab_assignments(assigned_at);
CREATE INDEX IF NOT EXISTS idx_ab_events_experiment_variant ON yt_ab_events(experiment_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_timestamp ON yt_ab_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ab_events_fingerprint ON yt_ab_events(fingerprint);

-- 动态优化相关索引
CREATE INDEX IF NOT EXISTS idx_optimization_candidates_status ON yt_optimization_candidates(status);
CREATE INDEX IF NOT EXISTS idx_optimization_interactions_candidate ON yt_optimization_interactions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_optimization_interactions_timestamp ON yt_optimization_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_optimization_interactions_fingerprint ON yt_optimization_interactions(fingerprint);

-- 用户行为相关索引
CREATE INDEX IF NOT EXISTS idx_user_behavior_fingerprint ON yt_user_behavior(fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_behavior_session ON yt_user_behavior(session_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON yt_user_behavior(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_behavior_event_type ON yt_user_behavior(event_type);

-- 个性化相关索引
CREATE INDEX IF NOT EXISTS idx_user_personas_fingerprint ON yt_user_personas(fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_personas_persona_id ON yt_user_personas(persona_id);
CREATE INDEX IF NOT EXISTS idx_user_personas_identified_at ON yt_user_personas(identified_at);
CREATE INDEX IF NOT EXISTS idx_personalization_effects_fingerprint ON yt_personalization_effects(fingerprint);
CREATE INDEX IF NOT EXISTS idx_personalization_effects_persona_content ON yt_personalization_effects(persona_id, content_id);
CREATE INDEX IF NOT EXISTS idx_personalization_effects_timestamp ON yt_personalization_effects(timestamp);

-- 创建复合索引以支持复杂查询
CREATE INDEX IF NOT EXISTS idx_ab_events_experiment_type_timestamp ON yt_ab_events(experiment_id, event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_user_behavior_fingerprint_timestamp ON yt_user_behavior(fingerprint, timestamp);
CREATE INDEX IF NOT EXISTS idx_personalization_effects_persona_type_timestamp ON yt_personalization_effects(persona_id, interaction_type, timestamp);

-- 添加表注释
COMMENT ON TABLE yt_ab_experiments IS 'A/B测试实验配置表';
COMMENT ON TABLE yt_ab_assignments IS 'A/B测试用户分配表';
COMMENT ON TABLE yt_ab_events IS 'A/B测试事件记录表';
COMMENT ON TABLE yt_optimization_candidates IS '动态优化候选项表';
COMMENT ON TABLE yt_optimization_interactions IS '动态优化交互记录表';
COMMENT ON TABLE yt_user_behavior IS '用户行为事件表';
COMMENT ON TABLE yt_user_personas IS '用户画像识别表';
COMMENT ON TABLE yt_personalization_effects IS '个性化效果记录表';

-- 添加列注释
COMMENT ON COLUMN yt_ab_experiments.variants IS 'A/B测试变体配置，JSON格式存储';
COMMENT ON COLUMN yt_ab_experiments.traffic_allocation IS '参与实验的流量百分比';
COMMENT ON COLUMN yt_ab_experiments.segment_rules IS '用户分段规则，JSON格式存储';
COMMENT ON COLUMN yt_ab_assignments.fingerprint IS '用户设备指纹';
COMMENT ON COLUMN yt_ab_events.event_type IS '事件类型：impression, click, conversion, skip, error';
COMMENT ON COLUMN yt_optimization_candidates.config IS '优化配置，包含按钮样式、文案等';
COMMENT ON COLUMN yt_optimization_candidates.performance IS '性能指标，包含展示、点击、转化数据';
COMMENT ON COLUMN yt_user_behavior.event_type IS '用户行为事件类型';
COMMENT ON COLUMN yt_user_behavior.device_info IS '设备信息，JSON格式存储';
COMMENT ON COLUMN yt_user_personas.confidence IS '画像识别置信度，0-1之间';
COMMENT ON COLUMN yt_personalization_effects.interaction_type IS '交互类型：shown, clicked, converted, dismissed';

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_ab_experiments_updated_at 
    BEFORE UPDATE ON yt_ab_experiments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_optimization_candidates_updated_at 
    BEFORE UPDATE ON yt_optimization_candidates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建数据清理函数（可选）
CREATE OR REPLACE FUNCTION cleanup_old_behavior_data(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM yt_user_behavior 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建数据统计视图
CREATE OR REPLACE VIEW yt_conversion_stats AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) FILTER (WHERE event_type = 'impression') as impressions,
    COUNT(*) FILTER (WHERE event_type = 'click') as clicks,
    COUNT(*) FILTER (WHERE event_type = 'conversion') as conversions,
    ROUND(
        COUNT(*) FILTER (WHERE event_type = 'click')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE event_type = 'impression'), 0) * 100, 
        2
    ) as click_through_rate,
    ROUND(
        COUNT(*) FILTER (WHERE event_type = 'conversion')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE event_type = 'impression'), 0) * 100, 
        2
    ) as conversion_rate
FROM yt_ab_events
GROUP BY DATE(timestamp)
ORDER BY date DESC;

COMMENT ON VIEW yt_conversion_stats IS '转化率统计视图，按日期聚合展示、点击、转化数据';

-- 创建A/B测试结果视图
CREATE OR REPLACE VIEW yt_ab_test_results AS
SELECT 
    e.id as experiment_id,
    e.name as experiment_name,
    e.status,
    ev.variant_id,
    COUNT(*) FILTER (WHERE ev.event_type = 'impression') as impressions,
    COUNT(*) FILTER (WHERE ev.event_type = 'click') as clicks,
    COUNT(*) FILTER (WHERE ev.event_type = 'conversion') as conversions,
    ROUND(
        COUNT(*) FILTER (WHERE ev.event_type = 'click')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE ev.event_type = 'impression'), 0) * 100, 
        2
    ) as click_through_rate,
    ROUND(
        COUNT(*) FILTER (WHERE ev.event_type = 'conversion')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE ev.event_type = 'impression'), 0) * 100, 
        2
    ) as conversion_rate
FROM yt_ab_experiments e
LEFT JOIN yt_ab_events ev ON e.id = ev.experiment_id
WHERE e.status IN ('running', 'completed')
GROUP BY e.id, e.name, e.status, ev.variant_id
ORDER BY e.created_at DESC, ev.variant_id;

COMMENT ON VIEW yt_ab_test_results IS 'A/B测试结果视图，显示各变体的性能指标';

-- 插入一些示例数据（可选，用于测试）
INSERT INTO yt_optimization_candidates (id, name, config, performance) VALUES
('default_blue', '默认蓝色按钮', 
 '{"buttonStyle": {"color": "#FFFFFF", "backgroundColor": "#3B82F6", "borderRadius": 8, "fontSize": 14, "fontWeight": 500, "padding": {"x": 16, "y": 8}}, "textContent": {"buttonText": "立即登录"}}',
 '{"impressions": 0, "clicks": 0, "conversions": 0, "score": 0, "confidence": 0}'),
('green_cta', '绿色行动按钮',
 '{"buttonStyle": {"color": "#FFFFFF", "backgroundColor": "#10B981", "borderRadius": 12, "fontSize": 16, "fontWeight": 600, "padding": {"x": 20, "y": 10}}, "textContent": {"buttonText": "免费开始"}}',
 '{"impressions": 0, "clicks": 0, "conversions": 0, "score": 0, "confidence": 0}'),
('orange_urgent', '橙色紧急按钮',
 '{"buttonStyle": {"color": "#FFFFFF", "backgroundColor": "#F59E0B", "borderRadius": 6, "fontSize": 15, "fontWeight": 700, "padding": {"x": 18, "y": 9}}, "textContent": {"buttonText": "立即解锁"}}',
 '{"impressions": 0, "clicks": 0, "conversions": 0, "score": 0, "confidence": 0}')
ON CONFLICT (id) DO NOTHING;