# Google OAuth Setup Guide for TribeUp

This guide will help you set up Google OAuth authentication for your TribeUp Sports Platform so that Google displays "Continue to TribeUp" with your domain instead of the Supabase project URL.

## Overview

To ensure Google OAuth shows your app name and domain (not Supabase's):
1. Configure your production domain in environment variables
2. Set the same domain as Site URL in Supabase
3. Add it to Google's authorized redirect URIs
4. The app will automatically use this domain for all OAuth flows

## Step 0: Configure Your Production Domain

**IMPORTANT:** Before setting up Google OAuth, configure your app's production domain.

### Environment Variables Setup

Add this to your `.env` file (or Vercel/deployment environment variables):

```bash
# Your production domain (required for proper OAuth branding)
VITE_APP_URL=https://yourdomain.com

# For local development
# VITE_APP_URL=http://localhost:5173

# Supabase credentials (existing)
VITE_SUPABASE_URL=https://alegufnopsminqcokelr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Why is this important?**
- The `VITE_APP_URL` tells your app which domain to use for OAuth redirects
- This must match the Site URL in Supabase (Step 2)
- This ensures Google sees consistent domain and shows your app name
- Without this, Google will show the Supabase project URL instead

### Deployment Platforms

**Vercel:**
Go to Project Settings → Environment Variables → Add:
- Name: `VITE_APP_URL`
- Value: `https://yourdomain.com` (your production domain)

**Netlify:**
Go to Site Settings → Environment Variables → Add:
- Key: `VITE_APP_URL`
- Value: `https://yourdomain.com`

**Other Platforms:**
Add the environment variable using your platform's standard method.

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.developers.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click "Select a project" → "New Project"
   - Name: "TribeUp Sports Platform"
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google Identity" API

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in required fields:
     - App name: "TribeUp Sports Platform"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email addresses)

5. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "TribeUp Web Client"
   - Authorized redirect URIs (add BOTH):
     - `https://alegufnopsminqcokelr.supabase.co/auth/v1/callback` (Supabase OAuth endpoint)
     - `https://yourdomain.com/auth/callback` (your production app)
     - `http://localhost:5173/auth/callback` (for local development)

6. **Copy Credentials**
   - Copy the Client ID and Client Secret
   - Keep these secure!

## Step 2: Configure Supabase

**CRITICAL:** The Site URL in Supabase MUST match your `VITE_APP_URL` environment variable!

1. **Set OAuth Credentials in Supabase**
   ```bash
   # Method 1: Using Supabase CLI
   supabase secrets set --project-ref alegufnopsminqcokelr GOOGLE_CLIENT_ID=your_actual_client_id
   supabase secrets set --project-ref alegufnopsminqcokelr GOOGLE_CLIENT_SECRET=your_actual_client_secret
   
   # Method 2: Using Supabase Dashboard
   # Go to Settings → Auth → External OAuth Providers → Google
   # Enable Google and add your Client ID and Secret
   ```

2. **Configure Supabase Auth Settings** (THIS IS KEY!)
   - Go to Supabase Dashboard → Authentication → Settings
   - **Site URL:** `https://yourdomain.com` (MUST match your VITE_APP_URL!)
     - For development: `http://localhost:5173`
     - For production: Use your actual domain
   - **Redirect URLs** (add ALL of these):
     - `https://yourdomain.com/auth/callback` (production)
     - `https://yourdomain.com/**` (wildcard for production)
     - `http://localhost:5173/auth/callback` (development)
     - `http://localhost:5173/**` (wildcard for development)

   **Why this matters:**
   - The Site URL is what Google sees as your app's origin
   - When this matches your VITE_APP_URL, Google displays "Continue to TribeUp" with your domain
   - If misconfigured, Google will show the Supabase project URL instead

## Step 3: Verify Configuration

Before testing, verify that everything is aligned:

### Checklist:
- [ ] `VITE_APP_URL` environment variable is set to your production domain
- [ ] Supabase Site URL matches your `VITE_APP_URL` exactly
- [ ] Google OAuth redirect URIs include both:
  - `https://alegufnopsminqcokelr.supabase.co/auth/v1/callback`
  - `https://yourdomain.com/auth/callback`
- [ ] Supabase redirect URLs include `https://yourdomain.com/**`
- [ ] Google OAuth Client ID and Secret are configured in Supabase

### How the Flow Works:

1. User clicks "Continue with Google" in your app at `https://yourdomain.com`
2. App initiates OAuth with `redirectTo: https://yourdomain.com/auth/callback`
3. Google sees the request originates from `https://yourdomain.com` (your Site URL)
4. Google displays: **"Continue to TribeUp"** with `yourdomain.com` shown
5. After authentication, Google redirects to Supabase OAuth endpoint
6. Supabase processes the auth and redirects to `https://yourdomain.com/auth/callback`
7. Your app completes the authentication flow

**Result:** Users see your brand and domain throughout the entire OAuth flow! 🎉

## Step 4: Test the Integration

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test Google Sign-in**
   - Go to `/auth`
   - Click "Google" button
   - Should redirect to Google OAuth
   - After authorization, should redirect back to your app

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" Error**
   - Ensure redirect URIs in Google Console match exactly
   - Check for trailing slashes and http vs https

2. **"OAuth client not found" Error**
   - Verify Client ID is correct in Supabase
   - Check that Google+ API is enabled

3. **"Access blocked" Error**
   - Add your email as a test user in OAuth consent screen
   - Ensure app is in testing mode or published

4. **"Invalid client" Error**
   - Verify Client Secret is correct in Supabase
   - Check that credentials are for the correct project

### Debug Steps:

1. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

2. **Check Browser Console**
   - Look for JavaScript errors
   - Check network requests for failed OAuth calls

3. **Verify Configuration**
   - Ensure all redirect URIs are configured
   - Check that OAuth consent screen is properly set up

## Production Deployment

For production:

1. **Update OAuth Consent Screen**
   - Submit for verification if needed
   - Update to "Production" status

2. **Add Production Redirect URIs**
   - Add your production domain to Google Console
   - Update Supabase redirect URLs

3. **Secure Environment Variables**
   - Use proper secret management
   - Never commit OAuth secrets to version control

## Security Notes

- Keep Client Secret secure and never expose it client-side
- Use HTTPS in production
- Regularly rotate OAuth credentials
- Monitor OAuth usage in Google Console
- Review and limit OAuth scopes to minimum required

## Quick Reference: Domain Configuration

Your app now automatically uses the configured `VITE_APP_URL` for all OAuth flows:

### Files Updated:
- `src/core/config/envConfig.ts` - Added `appUrl` configuration
- `src/core/config/envUtils.ts` - Added `APP_URL` getter
- `src/core/database/supabase.ts` - Uses `APP_URL` in logging
- `src/core/auth/login-form.tsx` - Uses `APP_URL` for OAuth redirects
- `src/core/auth/SimpleAuthProvider.tsx` - Uses `APP_URL` for OAuth redirects
- `src/core/auth/AuthProvider.tsx` - Uses `APP_URL` for OAuth and password reset

### Code Example:

```typescript
// All OAuth calls now use the configured app URL
import { env } from '@/core/config/envUtils';

const redirectUrl = `${env.APP_URL}/auth/callback`;
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectUrl,
  }
});
```

### Environment Variable Priority:

1. If `VITE_APP_URL` is set → uses that domain
2. If not set → falls back to `window.location.origin` (current domain)
3. Server-side fallback → `http://localhost:5173`

This ensures:
- Development: Uses `localhost:5173` automatically
- Production: Uses your configured domain from environment variables
- Staging: Can use staging domain via environment variable

## Support

If you encounter issues:
1. Verify `VITE_APP_URL` matches Supabase Site URL exactly
2. Check that all redirect URIs are configured in Google Console
3. Ensure Supabase redirect URLs include your domain
4. Check browser console for OAuth debug logs (look for 🔐 emoji)
5. Review Supabase authentication documentation
6. Check Google OAuth 2.0 documentation
7. Verify all configuration steps are completed correctly

### Common Success Indicators:

When configured correctly, you should see in browser console:
```
🌐 App URL for OAuth: https://yourdomain.com
🔐 Starting OAuth flow with redirect: https://yourdomain.com/auth/callback
```

And Google will show:
```
Continue to TribeUp
yourdomain.com
```

Instead of showing the Supabase project URL! ✨
