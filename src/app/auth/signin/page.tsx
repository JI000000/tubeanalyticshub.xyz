import { getServerAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/auth/signin-form'

export default async function SignInPage() {
  const session = await getServerAuthSession()
  
  // If user is already signed in, redirect to home
  if (session) {
    redirect('/')
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Continue with your preferred method
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}