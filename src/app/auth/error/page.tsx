import Link from 'next/link'

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error
  
  const getErrorMessage = (error: string | undefined) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.'
      case 'OAuthCallback':
        return 'Error in handling the response from an OAuth provider.'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account in the database.'
      case 'EmailCreateAccount':
        return 'Could not create email account in the database.'
      case 'Callback':
        return 'Error in the OAuth callback handler route.'
      case 'OAuthAccountNotLinked':
        return 'The email on the account is already linked, but not with this OAuth account.'
      case 'EmailSignin':
        return 'Sending the e-mail with the verification token failed.'
      case 'CredentialsSignin':
        return 'The authorize callback returned null in the Credentials provider.'
      case 'SessionRequired':
        return 'The content of this page requires you to be signed in at all times.'
      default:
        return 'An unexpected error occurred during authentication.'
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {getErrorMessage(error)}
            </p>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Try signing in again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}