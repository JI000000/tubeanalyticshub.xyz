import { AuthProvider } from './auth-provider'
import { getServerAuthSession } from '@/lib/auth'

interface ProvidersProps {
  children: React.ReactNode
}

export async function Providers({ children }: ProvidersProps) {
  const session = await getServerAuthSession()
  
  return (
    <AuthProvider session={session}>
      {children}
    </AuthProvider>
  )
}