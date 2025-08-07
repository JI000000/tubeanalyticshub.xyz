-- 创建用户反馈系统相关表
-- 用于收集、管理和分析用户反馈

-- 用户反馈主表
CREATE TABLE IF NOT EXISTS yt_user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'bug_report', 'feature_request', 'login_issue', 
        'performance_issue', 'ui_ux_feedback', 'general_feedback'
    )),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new', 'in_review', 'in_progress', 'resolved', 'closed', 'duplicate'
    )),
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    user_agent TEXT,
    url TEXT,
    session_id VARCHAR(255),
    device_info JSONB DEFAULT '{}',
    reproduction_steps TEXT[] DEFAULT '{}',
    expected_behavior TEXT,
    actual_behavior TEXT,
    assigned_to UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    resolution TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 反馈附件表
CREATE TABLE IF NOT EXISTS yt_feedback_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID REFERENCES yt_user_feedback(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'document', 'log')),
    size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 反馈分析事件表
CREATE TABLE IF NOT EXISTS yt_feedback_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 反馈评分表
CREATE TABLE IF NOT EXISTS yt_feedback_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID REFERENCES yt_user_feedback(id) ON DELETE CASCADE,
    user_id UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);-- 创建
索引
CREATE INDEX IF NOT EXISTS idx_yt_user_feedback_user_id ON yt_user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_user_feedback_type ON yt_user_feedback(type);
CREATE INDEX IF NOT EXISTS idx_yt_user_feedback_status ON yt_user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_yt_user_feedback_priority ON yt_user_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_yt_user_feedback_category ON yt_user_feedback(category);
CREATE INDEX IF NOT EXISTS idx_yt_user_feedback_created_at ON yt_user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_yt_user_feedback_assigned_to ON yt_user_feedback(assigned_to);

CREATE INDEX IF NOT EXISTS idx_yt_feedback_attachments_feedback_id ON yt_feedback_attachments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_yt_feedback_attachments_type ON yt_feedback_attachments(type);

CREATE INDEX IF NOT EXISTS idx_yt_feedback_analytics_event_type ON yt_feedback_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_yt_feedback_analytics_created_at ON yt_feedback_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_yt_feedback_ratings_feedback_id ON yt_feedback_ratings(feedback_id);
CREATE INDEX IF NOT EXISTS idx_yt_feedback_ratings_user_id ON yt_feedback_ratings(user_id);

-- 创建更新时间戳的触发器
CREATE TRIGGER update_yt_user_feedback_updated_at
    BEFORE UPDATE ON yt_user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：反馈概览
CREATE OR REPLACE VIEW yt_feedback_overview AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    type,
    status,
    priority,
    COUNT(*) as count,
    AVG(CASE WHEN resolved_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
    END) as avg_resolution_hours
FROM yt_user_feedback
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), type, status, priority
ORDER BY date DESC;

-- 创建视图：反馈统计
CREATE OR REPLACE VIEW yt_feedback_statistics AS
SELECT 
    COUNT(*) as total_feedback,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_feedback,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_feedback,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_feedback,
    COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_feedback,
    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_feedback,
    AVG(CASE WHEN resolved_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
    END) as avg_resolution_hours,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as feedback_24h,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as feedback_7d
FROM yt_user_feedback;

-- 插入示例数据（可选，用于测试）
-- INSERT INTO yt_user_feedback (email, type, title, description, priority) VALUES
-- ('test@example.com', 'bug_report', '登录按钮无响应', '点击GitHub登录按钮后没有任何反应', 'high'),
-- ('user@example.com', 'feature_request', '希望支持暗色主题', '建议添加暗色主题选项以改善夜间使用体验', 'medium'),
-- ('feedback@example.com', 'ui_ux_feedback', '移动端布局问题', '在手机上使用时，登录模态框显示不完整', 'medium');

-- 添加注释
COMMENT ON TABLE yt_user_feedback IS '用户反馈主表';
COMMENT ON TABLE yt_feedback_attachments IS '反馈附件表';
COMMENT ON TABLE yt_feedback_analytics IS '反馈分析事件表';
COMMENT ON TABLE yt_feedback_ratings IS '反馈评分表';

COMMENT ON COLUMN yt_user_feedback.type IS '反馈类型: bug_report, feature_request, login_issue, performance_issue, ui_ux_feedback, general_feedback';
COMMENT ON COLUMN yt_user_feedback.priority IS '优先级: low, medium, high, critical';
COMMENT ON COLUMN yt_user_feedback.status IS '状态: new, in_review, in_progress, resolved, closed, duplicate';
COMMENT ON COLUMN yt_user_feedback.device_info IS '设备信息(JSON格式)';
COMMENT ON COLUMN yt_user_feedback.reproduction_steps IS '重现步骤数组';

COMMENT ON VIEW yt_feedback_overview IS '反馈概览视图(按日期、类型、状态聚合)';
COMMENT ON VIEW yt_feedback_statistics IS '反馈统计视图(总体统计信息)';