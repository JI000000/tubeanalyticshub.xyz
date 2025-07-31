import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  plan: string;
  quota_used: number;
  quota_limit: number;
  preferences: any;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // 检查本地存储的认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setAuthState({ user: null, loading: false, error: null });
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (result.success) {
          setAuthState({
            user: result.data.user,
            loading: false,
            error: null
          });
        } else {
          // 令牌无效，清除本地存储
          localStorage.removeItem('auth_token');
          setAuthState({ user: null, loading: false, error: null });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState({ user: null, loading: false, error: 'Authentication check failed' });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string = 'demo') => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success) {
        // 保存令牌到本地存储
        localStorage.setItem('auth_token', result.data.session.token);
        
        setAuthState({
          user: result.data.user,
          loading: false,
          error: null
        });

        return { success: true, user: result.data.user };
      } else {
        setAuthState(prev => ({ ...prev, loading: false, error: result.error }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Login failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setAuthState({ user: null, loading: false, error: null });
  };

  const updateUser = async (updates: Partial<User>) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          user: result.data.user
        }));
        return { success: true, user: result.data.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Update failed' };
    }
  };

  // 获取当前用户ID（用于API调用）
  const getUserId = () => {
    return authState.user?.id || '00000000-0000-0000-0000-000000000001'; // 演示用默认ID
  };

  // 获取认证头（用于API调用）
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    login,
    logout,
    updateUser,
    getUserId,
    getAuthHeaders
  };
}