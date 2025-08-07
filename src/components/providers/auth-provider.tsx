'use client'

import { SessionProvider } from 'next-auth/react'
import { SessionExpiryModal } from '@/components/auth/SessionExpiryModal'
import { Toaster } from 'sonner'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
  session?: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider 
      session={session} 
      refetchInterval={60} // Check every minute for better responsiveness
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {children}
      <SessionExpiryModal 
        autoShowThreshold={3} // Show modal 3 minutes before expiry
        autoRefreshThreshold={1} // Auto-refresh 1 minute before expiry
      />
      <Toaster 
        position="top-right"
        expand={true}
        richColors={true}
        closeButton={true}
      />
    </SessionProvider>
  )
}