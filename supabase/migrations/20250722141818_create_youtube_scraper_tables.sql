-- YouTube Scraper Database Schema
-- 所有表使用 yt_ 前缀以避免与其他项目冲突

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS yt_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    quota_used INTEGER DEFAULT 0,
    quota_limit INTEGER DEFAULT 1000,
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

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_yt_videos_channel_id ON yt_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_user_id ON yt_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_published_at ON yt_videos(published_at);
CREATE INDEX IF NOT EXISTS idx_yt_comments_video_id ON yt_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_yt_scraping_tasks_user_id ON yt_scraping_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_yt_scraping_tasks_status ON yt_scraping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_yt_channels_user_id ON yt_channels(user_id);

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

-- 插入示例数据（开发环境）
INSERT INTO yt_users (id, email, plan, quota_limit) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'free', 1000)
ON CONFLICT (id) DO NOTHING;