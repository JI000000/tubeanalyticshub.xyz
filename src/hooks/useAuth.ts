'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useCallback, useEffect } from 'react'
import type { Session } from 'next-auth'

// Extended user interface to match existing app expectations
interface User {
  id: string
  email: string
  name?: string | null
  image?: string | null
  provider?: string
  username?: string
  plan?: string
  quota_used?: number
  quota_limit?: number
  preferences?: any
}

export interface AuthHook {
  session: Session | null
  user: User | undefined
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  signIn: (provider?: string, options?: any) => Promise<any>
  signOut: (options?: any) => Promise<any>
  login: (email?: string, password?: string) => Promise<any>
  logout: () => Promise<void>
  getUserId: () => string | null
  getUserProvider: () => string | null
  getAuthHeaders: () => Record<string, string>
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; error?: string; user?: User }>
}

export function useAuth(): AuthHook {
  const { data: session, status } = useSession()
  
  // Transform NextAuth session to match existing app expectations
  const user: User | undefined = session?.user ? {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name,
    image: session.user.image,
    provider: session.user.provider,
    username: session.user.username,
    plan: 'free', // Default plan, will be updated from database
    quota_used: 0, // Will be fetched from database
    quota_limit: 50, // Default limit
    preferences: {},
  } : undefined
  
  const handleSignIn = useCallback(async (provider?: string, options?: any) => {
    return await signIn(provider, options)
  }, [])
  
  const handleSignOut = useCallback(async (options?: any) => {
    return await signOut(options)
  }, [])
  
  // Legacy login method for backward compatibility
  const login = useCallback(async (email?: string, password?: string) => {
    if (email) {
      // For email login, redirect to sign in page
      return await signIn('email', { email, callbackUrl: '/' })
    } else {
      // Default to GitHub login
      return await signIn('github', { callbackUrl: '/' })
    }
  }, [])
  
  // Legacy logout method for backward compatibility
  const logout = useCallback(async () => {
    // Import logout service dynamically to avoid circular dependencies
    const { LogoutService } = await import('@/lib/logout-service');
    await LogoutService.logout(session?.user || null, {
      callbackUrl: '/',
      showConfirmation: false,
      reason: 'user_initiated',
    });
  }, [session])

  // Track login timestamp for session duration calculation
  useEffect(() => {
    if (session?.user?.id && typeof window !== 'undefined') {
      const loginTimestamp = localStorage.getItem('login_timestamp');
      if (!loginTimestamp) {
        localStorage.setItem('login_timestamp', Date.now().toString());
      }
    } else if (!session?.user?.id && typeof window !== 'undefined') {
      // Clear login timestamp when logged out
      localStorage.removeItem('login_timestamp');
    }
  }, [session?.user?.id])
  
  // Add logout method to user object for backward compatibility
  const userWithLogout = user ? { ...user, logout } : undefined
  
  const getUserId = useCallback(() => {
    return session?.user?.id || null
  }, [session])
  
  const getUserProvider = useCallback(() => {
    return session?.user?.provider || null
  }, [session])
  
  // Legacy method for API calls - now returns empty object since we use NextAuth session
  const getAuthHeaders = useCallback(() => {
    // NextAuth handles authentication via cookies, so no need for Authorization header
    return {}
  }, [])
  
  // Update user method - now integrated with user sync
  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      // Update user preferences if provided
      if (updates.preferences) {
        const response = await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update_preferences',
            preferences: updates.preferences,
          }),
        });
        
        const result = await response.json();
        if (!result.success) {
          return { success: false, error: result.error };
        }
      }
      
      return { success: true, user: { ...user, ...updates } as User };
    } catch (error) {
      return { success: false, error: 'Update failed' };
    }
  }, [user])
  
  return {
    session,
    user: userWithLogout,
    isAuthenticated: !!session?.user?.id,
    loading: status === 'loading',
    error: null, // NextAuth handles errors differently
    signIn: handleSignIn,
    signOut: handleSignOut,
    login,
    logout,
    getUserId,
    getUserProvider,
    getAuthHeaders,
    updateUser,
  }
}