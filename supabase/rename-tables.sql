-- NextAuth表名重命名脚本
-- 将NextAuth相关表名加上yt_前缀，符合团队命名规范

-- ========================================
-- 1. 重命名表
-- ========================================

-- 重命名NextAuth相关表
ALTER TABLE IF EXISTS accounts RENAME TO yt_accounts;
ALTER TABLE IF EXISTS sessions RENAME TO yt_sessions;
ALTER TABLE IF EXISTS users RENAME TO yt_users_auth;
ALTER TABLE IF EXISTS verification_tokens RENAME TO yt_verification_tokens;

-- ========================================
-- 2. 重命名相关索引
-- ========================================

-- 重命名accounts相关索引
ALTER INDEX IF EXISTS idx_accounts_user_id RENAME TO idx_yt_accounts_user_id;
ALTER INDEX IF EXISTS accounts_pkey RENAME TO yt_accounts_pkey;
ALTER INDEX IF EXISTS accounts_provider_provider_account_id_key RENAME TO yt_accounts_provider_provider_account_id_key;

-- 重命名sessions相关索引
ALTER INDEX IF EXISTS idx_sessions_user_id RENAME TO idx_yt_sessions_user_id;
ALTER INDEX IF EXISTS sessions_pkey RENAME TO yt_sessions_pkey;
ALTER INDEX IF EXISTS sessions_session_token_key RENAME TO yt_sessions_session_token_key;

-- 重命名users相关索引
ALTER INDEX IF EXISTS users_pkey RENAME TO yt_users_auth_pkey;
ALTER INDEX IF EXISTS users_email_key RENAME TO yt_users_auth_email_key;

-- 重命名verification_tokens相关索引
ALTER INDEX IF EXISTS verification_tokens_pkey RENAME TO yt_verification_tokens_pkey;
ALTER INDEX IF EXISTS verification_tokens_token_key RENAME TO yt_verification_tokens_token_key;

-- ========================================
-- 3. 重命名触发器
-- ========================================

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS update_accounts_updated_at ON yt_accounts;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON yt_sessions;
DROP TRIGGER IF EXISTS update_users_updated_at ON yt_users_auth;

-- 重新创建触发器
CREATE TRIGGER update_yt_accounts_updated_at 
    BEFORE UPDATE ON yt_accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_sessions_updated_at 
    BEFORE UPDATE ON yt_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_users_auth_updated_at 
    BEFORE UPDATE ON yt_users_auth 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. 启用RLS并创建策略
-- ========================================

-- 启用RLS
ALTER TABLE yt_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_users_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_verification_tokens ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can only access their own accounts" ON yt_accounts
FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can only access their own sessions" ON yt_sessions
FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can only access their own auth data" ON yt_users_auth
FOR ALL USING (auth.uid()::text = id::text);

-- verification_tokens通常不需要RLS，因为它们是临时令牌
CREATE POLICY "Allow all verification tokens" ON yt_verification_tokens
FOR ALL USING (true);

-- ========================================
-- 5. 验证重命名结果
-- ========================================

-- 检查表是否存在
SELECT 'yt_accounts' as table_name, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'yt_accounts') as exists;
SELECT 'yt_sessions' as table_name, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'yt_sessions') as exists;
SELECT 'yt_users_auth' as table_name, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'yt_users_auth') as exists;
SELECT 'yt_verification_tokens' as table_name, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'yt_verification_tokens') as exists;

-- 检查RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename IN ('yt_accounts', 'yt_sessions', 'yt_users_auth', 'yt_verification_tokens');

-- 检查策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('yt_accounts', 'yt_sessions', 'yt_users_auth', 'yt_verification_tokens'); 