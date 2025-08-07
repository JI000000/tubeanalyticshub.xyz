# Session Management Implementation

## Overview

This implementation provides comprehensive session management and auto-refresh functionality for the smart login flow. It includes client-side session monitoring, automatic refresh, cross-tab synchronization, and user-friendly expiry handling.

## Features Implemented

### 1. NextAuth.js Configuration Enhancement
- **Session Strategy**: JWT-based sessions with 7-day expiry
- **Auto-refresh**: Sessions refresh every hour (updateAge: 60 * 60)
- **Security**: Reduced session duration for better security
- **Enhanced Callbacks**: Extended session data with user profile information

### 2. Client-Side Session Management (`useSessionManager`)
- **Auto-refresh Logic**: Automatically refreshes sessions 5 minutes before expiry
- **Warning System**: Shows warnings 10 minutes before expiry
- **Activity Tracking**: Monitors user activity to determine refresh necessity
- **Cross-tab Sync**: Synchronizes session state across browser tabs
- **Toast Notifications**: User-friendly notifications for session events

### 3. Session Status Components
- **SessionStatusIndicator**: Visual indicator of session status with countdown
- **SessionExpiryModal**: Modal dialog for session expiry warnings
- **Compact Mode**: Minimal session status display for navigation bars

### 4. Server-Side Session Utilities
- **Session Validation**: Server-side session validation with detailed status
- **Activity Logging**: Tracks session activities for analytics
- **Cleanup Utilities**: Automated cleanup of expired sessions
- **Statistics**: Session usage statistics and analytics

### 5. Cross-Tab Synchronization
- **LocalStorage Events**: Uses localStorage for cross-tab communication
- **Visibility API**: Refreshes sessions when tabs become visible
- **Activity Sync**: Synchronizes user activity across tabs

## File Structure

```
src/
├── hooks/
│   └── useSessionManager.ts          # Main session management hook
├── components/
│   ├── auth/
│   │   ├── SessionStatusIndicator.tsx # Session status display
│   │   └── SessionExpiryModal.tsx     # Session expiry modal
│   └── providers/
│       └── auth-provider.tsx          # Enhanced auth provider
├── lib/
│   ├── auth-config.ts                 # NextAuth configuration
│   └── session-manager.ts             # Server-side utilities
└── app/
    ├── api/session/
    │   ├── stats/route.ts             # Session statistics API
    │   ├── expire/route.ts            # Test expiry API
    │   └── cleanup/route.ts           # Session cleanup API
    └── test-session-manager/
        └── page.tsx                   # Test page
```

## Configuration

### Environment Variables
```env
# Session cleanup (optional)
CRON_SECRET=your-cron-secret-for-cleanup

# NextAuth (existing)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### NextAuth.js Settings
```typescript
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60, // 7 days
  updateAge: 60 * 60,        // 1 hour refresh
}
```

### SessionProvider Settings
```typescript
<SessionProvider 
  refetchInterval={60}        // Check every minute
  refetchOnWindowFocus={true} // Refresh on focus
  refetchWhenOffline={false}  // Don't refresh offline
>
```

## Usage Examples

### Basic Session Management
```typescript
import { useSessionManager } from '@/hooks/useSessionManager'

function MyComponent() {
  const {
    session,
    sessionStatus,
    refreshSession,
    isExpiring,
    minutesUntilExpiry,
  } = useSessionManager({
    refreshThreshold: 5,    // Auto-refresh 5 min before expiry
    warningThreshold: 10,   // Warn 10 min before expiry
    enableCrossTabSync: true,
  })

  return (
    <div>
      {isExpiring && (
        <div>Session expires in {minutesUntilExpiry} minutes</div>
      )}
    </div>
  )
}
```

### Session Status Display
```typescript
import { SessionStatusIndicator } from '@/components/auth/SessionStatusIndicator'

function Navigation() {
  return (
    <nav>
      <SessionStatusIndicator 
        compact={true}
        showDetails={false}
      />
    </nav>
  )
}
```

### Server-Side Session Validation
```typescript
import { requireValidSession } from '@/lib/session-manager'

export async function GET() {
  try {
    const session = await requireValidSession()
    // Session is valid, proceed with API logic
    return NextResponse.json({ data: 'success' })
  } catch (error) {
    // Session expired or invalid
    return NextResponse.json(
      { error: 'Session expired' },
      { status: 401 }
    )
  }
}
```

## Session Lifecycle

### 1. Session Creation
- User signs in via OAuth or email
- NextAuth creates JWT token with 7-day expiry
- Session data is enhanced with user profile information
- Login event is logged for analytics

### 2. Active Session Management
- Client checks session status every minute
- Auto-refresh occurs 5 minutes before expiry
- User activity updates activity timestamp
- Cross-tab synchronization keeps all tabs in sync

### 3. Session Warning Phase (10 minutes before expiry)
- Warning toast notification appears
- Session status indicator shows warning state
- User can manually refresh session

### 4. Critical Phase (3 minutes before expiry)
- Session expiry modal appears
- Countdown timer shows remaining time
- Auto-refresh attempts at 1 minute before expiry

### 5. Session Expiry
- Session becomes invalid
- User is redirected to sign-in page
- All session data is cleared
- Expiry event is logged

## Cross-Tab Synchronization

### How It Works
1. **LocalStorage Events**: When a session is refreshed in one tab, it broadcasts to other tabs
2. **Visibility API**: When a tab becomes visible, it checks if session needs refresh
3. **Activity Sync**: User activity in any tab updates the global activity timestamp

### Implementation
```typescript
// Broadcasting session refresh
localStorage.setItem('session-refresh', Date.now().toString())

// Listening for session events
window.addEventListener('storage', (e) => {
  if (e.key === 'session-refresh') {
    // Update session in this tab
    update()
  }
})
```

## Analytics and Monitoring

### Session Events Tracked
- `login_success`: User successfully signs in
- `session_activity`: User performs actions (API calls, page views)
- `session_refresh`: Session is refreshed (manual or automatic)
- `session_warning`: Session expiry warning shown
- `session_expired`: Session expires
- `signout`: User signs out

### Statistics Available
- Total sessions in last 7 days
- Total activities per user
- Most active hours
- Session duration averages
- Refresh success rates

### Database Schema
```sql
-- Session analytics table
CREATE TABLE yt_login_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES yt_users(id),
  event_type VARCHAR(50) NOT NULL,
  provider VARCHAR(50),
  context JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing

### Test Page
Visit `/test-session-manager` to test all session management features:
- View current session status
- Manually refresh session
- Simulate user activity
- Force session expiry (for testing)
- View session statistics

### Test Scenarios
1. **Normal Operation**: Session refreshes automatically before expiry
2. **Cross-Tab Sync**: Open multiple tabs and verify session sync
3. **Warning Display**: Wait for session to approach expiry
4. **Manual Refresh**: Use refresh button during warning phase
5. **Expiry Handling**: Let session expire and verify redirect

## Security Considerations

### Session Security
- JWT tokens are httpOnly and secure
- Sessions expire after 7 days maximum
- Regular refresh prevents token staleness
- Activity tracking helps detect suspicious behavior

### Cross-Tab Security
- LocalStorage events only contain timestamps
- No sensitive session data is stored in localStorage
- Session validation always happens server-side

### API Security
- All session APIs require valid authentication
- Session cleanup endpoint requires authorization header
- Activity logging includes IP address and user agent

## Performance Optimization

### Client-Side
- Session checks run every minute (not every second)
- Debounced activity tracking prevents excessive updates
- Efficient cross-tab communication using storage events

### Server-Side
- Session validation is cached during request lifecycle
- Batch session cleanup runs periodically
- Database queries are optimized with proper indexes

## Troubleshooting

### Common Issues

1. **Session Not Refreshing**
   - Check if `refetchInterval` is set correctly
   - Verify NextAuth configuration
   - Check browser console for errors

2. **Cross-Tab Sync Not Working**
   - Ensure localStorage is available
   - Check if tabs are on same origin
   - Verify storage event listeners are attached

3. **Session Expiry Modal Not Showing**
   - Check if `SessionExpiryModal` is included in app
   - Verify session expiry time calculation
   - Check if modal is being blocked by other UI

### Debug Information
Enable debug mode in NextAuth configuration:
```typescript
debug: process.env.NODE_ENV === 'development'
```

Check browser console for session management logs:
- Session refresh attempts
- Cross-tab synchronization events
- Activity tracking updates
- Warning and expiry events

## Requirements Coverage

This implementation covers all requirements from task 14:

✅ **配置NextAuth.js的会话过期和刷新策略**
- Session maxAge: 7 days, updateAge: 1 hour
- JWT-based strategy with automatic refresh

✅ **实现客户端的会话状态监听和更新**
- `useSessionManager` hook with real-time monitoring
- Minute-by-minute session status checks

✅ **添加会话即将过期时的自动刷新逻辑**
- Auto-refresh 5 minutes before expiry
- Fallback refresh 1 minute before expiry

✅ **创建会话失效时的用户友好提示**
- Toast notifications for all session events
- Modal dialog for critical expiry warnings
- Clear countdown timers and action buttons

✅ **实现跨标签页的会话状态同步**
- LocalStorage-based cross-tab communication
- Visibility API integration for tab focus handling
- Synchronized session refresh across all tabs

All sub-requirements from 需求 5.1, 5.2, 5.3 are fully implemented and tested.