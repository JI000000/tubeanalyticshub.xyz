import createMiddleware from 'next-intl/middleware';
import { withAuth } from 'next-auth/middleware';
import { locales, defaultLocale } from './src/i18n/config';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // Always use locale prefix
  localePrefix: 'always'
});

export default withAuth(
  function middleware(req: NextRequest) {
    // Run the internationalization middleware
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages and API routes
        if (req.nextUrl.pathname.startsWith('/api/auth') || 
            req.nextUrl.pathname.startsWith('/api/trial') ||
            req.nextUrl.pathname.startsWith('/api/health')) {
          return true;
        }
        
        // Allow access to public pages and test pages
        const publicPages = [
          '/',
          '/auth/signin',
          '/auth/error',
          '/about',
          '/privacy',
          '/terms',
        ];
        
        // Allow test pages in development
        const testPages = process.env.NODE_ENV === 'development' ? [
          '/test-smart-auth',
          '/test-smart-modal',
          '/test-trial',
          '/test-trial-api',
          '/test-trial-status',
          '/test-fingerprint',
          '/test-social-buttons',
          '/test-login-integration',
          '/test-feature-access',
          '/test-user-sync',
          '/test-session-manager',
          '/test-session-simple',
          '/test-mobile-login',
          '/test-error-handling',
          '/test-login-analytics',
        ] : [];
        
        const allowedPages = [...publicPages, ...testPages];
        
        const isAllowedPage = allowedPages.some(page => 
          req.nextUrl.pathname === page || 
          req.nextUrl.pathname.startsWith(`/${locales[0]}${page}`) ||
          req.nextUrl.pathname.startsWith(`/${locales[1]}${page}`)
        );
        
        if (isAllowedPage) {
          return true;
        }
        
        // For the smart login system, we allow access to all pages
        // The authentication will be handled by the SmartAuth system
        // which can show login modals when needed instead of redirecting
        return true;
      },
    },
  }
);

export const config = {
  // Match only internationalized pathnames and auth routes
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    // - … API routes that don't need auth
    '/((?!_next|_vercel|.*\\..*).*)',
    '/api/auth/:path*'
  ]
};