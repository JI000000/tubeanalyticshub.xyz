# OAuth Setup Guide

This guide explains how to set up GitHub and Google OAuth applications for the smart login flow.

## GitHub OAuth App Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: `YouTube Analytics Hub` (or your preferred name)
   - **Homepage URL**: 
     - Development: `http://localhost:3000`
     - Production: `https://tubeanalyticshub.xyz`
   - **Application description**: `AI-powered YouTube Analytics Platform`
   - **Authorization callback URL**:
     - Development: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://tubeanalyticshub.xyz/api/auth/callback/github`

4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add the following to your environment files:

**Development (.env.local):**
```bash
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
```

**Production (.env.production):**
```bash
GITHUB_ID=your_github_client_id_production
GITHUB_SECRET=your_github_client_secret_production
```

### 3. GitHub OAuth Scopes

The application will request the following scopes:
- `user:email` - Access to user's email address
- `read:user` - Access to user's basic profile information

## Google OAuth App Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (for user profile access)

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - **App name**: `YouTube Analytics Hub`
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **App domain**: `tubeanalyticshub.xyz` (for production)
   - **Authorized domains**: Add `tubeanalyticshub.xyz`

4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`

5. Add test users (for development)

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure:
   - **Name**: `YouTube Analytics Hub Web Client`
   - **Authorized JavaScript origins**:
     - Development: `http://localhost:3000`
     - Production: `https://tubeanalyticshub.xyz`
   - **Authorized redirect URIs**:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://tubeanalyticshub.xyz/api/auth/callback/google`

5. Copy the **Client ID** and **Client Secret**

### 4. Configure Environment Variables

Add the following to your environment files:

**Development (.env.local):**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Production (.env.production):**
```bash
GOOGLE_CLIENT_ID=your_google_client_id_production
GOOGLE_CLIENT_SECRET=your_google_client_secret_production
```

## Security Considerations

### 1. Environment Variables Security

- Never commit actual OAuth credentials to version control
- Use different OAuth apps for development and production
- Rotate secrets regularly
- Use strong NEXTAUTH_SECRET values

### 2. OAuth App Configuration

- Restrict callback URLs to your actual domains
- Use HTTPS in production
- Regularly review OAuth app permissions
- Monitor OAuth app usage in respective developer consoles

### 3. Callback URL Validation

Ensure your callback URLs match exactly:
- Development: `http://localhost:3000/api/auth/callback/[provider]`
- Production: `https://tubeanalyticshub.xyz/api/auth/callback/[provider]`

## Testing OAuth Setup

### 1. Development Testing

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Trigger the login flow
4. Verify OAuth redirects work correctly
5. Check that user data is received properly

### 2. Production Testing

1. Deploy to production
2. Test OAuth flows on the live domain
3. Verify callback URLs work correctly
4. Test with different user accounts

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**
   - Ensure callback URLs match exactly in OAuth app settings
   - Check for trailing slashes or protocol mismatches

2. **OAuth App Not Found**
   - Verify Client ID and Secret are correct
   - Check environment variable names

3. **Scope Issues**
   - Ensure required scopes are configured in OAuth apps
   - Check OAuth consent screen configuration

4. **CORS Issues**
   - Verify authorized origins are configured correctly
   - Check domain configuration in OAuth apps

### Debug Steps

1. Check browser developer tools for network errors
2. Verify environment variables are loaded correctly
3. Check NextAuth.js debug logs
4. Verify OAuth app configuration in respective developer consoles

## Next Steps

After completing the OAuth setup:

1. Test the authentication flow
2. Implement the NextAuth.js configuration (Task 2)
3. Set up database migrations for NextAuth tables (Task 3)
4. Implement the smart login components

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth](https://supabase.com/docs/guides/auth)