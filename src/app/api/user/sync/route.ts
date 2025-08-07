/**
 * 用户数据同步API端点
 * 处理登录后的用户数据同步和初始化
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { 
  initializeNewUser, 
  updateExistingUser, 
  migrateAnonymousTrialData,
  updateUserPreferences,
  getUserFullData,
  updateUserActivity,
  syncUserProfile
} from '@/lib/user-sync';

// POST /api/user/sync - 同步用户数据
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, fingerprint, preferences } = body;

    switch (action) {
      case 'initialize':
        // 初始化用户数据
        const initResult = await initializeNewUser(session);
        
        // 如果提供了指纹，尝试迁移匿名试用数据
        if (initResult.success && fingerprint) {
          const migrationResult = await migrateAnonymousTrialData(
            initResult.userData!.id, 
            fingerprint
          );
          
          return NextResponse.json({
            success: true,
            userData: initResult.userData,
            migration: migrationResult,
          });
        }
        
        return NextResponse.json(initResult);

      case 'full_sync':
        // 执行完整的用户数据同步
        const { performFullUserSync } = await import('@/lib/user-sync');
        const fullSyncResult = await performFullUserSync(session, fingerprint);
        return NextResponse.json(fullSyncResult);

      case 'migrate_trial_data':
        if (!fingerprint) {
          return NextResponse.json(
            { success: false, error: 'Fingerprint required for migration' },
            { status: 400 }
          );
        }
        
        // 获取用户数据
        const userResult = await getUserFullData(session.user.id);
        if (!userResult.success) {
          return NextResponse.json(userResult, { status: 404 });
        }
        
        const migrationResult = await migrateAnonymousTrialData(
          userResult.userData!.id,
          fingerprint
        );
        
        return NextResponse.json(migrationResult);

      case 'update_preferences':
        if (!preferences) {
          return NextResponse.json(
            { success: false, error: 'Preferences required' },
            { status: 400 }
          );
        }
        
        const updateResult = await updateUserPreferences(session.user.id, preferences);
        return NextResponse.json(updateResult);

      case 'update_activity':
        await updateUserActivity(session.user.id);
        return NextResponse.json({ success: true });

      case 'sync_profile':
        const profileSyncResult = await syncUserProfile(session.user.id, {
          name: session.user.name || undefined,
          image: session.user.image || undefined,
          email: session.user.email || undefined,
        });
        return NextResponse.json(profileSyncResult);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in user sync API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/user/sync - 获取用户数据
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userResult = await getUserFullData(session.user.id);
    
    if (!userResult.success) {
      return NextResponse.json(userResult, { status: 404 });
    }

    // 更新用户活动时间
    await updateUserActivity(session.user.id);

    return NextResponse.json(userResult);
  } catch (error) {
    console.error('Error in user sync GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}