-- Add NextAuth.js related fields to yt_users table
ALTER TABLE yt_users ADD COLUMN IF NOT EXISTS nextauth_user_id TEXT;
ALTER TABLE yt_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE yt_users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE yt_users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50);

-- Create index for NextAuth user ID lookup
CREATE INDEX IF NOT EXISTS idx_yt_users_nextauth_id ON yt_users(nextauth_user_id);

-- Create NextAuth.js standard tables (using Supabase adapter schema)
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

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Create indexes for NextAuth tables
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);

-- Create anonymous trials table for tracking trial usage
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
    converted_user_id UUID REFERENCES yt_users(id) ON DELETE SET NULL,
    converted_at TIMESTAMP WITH TIME ZONE
);

-- Create unique index for fingerprint
CREATE UNIQUE INDEX IF NOT EXISTS idx_yt_anonymous_trials_fingerprint 
ON yt_anonymous_trials(fingerprint);
CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_ip ON yt_anonymous_trials(ip_address);
CREATE INDEX IF NOT EXISTS idx_yt_anonymous_trials_converted ON yt_anonymous_trials(converted_user_id);

-- Create login analytics table for tracking authentication events
CREATE TABLE IF NOT EXISTS yt_login_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    user_id TEXT, -- Can be NextAuth user ID or yt_users ID
    event_type VARCHAR(50) NOT NULL, -- 'prompt_shown', 'login_attempt', 'login_success', 'login_failed', 'skip', 'signout'
    trigger_type VARCHAR(50), -- 'trial_exhausted', 'feature_required', 'save_action'
    provider VARCHAR(50), -- 'github', 'google', 'email'
    context JSONB DEFAULT '{}',
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for login analytics
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_event_type ON yt_login_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_trigger_type ON yt_login_analytics(trigger_type);
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_provider ON yt_login_analytics(provider);
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_created_at ON yt_login_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_yt_login_analytics_user_id ON yt_login_analytics(user_id);

-- Add RLS policies for new tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_anonymous_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_login_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for NextAuth tables (allow NextAuth to manage these)
CREATE POLICY "NextAuth can manage accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "NextAuth can manage sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "NextAuth can manage users" ON users FOR ALL USING (true);

-- RLS policies for anonymous trials (public read/write for trial tracking)
CREATE POLICY "Anonymous trials are publicly accessible" ON yt_anonymous_trials FOR ALL USING (true);

-- RLS policies for login analytics (admin access only)
CREATE POLICY "Admin can view login analytics" ON yt_login_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE nextauth_user_id = auth.jwt() ->> 'sub' 
            AND plan IN ('pro', 'enterprise')
        )
    );

CREATE POLICY "System can insert login analytics" ON yt_login_analytics
    FOR INSERT WITH CHECK (true);