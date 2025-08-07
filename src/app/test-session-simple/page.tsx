'use client'

import { useSession } from 'next-auth/react'
import { useSessionManager } from '@/hooks/useSessionManager'
import { SessionStatusIndicator } from '@/components/auth/SessionStatusIndicator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSessionSimplePage() {
  const { data: session, status } = useSession()
  
  const {
    isExpiring,
    minutesUntilExpiry,
    isRefreshing,
    lastRefresh,
  } = useSessionManager({
    refreshThreshold: 5,
    warningThreshold: 10,
    enableCrossTabSync: true,
  })

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return <div className="p-6">Please sign in to test session management</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Session Management Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Session Status</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionStatusIndicator showDetails={true} />
          
          <div className="mt-4 space-y-2 text-sm">
            <p>Minutes until expiry: {minutesUntilExpiry}</p>
            <p>Is expiring: {isExpiring ? 'Yes' : 'No'}</p>
            <p>Is refreshing: {isRefreshing ? 'Yes' : 'No'}</p>
            <p>Last refresh: {lastRefresh ? lastRefresh.toLocaleString() : 'Never'}</p>
            <p>Session expires: {session?.expires ? new Date(session.expires).toLocaleString() : 'Unknown'}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• The session will show warnings 10 minutes before expiry</p>
          <p>• The session will auto-refresh 5 minutes before expiry</p>
          <p>• A modal will appear 3 minutes before expiry</p>
          <p>• Cross-tab synchronization is enabled</p>
        </CardContent>
      </Card>
    </div>
  )
}