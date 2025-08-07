-- 创建跨设备登录状态同步相关表
-- 支持设备管理、登录状态同步、冲突检测等功能

-- 创建用户设备表
CREATE TABLE IF NOT EXISTS yt_user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    is_trusted BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_fingerprint)
);

-- 创建设备会话表
CREATE TABLE IF NOT EXISTS yt_device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES yt_user_devices(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    nextauth_session_id UUID,
    is_active BOOLEAN DEFAULT true,
    login_method VARCHAR(50), -- 'github', 'google', 'email'
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    logout_at TIMESTAMP WITH TIME ZONE,
    logout_reason VARCHAR(100), -- 'user_initiated', 'expired', 'security', 'conflict'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建设备同步事件表
CREATE TABLE IF NOT EXISTS yt_device_sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES yt_user_devices(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'conflict', 'security_alert', 'sync'
    event_data JSONB DEFAULT '{}',
    source_device_id UUID REFERENCES yt_user_devices(id) ON DELETE SET NULL,
    target_device_id UUID REFERENCES yt_user_devices(id) ON DELETE SET NULL,
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建设备安全警报表
CREATE TABLE IF NOT EXISTS yt_device_security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES yt_user_devices(id) ON DELETE SET NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'new_device', 'suspicious_login', 'concurrent_sessions', 'location_change'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    alert_data JSONB DEFAULT '{}',
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建设备同步配置表
CREATE TABLE IF NOT EXISTS yt_device_sync_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    max_concurrent_sessions INTEGER DEFAULT 5,
    auto_logout_inactive_sessions BOOLEAN DEFAULT true,
    inactive_session_timeout INTEGER DEFAULT 2592000, -- 30 days in seconds
    require_device_approval BOOLEAN DEFAULT false,
    enable_security_alerts BOOLEAN DEFAULT true,
    sync_preferences BOOLEAN DEFAULT true,
    sync_activity BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_yt_user_devices_user_id ON yt_user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_user_devices_fingerprint ON yt_user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_yt_user_devices_active ON yt_user_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_yt_user_devices_last_seen ON yt_user_devices(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_yt_device_sessions_device_id ON yt_device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_yt_device_sessions_token ON yt_device_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_yt_device_sessions_active ON yt_device_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_yt_device_sessions_expires ON yt_device_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_yt_device_sessions_nextauth ON yt_device_sessions(nextauth_session_id);

CREATE INDEX IF NOT EXISTS idx_yt_device_sync_events_user_id ON yt_device_sync_events(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_device_sync_events_type ON yt_device_sync_events(event_type);
CREATE INDEX IF NOT EXISTS idx_yt_device_sync_events_processed ON yt_device_sync_events(is_processed);
CREATE INDEX IF NOT EXISTS idx_yt_device_sync_events_created ON yt_device_sync_events(created_at);

CREATE INDEX IF NOT EXISTS idx_yt_device_security_alerts_user_id ON yt_device_security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_device_security_alerts_type ON yt_device_security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_yt_device_security_alerts_severity ON yt_device_security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_yt_device_security_alerts_acknowledged ON yt_device_security_alerts(is_acknowledged);

CREATE INDEX IF NOT EXISTS idx_yt_device_sync_config_user_id ON yt_device_sync_config(user_id);

-- 创建触发器以自动更新 updated_at 字段
DROP TRIGGER IF EXISTS update_yt_user_devices_updated_at ON yt_user_devices;
CREATE TRIGGER update_yt_user_devices_updated_at 
    BEFORE UPDATE ON yt_user_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_yt_device_sessions_updated_at ON yt_device_sessions;
CREATE TRIGGER update_yt_device_sessions_updated_at 
    BEFORE UPDATE ON yt_device_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_yt_device_sync_config_updated_at ON yt_device_sync_config;
CREATE TRIGGER update_yt_device_sync_config_updated_at 
    BEFORE UPDATE ON yt_device_sync_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建 RLS (Row Level Security) 策略
ALTER TABLE yt_user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_device_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_device_security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_device_sync_config ENABLE ROW LEVEL SECURITY;

-- 用户设备表的 RLS 策略
CREATE POLICY "Users can view their own devices" ON yt_user_devices
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update their own devices" ON yt_user_devices
    FOR UPDATE USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 设备会话表的 RLS 策略
CREATE POLICY "Users can view their device sessions" ON yt_device_sessions
    FOR SELECT USING (device_id IN (
        SELECT id FROM yt_user_devices WHERE user_id IN (
            SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
        )
    ));

-- 设备同步事件表的 RLS 策略
CREATE POLICY "Users can view their sync events" ON yt_device_sync_events
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 设备安全警报表的 RLS 策略
CREATE POLICY "Users can view their security alerts" ON yt_device_security_alerts
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update their security alerts" ON yt_device_security_alerts
    FOR UPDATE USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 设备同步配置表的 RLS 策略
CREATE POLICY "Users can view their sync config" ON yt_device_sync_config
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update their sync config" ON yt_device_sync_config
    FOR UPDATE USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 创建设备管理相关函数

-- 注册新设备
CREATE OR REPLACE FUNCTION register_user_device(
    p_user_id UUID,
    p_device_fingerprint VARCHAR(255),
    p_device_info JSONB DEFAULT '{}'
)
RETURNS UUID AS $
DECLARE
    v_device_id UUID;
    v_device_name VARCHAR(255);
    v_requires_approval BOOLEAN;
BEGIN
    -- 生成设备名称
    v_device_name := COALESCE(
        p_device_info->>'device_name',
        CONCAT(
            COALESCE(p_device_info->>'os_name', 'Unknown OS'),
            ' - ',
            COALESCE(p_device_info->>'browser_name', 'Unknown Browser')
        )
    );
    
    -- 检查是否需要设备审批
    SELECT require_device_approval INTO v_requires_approval
    FROM yt_device_sync_config
    WHERE user_id = p_user_id;
    
    -- 如果没有配置，使用默认值
    IF v_requires_approval IS NULL THEN
        v_requires_approval := false;
    END IF;
    
    -- 插入或更新设备记录
    INSERT INTO yt_user_devices (
        user_id,
        device_fingerprint,
        device_name,
        device_type,
        browser_name,
        browser_version,
        os_name,
        os_version,
        ip_address,
        user_agent,
        is_trusted,
        last_seen_at
    ) VALUES (
        p_user_id,
        p_device_fingerprint,
        v_device_name,
        p_device_info->>'device_type',
        p_device_info->>'browser_name',
        p_device_info->>'browser_version',
        p_device_info->>'os_name',
        p_device_info->>'os_version',
        (p_device_info->>'ip_address')::INET,
        p_device_info->>'user_agent',
        NOT v_requires_approval, -- 如果不需要审批，则自动信任
        NOW()
    )
    ON CONFLICT (user_id, device_fingerprint) DO UPDATE SET
        device_name = EXCLUDED.device_name,
        device_type = EXCLUDED.device_type,
        browser_name = EXCLUDED.browser_name,
        browser_version = EXCLUDED.browser_version,
        os_name = EXCLUDED.os_name,
        os_version = EXCLUDED.os_version,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        last_seen_at = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_device_id;
    
    -- 如果是新设备，创建安全警报
    IF NOT EXISTS (
        SELECT 1 FROM yt_user_devices 
        WHERE user_id = p_user_id 
        AND device_fingerprint = p_device_fingerprint 
        AND created_at < NOW() - INTERVAL '1 minute'
    ) THEN
        INSERT INTO yt_device_security_alerts (
            user_id,
            device_id,
            alert_type,
            severity,
            alert_data
        ) VALUES (
            p_user_id,
            v_device_id,
            'new_device',
            'medium',
            jsonb_build_object(
                'device_name', v_device_name,
                'ip_address', p_device_info->>'ip_address',
                'location', p_device_info->>'location',
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN v_device_id;
END;
$ LANGUAGE plpgsql;

-- 检测登录冲突
CREATE OR REPLACE FUNCTION detect_login_conflicts(
    p_user_id UUID,
    p_device_id UUID
)
RETURNS JSONB AS $
DECLARE
    v_max_sessions INTEGER;
    v_active_sessions INTEGER;
    v_conflicts JSONB;
BEGIN
    -- 获取用户的最大并发会话数配置
    SELECT max_concurrent_sessions INTO v_max_sessions
    FROM yt_device_sync_config
    WHERE user_id = p_user_id;
    
    -- 如果没有配置，使用默认值
    IF v_max_sessions IS NULL THEN
        v_max_sessions := 5;
    END IF;
    
    -- 计算当前活跃会话数
    SELECT COUNT(*) INTO v_active_sessions
    FROM yt_device_sessions ds
    JOIN yt_user_devices ud ON ds.device_id = ud.id
    WHERE ud.user_id = p_user_id
    AND ds.is_active = true
    AND ds.expires_at > NOW();
    
    -- 构建冲突信息
    v_conflicts := jsonb_build_object(
        'has_conflicts', v_active_sessions >= v_max_sessions,
        'active_sessions', v_active_sessions,
        'max_sessions', v_max_sessions,
        'sessions_to_terminate', GREATEST(0, v_active_sessions - v_max_sessions + 1)
    );
    
    -- 如果有冲突，记录事件
    IF v_active_sessions >= v_max_sessions THEN
        INSERT INTO yt_device_sync_events (
            user_id,
            device_id,
            event_type,
            event_data
        ) VALUES (
            p_user_id,
            p_device_id,
            'conflict',
            v_conflicts
        );
    END IF;
    
    RETURN v_conflicts;
END;
$ LANGUAGE plpgsql;

-- 清理过期会话
CREATE OR REPLACE FUNCTION cleanup_expired_device_sessions()
RETURNS INTEGER AS $
DECLARE
    v_cleaned_count INTEGER;
BEGIN
    -- 标记过期会话为非活跃
    UPDATE yt_device_sessions
    SET is_active = false,
        logout_at = NOW(),
        logout_reason = 'expired',
        updated_at = NOW()
    WHERE is_active = true
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
    
    -- 记录清理事件
    INSERT INTO yt_device_sync_events (
        user_id,
        event_type,
        event_data
    )
    SELECT DISTINCT ud.user_id,
           'sync',
           jsonb_build_object(
               'action', 'cleanup_expired_sessions',
               'cleaned_count', v_cleaned_count,
               'timestamp', NOW()
           )
    FROM yt_device_sessions ds
    JOIN yt_user_devices ud ON ds.device_id = ud.id
    WHERE ds.logout_reason = 'expired'
    AND ds.logout_at > NOW() - INTERVAL '1 minute';
    
    RETURN v_cleaned_count;
END;
$ LANGUAGE plpgsql;

-- 添加注释
COMMENT ON TABLE yt_user_devices IS '用户设备表，记录用户登录的所有设备信息';
COMMENT ON TABLE yt_device_sessions IS '设备会话表，记录每个设备的登录会话';
COMMENT ON TABLE yt_device_sync_events IS '设备同步事件表，记录跨设备同步相关事件';
COMMENT ON TABLE yt_device_security_alerts IS '设备安全警报表，记录安全相关警报';
COMMENT ON TABLE yt_device_sync_config IS '设备同步配置表，存储用户的同步偏好设置';

COMMENT ON COLUMN yt_user_devices.device_fingerprint IS '设备指纹，用于唯一标识设备';
COMMENT ON COLUMN yt_user_devices.is_trusted IS '是否为受信任设备';
COMMENT ON COLUMN yt_device_sessions.nextauth_session_id IS '关联的NextAuth会话ID';
COMMENT ON COLUMN yt_device_sync_events.is_processed IS '事件是否已被处理';
COMMENT ON COLUMN yt_device_security_alerts.severity IS '警报严重程度：low, medium, high, critical';