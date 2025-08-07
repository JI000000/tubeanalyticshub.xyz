-- RLS (Row Level Security) 管理脚本
-- 用于管理数据库安全策略

-- ========================================
-- 1. 检查RLS状态
-- ========================================

-- 检查所有表的RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'yt_%'
ORDER BY tablename;

-- 检查特定表的RLS状态
SELECT 
    relrowsecurity as rls_enabled,
    relforcerowsecurity as force_rls
FROM pg_class
WHERE relname = 'yt_users';

-- ========================================
-- 2. 启用RLS
-- ========================================

-- 为所有yt_表启用RLS
ALTER TABLE yt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_scraping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_collaboration_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_anonymous_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_login_analytics ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. 创建RLS策略
-- ========================================

-- 用户数据访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_users' AND policyname = 'Users can only access their own data') THEN
        CREATE POLICY "Users can only access their own data" ON yt_users
        FOR ALL USING (auth.uid()::text = id::text);
    END IF;
END $$;

-- 频道数据访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_channels' AND policyname = 'Users can only access their own channels') THEN
        CREATE POLICY "Users can only access their own channels" ON yt_channels
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 视频数据访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_videos' AND policyname = 'Users can only access their own videos') THEN
        CREATE POLICY "Users can only access their own videos" ON yt_videos
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 评论数据访问策略（允许查看所有评论，但只能修改自己的）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_comments' AND policyname = 'Users can view all comments') THEN
        CREATE POLICY "Users can view all comments" ON yt_comments
        FOR SELECT USING (true);
    END IF;
END $$;

-- 采集任务访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_scraping_tasks' AND policyname = 'Users can only access their own tasks') THEN
        CREATE POLICY "Users can only access their own tasks" ON yt_scraping_tasks
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- AI分析结果访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_ai_analysis' AND policyname = 'Users can only access their own analysis') THEN
        CREATE POLICY "Users can only access their own analysis" ON yt_ai_analysis
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 分析数据访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_analytics' AND policyname = 'Users can only access their own analytics') THEN
        CREATE POLICY "Users can only access their own analytics" ON yt_analytics
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 洞察数据访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_insights' AND policyname = 'Users can only access their own insights') THEN
        CREATE POLICY "Users can only access their own insights" ON yt_insights
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 报告数据访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_reports' AND policyname = 'Users can only access their own reports') THEN
        CREATE POLICY "Users can only access their own reports" ON yt_reports
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 仪表板数据访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_dashboards' AND policyname = 'Users can only access their own dashboards') THEN
        CREATE POLICY "Users can only access their own dashboards" ON yt_dashboards
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- AI洞察访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_ai_insights' AND policyname = 'Users can only access their own ai insights') THEN
        CREATE POLICY "Users can only access their own ai insights" ON yt_ai_insights
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 竞争对手分析访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_competitor_analysis' AND policyname = 'Users can only access their own competitor analysis') THEN
        CREATE POLICY "Users can only access their own competitor analysis" ON yt_competitor_analysis
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 团队数据访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_teams' AND policyname = 'Team owners can manage their teams') THEN
        CREATE POLICY "Team owners can manage their teams" ON yt_teams
        FOR ALL USING (auth.uid()::text = owner_id::text);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_teams' AND policyname = 'Team members can view their teams') THEN
        CREATE POLICY "Team members can view their teams" ON yt_teams
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM yt_team_members 
                WHERE team_id = yt_teams.id 
                AND user_id::text = auth.uid()::text
            )
        );
    END IF;
END $$;

-- 团队成员数据访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_team_members' AND policyname = 'Team members can view team membership') THEN
        CREATE POLICY "Team members can view team membership" ON yt_team_members
        FOR SELECT USING (
            user_id::text = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM yt_teams 
                WHERE id = yt_team_members.team_id 
                AND owner_id::text = auth.uid()::text
            )
        );
    END IF;
END $$;

-- 团队邀请访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_team_invitations' AND policyname = 'Team owners can manage invitations') THEN
        CREATE POLICY "Team owners can manage invitations" ON yt_team_invitations
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM yt_teams 
                WHERE id = yt_team_invitations.team_id 
                AND owner_id::text = auth.uid()::text
            )
        );
    END IF;
END $$;

-- 协作评论访问策略
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_collaboration_comments' AND policyname = 'Team members can manage comments') THEN
        CREATE POLICY "Team members can manage comments" ON yt_collaboration_comments
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM yt_team_members 
                WHERE team_id = yt_collaboration_comments.team_id 
                AND user_id::text = auth.uid()::text
            )
        );
    END IF;
END $$;

-- 匿名试用访问策略（基于设备指纹）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_anonymous_trials' AND policyname = 'Anonymous users can access their own trials') THEN
        CREATE POLICY "Anonymous users can access their own trials" ON yt_anonymous_trials
        FOR ALL USING (
            session_id = current_setting('app.session_id', true) OR
            device_fingerprint = current_setting('app.device_fingerprint', true)
        );
    END IF;
END $$;

-- 登录分析访问策略（管理员可查看所有，用户只能查看自己的）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yt_login_analytics' AND policyname = 'Users can view their own login analytics') THEN
        CREATE POLICY "Users can view their own login analytics" ON yt_login_analytics
        FOR SELECT USING (
            auth.uid()::text = user_id::text OR
            EXISTS (
                SELECT 1 FROM yt_users 
                WHERE id::text = auth.uid()::text 
                AND plan = 'enterprise'
            )
        );
    END IF;
END $$;

-- ========================================
-- 4. 查看现有策略
-- ========================================

-- 查看所有RLS策略
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
WHERE schemaname = 'public' 
AND tablename LIKE 'yt_%'
ORDER BY tablename, policyname;

-- 查看特定表的策略
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'yt_users';

-- ========================================
-- 5. 删除策略（如果需要重新创建）
-- ========================================

-- 删除特定表的策略（示例）
-- DROP POLICY IF EXISTS "Users can only access their own data" ON yt_users;

-- 删除所有策略（谨慎使用）
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'yt_%')
--     LOOP
--         EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
--     END LOOP;
-- END $$;

-- ========================================
-- 6. 测试RLS策略
-- ========================================

-- 测试用户数据访问（需要先登录）
-- SELECT * FROM yt_users WHERE id::text = auth.uid()::text;

-- 测试频道数据访问
-- SELECT * FROM yt_channels WHERE user_id::text = auth.uid()::text;

-- 测试团队数据访问
-- SELECT * FROM yt_teams WHERE owner_id::text = auth.uid()::text;

-- ========================================
-- 7. 禁用RLS（如果需要）
-- ========================================

-- 禁用特定表的RLS
-- ALTER TABLE yt_users DISABLE ROW LEVEL SECURITY;

-- 禁用所有yt_表的RLS（谨慎使用）
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'yt_%')
--     LOOP
--         EXECUTE 'ALTER TABLE ' || r.tablename || ' DISABLE ROW LEVEL SECURITY';
--     END LOOP;
-- END $$; 