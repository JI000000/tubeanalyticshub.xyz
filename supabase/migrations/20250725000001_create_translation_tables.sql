-- 翻译管理数据库表
-- 创建时间: 2025-07-25

-- 翻译命名空间表
CREATE TABLE IF NOT EXISTS yt_translation_namespaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 5,
    max_size_kb INTEGER DEFAULT 15, -- 最大文件大小限制
    cache_ttl INTEGER DEFAULT 21600, -- 缓存TTL (秒)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 翻译表 (支持版本控制)
CREATE TABLE IF NOT EXISTS yt_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    namespace_id UUID REFERENCES yt_translation_namespaces(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL, -- zh-CN, en-US, ja-JP, ko-KR
    translation_key VARCHAR(255) NOT NULL,
    translation_value TEXT NOT NULL,
    context TEXT, -- 翻译上下文说明
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'pending', 'rejected')),
    created_by UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(namespace_id, locale, translation_key, version)
);

-- 翻译缓存表 (性能优化)
CREATE TABLE IF NOT EXISTS yt_translation_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(100) UNIQUE NOT NULL, -- namespace-locale格式
    namespace_id UUID REFERENCES yt_translation_namespaces(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL,
    content JSONB NOT NULL, -- 完整的翻译JSON
    content_hash VARCHAR(64) NOT NULL, -- 内容哈希，用于检测变更
    file_size INTEGER NOT NULL, -- 文件大小(字节)
    compression_ratio DECIMAL(4,2), -- 压缩比
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 翻译质量管理表
CREATE TABLE IF NOT EXISTS yt_translation_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_id UUID REFERENCES yt_translations(id) ON DELETE CASCADE,
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1), -- 0-1质量评分
    accuracy_score DECIMAL(3,2), -- 准确性评分
    fluency_score DECIMAL(3,2), -- 流畅性评分
    consistency_score DECIMAL(3,2), -- 一致性评分
    ai_confidence DECIMAL(3,2), -- AI翻译置信度
    human_rating INTEGER CHECK (human_rating >= 1 AND human_rating <= 5), -- 人工评分1-5
    feedback TEXT, -- 质量反馈
    issues JSONB DEFAULT '[]', -- 发现的问题列表
    suggestions JSONB DEFAULT '[]', -- 改进建议
    evaluated_by UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    evaluation_method VARCHAR(20) DEFAULT 'ai' CHECK (evaluation_method IN ('ai', 'human', 'hybrid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 翻译使用统计表
CREATE TABLE IF NOT EXISTS yt_translation_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    namespace_id UUID REFERENCES yt_translation_namespaces(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL,
    translation_key VARCHAR(255) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agents TEXT[], -- 使用的用户代理
    ip_addresses INET[], -- 使用的IP地址
    session_count INTEGER DEFAULT 1, -- 会话数
    unique_users INTEGER DEFAULT 1, -- 唯一用户数
    avg_load_time INTEGER, -- 平均加载时间(毫秒)
    error_count INTEGER DEFAULT 0, -- 错误次数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(namespace_id, locale, translation_key)
);

-- 翻译变更日志表
CREATE TABLE IF NOT EXISTS yt_translation_change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_id UUID REFERENCES yt_translations(id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'approve', 'reject')),
    old_value TEXT, -- 变更前的值
    new_value TEXT, -- 变更后的值
    change_reason TEXT, -- 变更原因
    changed_by UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}', -- 额外的变更元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 翻译导入导出任务表
CREATE TABLE IF NOT EXISTS yt_translation_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('import', 'export', 'sync', 'validate', 'generate')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    namespace_id UUID REFERENCES yt_translation_namespaces(id) ON DELETE CASCADE,
    locales TEXT[], -- 涉及的语言
    config JSONB DEFAULT '{}', -- 任务配置
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    success_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    result_data JSONB, -- 任务结果数据
    error_message TEXT,
    file_url TEXT, -- 导入/导出文件URL
    created_by UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_yt_translation_namespaces_name ON yt_translation_namespaces(name);
CREATE INDEX IF NOT EXISTS idx_yt_translation_namespaces_priority ON yt_translation_namespaces(priority);

CREATE INDEX IF NOT EXISTS idx_yt_translations_namespace_locale ON yt_translations(namespace_id, locale);
CREATE INDEX IF NOT EXISTS idx_yt_translations_key ON yt_translations(translation_key);
CREATE INDEX IF NOT EXISTS idx_yt_translations_status ON yt_translations(status);
CREATE INDEX IF NOT EXISTS idx_yt_translations_version ON yt_translations(version);

CREATE INDEX IF NOT EXISTS idx_yt_translation_cache_key ON yt_translation_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_yt_translation_cache_expires ON yt_translation_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_yt_translation_cache_accessed ON yt_translation_cache(last_accessed);

CREATE INDEX IF NOT EXISTS idx_yt_translation_quality_score ON yt_translation_quality(quality_score);
CREATE INDEX IF NOT EXISTS idx_yt_translation_quality_method ON yt_translation_quality(evaluation_method);

CREATE INDEX IF NOT EXISTS idx_yt_translation_usage_namespace_locale ON yt_translation_usage_stats(namespace_id, locale);
CREATE INDEX IF NOT EXISTS idx_yt_translation_usage_count ON yt_translation_usage_stats(usage_count);
CREATE INDEX IF NOT EXISTS idx_yt_translation_usage_last_used ON yt_translation_usage_stats(last_used);

CREATE INDEX IF NOT EXISTS idx_yt_translation_change_logs_translation ON yt_translation_change_logs(translation_id);
CREATE INDEX IF NOT EXISTS idx_yt_translation_change_logs_type ON yt_translation_change_logs(change_type);
CREATE INDEX IF NOT EXISTS idx_yt_translation_change_logs_created ON yt_translation_change_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_yt_translation_tasks_type ON yt_translation_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_yt_translation_tasks_status ON yt_translation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_yt_translation_tasks_created ON yt_translation_tasks(created_at);

-- 启用RLS
ALTER TABLE yt_translation_namespaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_translation_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_translation_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_translation_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_translation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS策略 - 管理员可以管理所有翻译
CREATE POLICY "Admins can manage all translations" ON yt_translation_namespaces
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id = auth.uid() AND plan IN ('pro', 'enterprise')
        )
    );

CREATE POLICY "Users can view active translations" ON yt_translations
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage translations" ON yt_translations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id = auth.uid() AND plan IN ('pro', 'enterprise')
        )
    );

CREATE POLICY "Users can access translation cache" ON yt_translation_cache
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage translation cache" ON yt_translation_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id = auth.uid() AND plan IN ('pro', 'enterprise')
        )
    );

-- 其他表的类似策略...
CREATE POLICY "Users can view translation quality" ON yt_translation_quality
    FOR SELECT USING (true);

CREATE POLICY "System can update usage stats" ON yt_translation_usage_stats
    FOR ALL USING (true);

CREATE POLICY "Users can view change logs" ON yt_translation_change_logs
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage translation tasks" ON yt_translation_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id = auth.uid() AND plan IN ('pro', 'enterprise')
        )
    );

-- 添加更新时间触发器
CREATE TRIGGER update_yt_translation_namespaces_updated_at 
    BEFORE UPDATE ON yt_translation_namespaces 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_translations_updated_at 
    BEFORE UPDATE ON yt_translations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_translation_cache_updated_at 
    BEFORE UPDATE ON yt_translation_cache 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_translation_quality_updated_at 
    BEFORE UPDATE ON yt_translation_quality 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_translation_usage_stats_updated_at 
    BEFORE UPDATE ON yt_translation_usage_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 插入默认命名空间
INSERT INTO yt_translation_namespaces (name, description, priority, max_size_kb, cache_ttl) VALUES 
    ('core', '核心翻译 - 通用组件和基础功能', 1, 5, 86400),
    ('pages', '页面翻译 - 各个页面的专用翻译', 2, 10, 43200),
    ('features', '功能翻译 - 特定功能模块的翻译', 3, 15, 21600),
    ('dynamic', '动态翻译 - 运行时生成的翻译内容', 4, 20, 3600)
ON CONFLICT (name) DO NOTHING;

-- 创建翻译缓存清理函数
CREATE OR REPLACE FUNCTION cleanup_expired_translation_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM yt_translation_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建翻译使用统计更新函数
CREATE OR REPLACE FUNCTION update_translation_usage_stats(
    p_namespace_id UUID,
    p_locale VARCHAR(10),
    p_translation_key VARCHAR(255),
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO yt_translation_usage_stats (
        namespace_id, locale, translation_key, usage_count, last_used,
        user_agents, ip_addresses, session_count, unique_users
    ) VALUES (
        p_namespace_id, p_locale, p_translation_key, 1, NOW(),
        CASE WHEN p_user_agent IS NOT NULL THEN ARRAY[p_user_agent] ELSE ARRAY[]::TEXT[] END,
        CASE WHEN p_ip_address IS NOT NULL THEN ARRAY[p_ip_address] ELSE ARRAY[]::INET[] END,
        1, 1
    )
    ON CONFLICT (namespace_id, locale, translation_key) 
    DO UPDATE SET
        usage_count = yt_translation_usage_stats.usage_count + 1,
        last_used = NOW(),
        user_agents = CASE 
            WHEN p_user_agent IS NOT NULL AND NOT (p_user_agent = ANY(yt_translation_usage_stats.user_agents))
            THEN array_append(yt_translation_usage_stats.user_agents, p_user_agent)
            ELSE yt_translation_usage_stats.user_agents
        END,
        ip_addresses = CASE 
            WHEN p_ip_address IS NOT NULL AND NOT (p_ip_address = ANY(yt_translation_usage_stats.ip_addresses))
            THEN array_append(yt_translation_usage_stats.ip_addresses, p_ip_address)
            ELSE yt_translation_usage_stats.ip_addresses
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;