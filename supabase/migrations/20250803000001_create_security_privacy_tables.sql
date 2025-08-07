-- 创建登录安全和隐私保护相关表
-- 支持IP地址记录、异常检测、隐私设置、数据删除等功能

-- 创建登录安全记录表
CREATE TABLE IF NOT EXISTS yt_login_security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    nextauth_user_id TEXT, -- 支持NextAuth用户ID
    session_id UUID,
    event_type VARCHAR(50) NOT NULL, -- 'login_success', 'login_failed', 'logout', 'session_refresh', 'password_change'
    login_method VARCHAR(50), -- 'github', 'google', 'email', 'oauth'
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    location_data JSONB DEFAULT '{}', -- 地理位置信息
    security_flags JSONB DEFAULT '{}', -- 安全标记
    risk_score INTEGER DEFAULT 0, -- 风险评分 0-100
    is_suspicious BOOLEAN DEFAULT false,
    blocked_reason VARCHAR(255), -- 如果被阻止，记录原因
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建异常登录检测表
CREATE TABLE IF NOT EXISTS yt_login_anomaly_detection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES yt_users(id) ON DELETE CASCADE,
    anomaly_type VARCHAR(50) NOT NULL, -- 'unusual_location', 'unusual_time', 'unusual_device', 'brute_force', 'concurrent_sessions'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    detection_data JSONB DEFAULT '{}',
    current_login_id UUID REFERENCES yt_login_security_logs(id),
    is_confirmed_threat BOOLEAN DEFAULT false,
    is_false_positive BOOLEAN DEFAULT false,
    user_response VARCHAR(50), -- 'approved', 'blocked', 'pending'
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 创建用户隐私设置表
CREATE TABLE IF NOT EXISTS yt_user_privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    
    -- 数据收集设置
    allow_analytics BOOLEAN DEFAULT true,
    allow_performance_tracking BOOLEAN DEFAULT true,
    allow_error_reporting BOOLEAN DEFAULT true,
    allow_usage_statistics BOOLEAN DEFAULT true,
    
    -- 登录安全设置
    enable_login_notifications BOOLEAN DEFAULT true,
    enable_security_alerts BOOLEAN DEFAULT true,
    enable_location_tracking BOOLEAN DEFAULT false,
    require_2fa BOOLEAN DEFAULT false,
    
    -- 数据保留设置
    data_retention_period INTEGER DEFAULT 365, -- 天数
    auto_delete_logs BOOLEAN DEFAULT false,
    keep_essential_data_only BOOLEAN DEFAULT false,
    
    -- 第三方集成设置
    allow_oauth_data_sharing BOOLEAN DEFAULT true,
    allow_profile_data_export BOOLEAN DEFAULT true,
    
    -- GDPR相关设置
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    marketing_consent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建数据删除请求表
CREATE TABLE IF NOT EXISTS yt_data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES yt_users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- 'partial_deletion', 'full_account_deletion', 'data_export'
    deletion_scope JSONB DEFAULT '{}', -- 指定要删除的数据类型
    reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    requested_by VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'system'
    
    -- 处理信息
    processed_by UUID REFERENCES yt_users(id),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_notes TEXT,
    
    -- 删除统计
    deleted_records_count JSONB DEFAULT '{}',
    export_file_path TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建GDPR合规记录表
CREATE TABLE IF NOT EXISTS yt_gdpr_compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'consent_given', 'consent_withdrawn', 'data_exported', 'data_deleted', 'data_rectified'
    legal_basis VARCHAR(100), -- 'consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'
    data_categories JSONB DEFAULT '[]', -- 涉及的数据类别
    processing_purpose VARCHAR(255),
    retention_period INTEGER, -- 数据保留期限（天）
    
    -- 请求详情
    request_source VARCHAR(50), -- 'user_portal', 'email', 'support_ticket', 'admin'
    request_reference VARCHAR(100),
    
    -- 处理详情
    processed_by VARCHAR(100),
    processing_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建IP地址黑名单表
CREATE TABLE IF NOT EXISTS yt_ip_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    ip_range CIDR, -- 支持IP段
    reason VARCHAR(255) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    added_by UUID REFERENCES yt_users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_yt_login_security_logs_user_id ON yt_login_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_login_security_logs_nextauth_user_id ON yt_login_security_logs(nextauth_user_id);
CREATE INDEX IF NOT EXISTS idx_yt_login_security_logs_ip_address ON yt_login_security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_yt_login_security_logs_event_type ON yt_login_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_yt_login_security_logs_created_at ON yt_login_security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_yt_login_security_logs_suspicious ON yt_login_security_logs(is_suspicious);

CREATE INDEX IF NOT EXISTS idx_yt_login_anomaly_detection_user_id ON yt_login_anomaly_detection(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_login_anomaly_detection_type ON yt_login_anomaly_detection(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_yt_login_anomaly_detection_severity ON yt_login_anomaly_detection(severity);
CREATE INDEX IF NOT EXISTS idx_yt_login_anomaly_detection_created_at ON yt_login_anomaly_detection(created_at);

CREATE INDEX IF NOT EXISTS idx_yt_user_privacy_settings_user_id ON yt_user_privacy_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_yt_data_deletion_requests_user_id ON yt_data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_data_deletion_requests_status ON yt_data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_yt_data_deletion_requests_type ON yt_data_deletion_requests(request_type);

CREATE INDEX IF NOT EXISTS idx_yt_gdpr_compliance_logs_user_id ON yt_gdpr_compliance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_gdpr_compliance_logs_action_type ON yt_gdpr_compliance_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_yt_gdpr_compliance_logs_created_at ON yt_gdpr_compliance_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_yt_ip_blacklist_ip_address ON yt_ip_blacklist(ip_address);
CREATE INDEX IF NOT EXISTS idx_yt_ip_blacklist_active ON yt_ip_blacklist(is_active);

-- 创建触发器以自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_yt_user_privacy_settings_updated_at ON yt_user_privacy_settings;
CREATE TRIGGER update_yt_user_privacy_settings_updated_at 
    BEFORE UPDATE ON yt_user_privacy_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_yt_data_deletion_requests_updated_at ON yt_data_deletion_requests;
CREATE TRIGGER update_yt_data_deletion_requests_updated_at 
    BEFORE UPDATE ON yt_data_deletion_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_yt_ip_blacklist_updated_at ON yt_ip_blacklist;
CREATE TRIGGER update_yt_ip_blacklist_updated_at 
    BEFORE UPDATE ON yt_ip_blacklist 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建 RLS (Row Level Security) 策略
ALTER TABLE yt_login_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_login_anomaly_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_gdpr_compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_ip_blacklist ENABLE ROW LEVEL SECURITY;

-- 登录安全日志的 RLS 策略
CREATE POLICY "Users can view their own security logs" ON yt_login_security_logs
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
        ) OR
        nextauth_user_id = auth.jwt() ->> 'sub'
    );

-- 系统可以插入安全日志
CREATE POLICY "System can insert security logs" ON yt_login_security_logs
    FOR INSERT WITH CHECK (true);

-- 异常检测的 RLS 策略
CREATE POLICY "Users can view their anomaly detections" ON yt_login_anomaly_detection
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update their anomaly responses" ON yt_login_anomaly_detection
    FOR UPDATE USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 隐私设置的 RLS 策略
CREATE POLICY "Users can manage their privacy settings" ON yt_user_privacy_settings
    FOR ALL USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 数据删除请求的 RLS 策略
CREATE POLICY "Users can manage their deletion requests" ON yt_data_deletion_requests
    FOR ALL USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- GDPR合规日志的 RLS 策略
CREATE POLICY "Users can view their GDPR logs" ON yt_gdpr_compliance_logs
    FOR SELECT USING (user_id IN (
        SELECT id FROM yt_users WHERE nextauth_user_id = auth.jwt() ->> 'sub'
    ));

-- 系统可以插入GDPR日志
CREATE POLICY "System can insert GDPR logs" ON yt_gdpr_compliance_logs
    FOR INSERT WITH CHECK (true);

-- IP黑名单只有管理员可以访问
CREATE POLICY "Admin can manage IP blacklist" ON yt_ip_blacklist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE nextauth_user_id = auth.jwt() ->> 'sub' 
            AND plan IN ('admin', 'enterprise')
        )
    );

-- 创建安全相关函数

-- 记录登录安全事件
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_nextauth_user_id TEXT,
    p_event_type VARCHAR(50),
    p_login_method VARCHAR(50),
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint VARCHAR(255) DEFAULT NULL,
    p_additional_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $
DECLARE
    v_log_id UUID;
    v_risk_score INTEGER := 0;
    v_is_suspicious BOOLEAN := false;
    v_location_data JSONB := '{}';
BEGIN
    -- 计算风险评分
    v_risk_score := calculate_login_risk_score(p_user_id, p_ip_address, p_device_fingerprint, p_additional_data);
    
    -- 判断是否可疑
    v_is_suspicious := v_risk_score > 70;
    
    -- 插入安全日志
    INSERT INTO yt_login_security_logs (
        user_id,
        nextauth_user_id,
        event_type,
        login_method,
        ip_address,
        user_agent,
        device_fingerprint,
        location_data,
        security_flags,
        risk_score,
        is_suspicious
    ) VALUES (
        p_user_id,
        p_nextauth_user_id,
        p_event_type,
        p_login_method,
        p_ip_address,
        p_user_agent,
        p_device_fingerprint,
        v_location_data,
        p_additional_data,
        v_risk_score,
        v_is_suspicious
    ) RETURNING id INTO v_log_id;
    
    -- 如果是可疑登录，创建异常检测记录
    IF v_is_suspicious THEN
        PERFORM detect_login_anomalies(p_user_id, v_log_id, p_ip_address, p_device_fingerprint);
    END IF;
    
    RETURN v_log_id;
END;
$ LANGUAGE plpgsql;

-- 计算登录风险评分
CREATE OR REPLACE FUNCTION calculate_login_risk_score(
    p_user_id UUID,
    p_ip_address INET,
    p_device_fingerprint VARCHAR(255),
    p_additional_data JSONB
)
RETURNS INTEGER AS $
DECLARE
    v_score INTEGER := 0;
    v_recent_logins INTEGER;
    v_known_ip BOOLEAN := false;
    v_known_device BOOLEAN := false;
    v_blacklisted BOOLEAN := false;
BEGIN
    -- 检查IP是否在黑名单中
    SELECT EXISTS(
        SELECT 1 FROM yt_ip_blacklist 
        WHERE (ip_address = p_ip_address OR p_ip_address << ip_range)
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO v_blacklisted;
    
    IF v_blacklisted THEN
        v_score := v_score + 50;
    END IF;
    
    -- 检查是否为已知IP
    SELECT EXISTS(
        SELECT 1 FROM yt_login_security_logs 
        WHERE user_id = p_user_id 
        AND ip_address = p_ip_address 
        AND created_at > NOW() - INTERVAL '30 days'
        AND event_type = 'login_success'
    ) INTO v_known_ip;
    
    IF NOT v_known_ip THEN
        v_score := v_score + 20;
    END IF;
    
    -- 检查是否为已知设备
    IF p_device_fingerprint IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM yt_login_security_logs 
            WHERE user_id = p_user_id 
            AND device_fingerprint = p_device_fingerprint 
            AND created_at > NOW() - INTERVAL '30 days'
            AND event_type = 'login_success'
        ) INTO v_known_device;
        
        IF NOT v_known_device THEN
            v_score := v_score + 15;
        END IF;
    END IF;
    
    -- 检查最近登录频率
    SELECT COUNT(*) INTO v_recent_logins
    FROM yt_login_security_logs
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND event_type IN ('login_success', 'login_failed');
    
    IF v_recent_logins > 10 THEN
        v_score := v_score + 30;
    ELSIF v_recent_logins > 5 THEN
        v_score := v_score + 15;
    END IF;
    
    -- 确保分数在0-100范围内
    v_score := LEAST(100, GREATEST(0, v_score));
    
    RETURN v_score;
END;
$ LANGUAGE plpgsql;

-- 检测登录异常
CREATE OR REPLACE FUNCTION detect_login_anomalies(
    p_user_id UUID,
    p_login_id UUID,
    p_ip_address INET,
    p_device_fingerprint VARCHAR(255)
)
RETURNS VOID AS $
DECLARE
    v_anomaly_data JSONB;
    v_severity VARCHAR(20);
BEGIN
    -- 检测异常位置登录
    IF NOT EXISTS(
        SELECT 1 FROM yt_login_security_logs 
        WHERE user_id = p_user_id 
        AND ip_address = p_ip_address 
        AND created_at > NOW() - INTERVAL '30 days'
        AND event_type = 'login_success'
    ) THEN
        v_anomaly_data := jsonb_build_object(
            'ip_address', p_ip_address::TEXT,
            'detection_reason', 'new_location',
            'timestamp', NOW()
        );
        
        INSERT INTO yt_login_anomaly_detection (
            user_id,
            anomaly_type,
            severity,
            detection_data,
            current_login_id
        ) VALUES (
            p_user_id,
            'unusual_location',
            'medium',
            v_anomaly_data,
            p_login_id
        );
    END IF;
    
    -- 检测异常设备登录
    IF p_device_fingerprint IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM yt_login_security_logs 
        WHERE user_id = p_user_id 
        AND device_fingerprint = p_device_fingerprint 
        AND created_at > NOW() - INTERVAL '30 days'
        AND event_type = 'login_success'
    ) THEN
        v_anomaly_data := jsonb_build_object(
            'device_fingerprint', p_device_fingerprint,
            'detection_reason', 'new_device',
            'timestamp', NOW()
        );
        
        INSERT INTO yt_login_anomaly_detection (
            user_id,
            anomaly_type,
            severity,
            detection_data,
            current_login_id
        ) VALUES (
            p_user_id,
            'unusual_device',
            'medium',
            v_anomaly_data,
            p_login_id
        );
    END IF;
END;
$ LANGUAGE plpgsql;

-- 初始化用户隐私设置
CREATE OR REPLACE FUNCTION initialize_user_privacy_settings(p_user_id UUID)
RETURNS VOID AS $
BEGIN
    INSERT INTO yt_user_privacy_settings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$ LANGUAGE plpgsql;

-- 处理数据删除请求
CREATE OR REPLACE FUNCTION process_data_deletion_request(p_request_id UUID)
RETURNS JSONB AS $
DECLARE
    v_request RECORD;
    v_deleted_count JSONB := '{}';
    v_result JSONB;
BEGIN
    -- 获取删除请求详情
    SELECT * INTO v_request
    FROM yt_data_deletion_requests
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;
    
    -- 更新状态为处理中
    UPDATE yt_data_deletion_requests
    SET status = 'processing',
        processing_started_at = NOW()
    WHERE id = p_request_id;
    
    -- 根据删除类型执行相应操作
    CASE v_request.request_type
        WHEN 'partial_deletion' THEN
            -- 部分数据删除逻辑
            v_deleted_count := perform_partial_deletion(v_request.user_id, v_request.deletion_scope);
        WHEN 'full_account_deletion' THEN
            -- 完整账户删除逻辑
            v_deleted_count := perform_full_account_deletion(v_request.user_id);
        ELSE
            -- 不支持的删除类型
            UPDATE yt_data_deletion_requests
            SET status = 'failed',
                processing_notes = 'Unsupported deletion type'
            WHERE id = p_request_id;
            
            RETURN jsonb_build_object('success', false, 'error', 'Unsupported deletion type');
    END CASE;
    
    -- 更新请求状态为完成
    UPDATE yt_data_deletion_requests
    SET status = 'completed',
        processing_completed_at = NOW(),
        deleted_records_count = v_deleted_count
    WHERE id = p_request_id;
    
    -- 记录GDPR合规日志
    INSERT INTO yt_gdpr_compliance_logs (
        user_id,
        action_type,
        legal_basis,
        data_categories,
        processing_purpose,
        request_source,
        request_reference
    ) VALUES (
        v_request.user_id,
        'data_deleted',
        'consent',
        ARRAY['user_data', 'login_logs', 'analytics'],
        'User requested data deletion',
        'user_portal',
        p_request_id::TEXT
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'deleted_count', v_deleted_count,
        'request_id', p_request_id
    );
    
    RETURN v_result;
END;
$ LANGUAGE plpgsql;

-- 执行部分数据删除
CREATE OR REPLACE FUNCTION perform_partial_deletion(
    p_user_id UUID,
    p_deletion_scope JSONB
)
RETURNS JSONB AS $
DECLARE
    v_deleted_count JSONB := '{}';
    v_count INTEGER;
BEGIN
    -- 删除登录日志（如果在删除范围内）
    IF p_deletion_scope ? 'login_logs' THEN
        DELETE FROM yt_login_security_logs WHERE user_id = p_user_id;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        v_deleted_count := v_deleted_count || jsonb_build_object('login_logs', v_count);
    END IF;
    
    -- 删除分析数据（如果在删除范围内）
    IF p_deletion_scope ? 'analytics' THEN
        DELETE FROM yt_login_analytics WHERE user_id::UUID = p_user_id;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        v_deleted_count := v_deleted_count || jsonb_build_object('analytics', v_count);
    END IF;
    
    -- 删除设备信息（如果在删除范围内）
    IF p_deletion_scope ? 'device_info' THEN
        DELETE FROM yt_user_devices WHERE user_id = p_user_id;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        v_deleted_count := v_deleted_count || jsonb_build_object('device_info', v_count);
    END IF;
    
    RETURN v_deleted_count;
END;
$ LANGUAGE plpgsql;

-- 执行完整账户删除
CREATE OR REPLACE FUNCTION perform_full_account_deletion(p_user_id UUID)
RETURNS JSONB AS $
DECLARE
    v_deleted_count JSONB := '{}';
    v_count INTEGER;
BEGIN
    -- 删除所有相关数据
    DELETE FROM yt_login_security_logs WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_count := v_deleted_count || jsonb_build_object('login_logs', v_count);
    
    DELETE FROM yt_login_anomaly_detection WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_count := v_deleted_count || jsonb_build_object('anomaly_detection', v_count);
    
    DELETE FROM yt_user_privacy_settings WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_count := v_deleted_count || jsonb_build_object('privacy_settings', v_count);
    
    DELETE FROM yt_user_devices WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_count := v_deleted_count || jsonb_build_object('devices', v_count);
    
    -- 最后删除用户记录
    DELETE FROM yt_users WHERE id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_count := v_deleted_count || jsonb_build_object('user_account', v_count);
    
    RETURN v_deleted_count;
END;
$ LANGUAGE plpgsql;

-- 添加表注释
COMMENT ON TABLE yt_login_security_logs IS '登录安全日志表，记录所有登录相关的安全事件';
COMMENT ON TABLE yt_login_anomaly_detection IS '登录异常检测表，记录检测到的异常登录行为';
COMMENT ON TABLE yt_user_privacy_settings IS '用户隐私设置表，存储用户的隐私偏好';
COMMENT ON TABLE yt_data_deletion_requests IS '数据删除请求表，处理用户的数据删除请求';
COMMENT ON TABLE yt_gdpr_compliance_logs IS 'GDPR合规日志表，记录数据处理的合规性';
COMMENT ON TABLE yt_ip_blacklist IS 'IP黑名单表，存储被禁止的IP地址';