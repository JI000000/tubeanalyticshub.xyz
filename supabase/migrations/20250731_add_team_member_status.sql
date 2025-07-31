-- 添加团队成员状态字段
-- 2025-07-31: Phase 3 团队协作功能完善

-- 添加status字段到yt_team_members表
ALTER TABLE yt_team_members 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'removed'));

-- 更新现有记录的status为active
UPDATE yt_team_members SET status = 'active' WHERE status IS NULL;

-- 创建status字段的索引
CREATE INDEX IF NOT EXISTS idx_yt_team_members_status ON yt_team_members(status);

-- 更新RLS策略以包含status检查
DROP POLICY IF EXISTS "Team members can view teams" ON yt_teams;
CREATE POLICY "Team members can view teams" ON yt_teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Team members can view team members" ON yt_team_members;
CREATE POLICY "Team members can view team members" ON yt_team_members
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Team admins can manage members" ON yt_team_members;
CREATE POLICY "Team admins can manage members" ON yt_team_members
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active' 
            AND (role = 'owner' OR role = 'admin')
        )
    );

DROP POLICY IF EXISTS "Team admins can manage invitations" ON yt_team_invitations;
CREATE POLICY "Team admins can manage invitations" ON yt_team_invitations
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active' 
            AND (role = 'owner' OR role = 'admin')
        )
    );

DROP POLICY IF EXISTS "Team members can manage comments" ON yt_collaboration_comments;
CREATE POLICY "Team members can manage comments" ON yt_collaboration_comments
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM yt_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );