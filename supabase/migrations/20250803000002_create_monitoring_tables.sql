-- 创建系统监控相关表
-- 用于存储系统指标、告警记录和监控配置

-- 系统指标表
CREATE TABLE IF NOT EXISTS yt_system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    login_success_rate DECIMAL(5,2) DEFAULT 0,
    login_failure_rate DECIMAL(5,2) DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0, -- 毫秒
    active_users INTEGER DEFAULT 0,
    trial_conversion_rate DECIMAL(5,2) DEFAULT 0,
    db_connection_status BOOLEAN DEFAULT true,
    api_error_rate DECIMAL(5,2) DEFAULT 0,
    memory_usage DECIMAL(5,2) DEFAULT 0, -- 百分比
    cpu_usage DECIMAL(5,2) DEFAULT 0, -- 百分比
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统告警表
CREATE TABLE IF NOT EXISTS yt_system_alerts (
    id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    context JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolver_id UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

-- 告警规则配置表
CREATE TABLE IF NOT EXISTS yt_alert_rules (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    condition_config JSONB NOT NULL, -- 存储条件配置
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    cooldown INTEGER NOT NULL DEFAULT 300, -- 冷却时间（秒）
    enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered_at TIMESTAMP WITH TIME ZONE
);

-- 监控配置表
CREATE TABLE IF NOT EXISTS yt_monitoring_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 性能基准表
CREATE TABLE IF NOT EXISTS yt_performance_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(255) NOT NULL,
    baseline_value DECIMAL(10,2) NOT NULL,
    threshold_warning DECIMAL(10,2),
    threshold_critical DECIMAL(10,2),
    unit VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_yt_system_metrics_timestamp ON yt_system_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_yt_system_metrics_created_at ON yt_system_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_yt_system_alerts_rule_id ON yt_system_alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_yt_system_alerts_severity ON yt_system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_yt_system_alerts_created_at ON yt_system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_yt_system_alerts_resolved ON yt_system_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_yt_alert_rules_enabled ON yt_alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_yt_alert_rules_severity ON yt_alert_rules(severity);

CREATE INDEX IF NOT EXISTS idx_yt_monitoring_config_key ON yt_monitoring_config(config_key);

CREATE INDEX IF NOT EXISTS idx_yt_performance_baselines_metric ON yt_performance_baselines(metric_name);

-- 插入默认监控配置
INSERT INTO yt_monitoring_config (config_key, config_value, description) VALUES
('metrics_collection_interval', '60', '指标收集间隔（秒）'),
('alert_check_interval', '30', '告警检查间隔（秒）'),
('metrics_retention_days', '30', '指标数据保留天数'),
('alert_retention_days', '90', '告警记录保留天数'),
('notification_channels', '{"slack": {"enabled": false, "webhook_url": ""}, "email": {"enabled": false, "recipients": []}}', '通知渠道配置')
ON CONFLICT (config_key) DO NOTHING;

-- 插入默认性能基准
INSERT INTO yt_performance_baselines (metric_name, baseline_value, threshold_warning, threshold_critical, unit, description) VALUES
('login_success_rate', 95.0, 90.0, 80.0, '%', '登录成功率基准'),
('avg_response_time', 1000.0, 2000.0, 5000.0, 'ms', 'API平均响应时间基准'),
('trial_conversion_rate', 15.0, 10.0, 5.0, '%', '试用转化率基准'),
('memory_usage', 70.0, 80.0, 90.0, '%', '内存使用率基准'),
('api_error_rate', 1.0, 3.0, 5.0, '%', 'API错误率基准')
ON CONFLICT (metric_name) DO NOTHING;

-- 创建清理过期数据的函数
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void AS $$
DECLARE
    metrics_retention_days INTEGER;
    alerts_retention_days INTEGER;
BEGIN
    -- 获取配置的保留天数
    SELECT (config_value::TEXT)::INTEGER INTO metrics_retention_days
    FROM yt_monitoring_config 
    WHERE config_key = 'metrics_retention_days';
    
    SELECT (config_value::TEXT)::INTEGER INTO alerts_retention_days
    FROM yt_monitoring_config 
    WHERE config_key = 'alert_retention_days';
    
    -- 设置默认值
    metrics_retention_days := COALESCE(metrics_retention_days, 30);
    alerts_retention_days := COALESCE(alerts_retention_days, 90);
    
    -- 清理过期的指标数据
    DELETE FROM yt_system_metrics 
    WHERE created_at < NOW() - INTERVAL '1 day' * metrics_retention_days;
    
    -- 清理过期的告警记录（只清理已解决的）
    DELETE FROM yt_system_alerts 
    WHERE resolved = true 
    AND resolved_at < NOW() - INTERVAL '1 day' * alerts_retention_days;
    
    -- 记录清理操作
    RAISE NOTICE '清理完成: 指标保留%天, 告警保留%天', metrics_retention_days, alerts_retention_days;
END;
$$ LANGUAGE plpgsql;

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_yt_alert_rules_updated_at
    BEFORE UPDATE ON yt_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_monitoring_config_updated_at
    BEFORE UPDATE ON yt_monitoring_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_performance_baselines_updated_at
    BEFORE UPDATE ON yt_performance_baselines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：系统健康概览
CREATE OR REPLACE VIEW yt_system_health_overview AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    AVG(login_success_rate) as avg_login_success_rate,
    AVG(avg_response_time) as avg_response_time,
    AVG(trial_conversion_rate) as avg_trial_conversion_rate,
    AVG(memory_usage) as avg_memory_usage,
    AVG(api_error_rate) as avg_api_error_rate,
    COUNT(*) as data_points
FROM yt_system_metrics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- 创建视图：告警统计
CREATE OR REPLACE VIEW yt_alert_statistics AS
SELECT 
    rule_id,
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN resolved = false THEN 1 END) as active_alerts,
    COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_alerts,
    AVG(CASE WHEN resolved = true THEN 
        EXTRACT(EPOCH FROM (resolved_at - created_at))/60 
    END) as avg_resolution_time_minutes,
    MAX(created_at) as last_triggered
FROM yt_system_alerts
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY rule_id
ORDER BY total_alerts DESC;

-- 添加注释
COMMENT ON TABLE yt_system_metrics IS '系统性能指标记录表';
COMMENT ON TABLE yt_system_alerts IS '系统告警记录表';
COMMENT ON TABLE yt_alert_rules IS '告警规则配置表';
COMMENT ON TABLE yt_monitoring_config IS '监控系统配置表';
COMMENT ON TABLE yt_performance_baselines IS '性能基准配置表';

COMMENT ON COLUMN yt_system_metrics.login_success_rate IS '登录成功率(%)';
COMMENT ON COLUMN yt_system_metrics.avg_response_time IS 'API平均响应时间(ms)';
COMMENT ON COLUMN yt_system_metrics.trial_conversion_rate IS '试用转化率(%)';
COMMENT ON COLUMN yt_system_metrics.memory_usage IS '内存使用率(%)';

COMMENT ON COLUMN yt_system_alerts.severity IS '告警严重程度: low, medium, high, critical';
COMMENT ON COLUMN yt_system_alerts.context IS '告警上下文信息(JSON)';

COMMENT ON FUNCTION cleanup_old_monitoring_data() IS '清理过期的监控数据';
COMMENT ON VIEW yt_system_health_overview IS '系统健康状况概览(按小时聚合)';
COMMENT ON VIEW yt_alert_statistics IS '告警统计信息(最近7天)';