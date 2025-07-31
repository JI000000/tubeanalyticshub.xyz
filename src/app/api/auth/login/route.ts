import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 简单的演示登录逻辑
    // 在生产环境中应该使用Supabase Auth或其他安全的认证方案
    
    // 检查用户是否存在
    const { data: user, error: userError } = await supabase
      .from('yt_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      // 如果用户不存在，创建一个新用户（演示用）
      const { data: newUser, error: createError } = await supabase
        .from('yt_users')
        .insert({
          email: email.toLowerCase(),
          plan: 'free',
          quota_used: 0,
          quota_limit: 50,
          preferences: {
            language: 'zh-CN',
            theme: 'light',
            notifications: true
          }
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // 生成简单的会话令牌（演示用）
      const sessionToken = generateSessionToken(newUser.id);

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            plan: newUser.plan,
            quota_used: newUser.quota_used,
            quota_limit: newUser.quota_limit,
            preferences: newUser.preferences
          },
          session: {
            token: sessionToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天
          }
        },
        message: 'User created and logged in successfully'
      });
    }

    // 用户存在，生成会话令牌
    const sessionToken = generateSessionToken(user.id);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan,
          quota_used: user.quota_used,
          quota_limit: user.quota_limit,
          preferences: user.preferences
        },
        session: {
          token: sessionToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

// 生成会话令牌的辅助函数（演示用）
function generateSessionToken(userId: string): string {
  const payload = {
    userId,
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(2)
  };
  
  // 在生产环境中应该使用JWT或其他安全的令牌生成方法
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}