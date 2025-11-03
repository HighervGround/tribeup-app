# OAuth Domain Configuration - Implementation Summary

## What Was Changed

Your TribeUp app has been configured to use your production domain for all OAuth flows, ensuring Google displays "Continue to TribeUp" with your domain instead of the Supabase project URL.

## Changes Made

### 1. Environment Configuration (`src/core/config/`)

**File: `envConfig.ts`**
- Added `appUrl: string` to `EnvConfig` interface
- Added loading logic to read `VITE_APP_URL` from environment or fallback to `window.location.origin`

**File: `envUtils.ts`**
- Added `APP_URL` getter with smart fallback logic
- Added to debug logging for troubleshooting

### 2. Supabase Client (`src/core/database/supabase.ts`)

- Added logging to show which app URL is being used for OAuth
- Client now logs: `🌐 App URL for OAuth: https://yourdomain.com`

### 3. Authentication Components

**File: `login-form.tsx`**
- Updated `handleSocialLogin` to use `env.APP_URL` instead of `window.location.origin`
- Added debug logging: `🔐 Starting OAuth flow with redirect: ...`

**File: `SimpleAuthProvider.tsx`**
- Updated `signInWithOAuth` to use `env.APP_URL`
- Consistent redirect URL across all auth flows

**File: `AuthProvider.tsx`**
- Updated `signInWithOAuth` to use `env.APP_URL`
- Updated `resetPassword` to use `env.APP_URL`
- Enhanced debug logging for OAuth flows

### 4. Documentation

**File: `GOOGLE_OAUTH_SETUP.md`**
- Added comprehensive Step 0: Configure Your Production Domain
- Explained why `VITE_APP_URL` is critical
- Added setup instructions for Vercel, Netlify, and other platforms
- Added verification checklist
- Added troubleshooting section with success indicators

## How It Works

### The OAuth Flow

```
1. User visits: https://yourdomain.com
2. Clicks "Continue with Google"
3. App initiates OAuth with redirectTo: https://yourdomain.com/auth/callback
4. Google sees origin: https://yourdomain.com (from Supabase Site URL)
5. Google displays: "Continue to TribeUp" with yourdomain.com
6. After auth, redirects to: https://yourdomain.com/auth/callback
7. User is authenticated ✅
```

### Environment Variable Logic

```typescript
// Priority order:
1. VITE_APP_URL environment variable (if set)
2. window.location.origin (if in browser)
3. http://localhost:5173 (fallback)
```

This means:
- **Development**: Works automatically with `localhost:5173`
- **Production**: Uses your configured domain from environment
- **Staging**: Can use staging domain via environment variable

## Setup Checklist

To get Google OAuth showing your domain:

- [ ] Set `VITE_APP_URL` environment variable to your production domain
  - Example: `VITE_APP_URL=https://tribeup.app`
  - For Vercel: Project Settings → Environment Variables
  - For Netlify: Site Settings → Environment Variables

- [ ] Configure Supabase Site URL to match your `VITE_APP_URL`
  - Go to: Supabase Dashboard → Authentication → Settings
  - Set Site URL: `https://yourdomain.com`

- [ ] Add redirect URIs to Google OAuth Console
  - `https://alegufnopsminqcokelr.supabase.co/auth/v1/callback`
  - `https://yourdomain.com/auth/callback`

- [ ] Add redirect URLs to Supabase
  - `https://yourdomain.com/**`
  - `https://yourdomain.com/auth/callback`

- [ ] Deploy and test!

## Testing

### Local Development

```bash
# 1. Start dev server
npm run dev

# 2. Open browser console
# 3. Click "Continue with Google"
# 4. Look for these logs:
🌐 App URL for OAuth: http://localhost:5173
🔐 Starting OAuth flow with redirect: http://localhost:5173/auth/callback
```

### Production

```bash
# 1. Set VITE_APP_URL in your hosting platform
# 2. Deploy your app
# 3. Test OAuth flow
# 4. Verify Google shows:
"Continue to TribeUp"
yourdomain.com
```

## Environment Variable Examples

### For Local Development

```bash
# .env file
VITE_APP_URL=http://localhost:5173
VITE_SUPABASE_URL=https://alegufnopsminqcokelr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### For Production (Vercel)

```bash
# Vercel Environment Variables
VITE_APP_URL=https://tribeup.app
VITE_SUPABASE_URL=https://alegufnopsminqcokelr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### For Staging

```bash
# Staging Environment Variables
VITE_APP_URL=https://staging.tribeup.app
VITE_SUPABASE_URL=https://alegufnopsminqcokelr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Troubleshooting

### Google Still Shows Supabase URL

**Issue**: Google account chooser shows Supabase project URL instead of your domain.

**Solutions**:
1. Verify `VITE_APP_URL` is set correctly in environment
2. Check Supabase Site URL matches your `VITE_APP_URL` exactly
3. Clear browser cache and cookies
4. Try OAuth flow in incognito/private browsing
5. Check browser console for OAuth debug logs

### Redirect URI Mismatch Error

**Issue**: Google OAuth returns "redirect_uri_mismatch" error.

**Solutions**:
1. Add `https://alegufnopsminqcokelr.supabase.co/auth/v1/callback` to Google Console
2. Add `https://yourdomain.com/auth/callback` to Google Console
3. Ensure no trailing slashes in redirect URIs
4. Wait 5-10 minutes after adding new URIs (Google caching)

### Session Not Persisting

**Issue**: User gets logged out immediately after OAuth.

**Solutions**:
1. Check Supabase redirect URLs include your domain with wildcard
2. Add `https://yourdomain.com/**` to Supabase redirect URLs
3. Verify cookies are not being blocked by browser
4. Check CORS configuration in Supabase

## Success Indicators

When everything is configured correctly, you should see:

### Browser Console
```
🌐 App URL for OAuth: https://yourdomain.com
🔐 Starting OAuth flow with redirect: https://yourdomain.com/auth/callback
✅ OAuth redirect initiated for google
```

### Google Account Chooser
```
┌─────────────────────────────┐
│  Continue to TribeUp        │
│  yourdomain.com             │
│                             │
│  [Your Google Account]      │
└─────────────────────────────┘
```

### Network Tab
- OAuth initiation URL includes `redirect_uri=https://yourdomain.com/auth/callback`
- Referrer header shows your domain, not Supabase
- Redirect chain goes through your domain

## Additional Resources

- **Full Setup Guide**: See `GOOGLE_OAUTH_SETUP.md`
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2

## Support

If you encounter issues:
1. Check browser console for debug logs (🔐 and 🌐 emojis)
2. Verify all checklist items above
3. Review `GOOGLE_OAUTH_SETUP.md` for detailed instructions
4. Check Supabase logs for authentication errors
5. Test in incognito mode to rule out cache issues

---

**Result**: Your users will now see "Continue to TribeUp" with your branded domain throughout the entire Google OAuth flow! 🎉

