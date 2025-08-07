import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';

// 环境变量检查和获取
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  return key;
};

const getSupabaseServiceKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return key;
};

// 延迟初始化，避免在模块加载时就检查环境变量
let _supabaseUrl: string | null = null;
let _supabaseAnonKey: string | null = null;

const getSupabaseConfig = () => {
  if (!_supabaseUrl || !_supabaseAnonKey) {
    _supabaseUrl = getSupabaseUrl();
    _supabaseAnonKey = getSupabaseAnonKey();
  }
  return { url: _supabaseUrl, key: _supabaseAnonKey };
};

// Client-side Supabase client
export const supabase = (() => {
  try {
    const { url, key } = getSupabaseConfig();
    return createClient(url, key);
  } catch (error) {
    console.warn('Supabase client initialization failed:', error);
    return null;
  }
})();

// Browser client for client components
export const createSupabaseBrowserClient = () => {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key);
};

// Server client for server components and API routes
export const createSupabaseServerClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();
  
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

// Service role client for admin operations
export const createSupabaseServiceClient = () => {
  const serviceRoleKey = getSupabaseServiceKey();
  const { url } = getSupabaseConfig();
  
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Generic createClient function for API routes
export { createSupabaseServiceClient as createClient };