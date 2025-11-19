# OAuth Domain Configuration - Quick Start Guide

## ✅ What Was Done

Your TribeUp app has been configured to properly initialize Supabase with your production domain, ensuring Google OAuth displays your brand instead of the Supabase project URL.

## 🎯 Key Changes

### Code Updates
- ✅ Added `VITE_APP_URL` environment variable support
- ✅ Updated all OAuth flows to use your configured domain
- ✅ Added debug logging for troubleshooting
- ✅ Updated password reset flows for consistency

### Files Modified
- `src/core/config/envConfig.ts` - Added app URL configuration
- `src/core/config/envUtils.ts` - Added APP_URL getter
- `src/core/database/supabase.ts` - Added OAuth logging
- `src/core/auth/login-form.tsx` - Uses configured domain
- `src/core/auth/SimpleAuthProvider.tsx` - Uses configured domain
- `src/core/auth/AuthProvider.tsx` - Uses configured domain

### Documentation Created
- `GOOGLE_OAUTH_SETUP.md` - Comprehensive OAuth setup guide
- `OAUTH_DOMAIN_SETUP.md` - Implementation details and troubleshooting

## 🚀 What You Need To Do

### Step 1: Set Environment Variable

Add this to your `.env` file (local development):
```bash
VITE_APP_URL=http://localhost:5173
```

For **production**, set in your hosting platform:

**Vercel:**
```
Project Settings → Environment Variables
Name: VITE_APP_URL
Value: https://yourdomain.com
```

**Netlify:**
```
Site Settings → Environment Variables
Key: VITE_APP_URL
Value: https://yourdomain.com
```

### Step 2: Configure Supabase Site URL

**CRITICAL:** This must match your `VITE_APP_URL`!

1. Go to: https://supabase.com/dashboard
2. Select your project: `alegufnopsminqcokelr`
3. Go to: Authentication → Settings → Site URL
4. Set to: `https://yourdomain.com` (your production domain)
5. Add to Redirect URLs:
   - `https://yourdomain.com/**`
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:5173/**` (for development)

### Step 3: Update Google OAuth Console

Add these redirect URIs to your Google OAuth credentials:

1. Go to: https://console.developers.google.com/
2. Select your project
3. Go to: APIs & Services → Credentials
4. Edit your OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://alegufnopsminqcokelr.supabase.co/auth/v1/callback`
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:5173/auth/callback` (for development)

### Step 4: Test It!

```bash
# 1. Start your dev server
npm run dev

# 2. Open browser console (F12)
# 3. Go to login page
# 4. Click "Continue with Google"
# 5. Look for these logs:
🌐 App URL for OAuth: http://localhost:5173
🔐 Starting OAuth flow with redirect: http://localhost:5173/auth/callback
```

## ✨ Expected Result

### Before (showing Supabase URL):
```
┌──────────────────────────────────┐
│  Continue to                     │
│  alegufnopsminqcokelr.supabase.co│
│                                  │
│  [Google Account]                │
└──────────────────────────────────┘
```

### After (showing YOUR domain):
```
┌──────────────────────────────────┐
│  Continue to TribeUp             │
│  yourdomain.com                  │
│                                  │
│  [Google Account]                │
└──────────────────────────────────┘
```

## 🔍 Verification Checklist

Before deploying to production:

- [ ] `VITE_APP_URL` environment variable is set
- [ ] Supabase Site URL matches `VITE_APP_URL`
- [ ] Google OAuth redirect URIs updated
- [ ] Supabase redirect URLs updated
- [ ] Tested OAuth flow in development
- [ ] Checked browser console for debug logs
- [ ] Deployed to production
- [ ] Tested OAuth flow in production
- [ ] Verified Google shows your domain

## 📚 Additional Documentation

- **Detailed Setup**: `GOOGLE_OAUTH_SETUP.md`
- **Implementation Details**: `OAUTH_DOMAIN_SETUP.md`
- **Troubleshooting**: See both documents above

## 🐛 Common Issues

### Issue: Google still shows Supabase URL

**Solution**: Verify these match exactly:
- `VITE_APP_URL` environment variable
- Supabase Site URL
- Google OAuth redirect URI

### Issue: "redirect_uri_mismatch" error

**Solution**: Add both of these to Google Console:
- `https://alegufnopsminqcokelr.supabase.co/auth/v1/callback`
- `https://yourdomain.com/auth/callback`

### Issue: Can't find environment variable

**Solution**: Make sure it's prefixed with `VITE_` for Vite:
- ✅ Correct: `VITE_APP_URL`
- ❌ Wrong: `APP_URL`

## 🎉 That's It!

Your app is now configured to show your brand and domain throughout the entire Google OAuth flow. When users sign in, they'll see "Continue to TribeUp" with your domain instead of the Supabase project URL.

## 📞 Need Help?

If you encounter issues:
1. Check browser console for debug logs (look for 🔐 emoji)
2. Review `GOOGLE_OAUTH_SETUP.md` for step-by-step instructions
3. Verify all checklist items above are completed
4. Test in incognito mode to rule out cache issues

---

**Questions?** Check the comprehensive setup guides:
- `GOOGLE_OAUTH_SETUP.md` - Full OAuth configuration
- `OAUTH_DOMAIN_SETUP.md` - Technical implementation details

