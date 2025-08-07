import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      provider?: string
      username?: string
      plan?: string
      quota_used?: number
      quota_limit?: number
      preferences?: any
    }
    accessToken?: string
    expires: string
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    provider?: string
    username?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    provider?: string
    username?: string
  }
}