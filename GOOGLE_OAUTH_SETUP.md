# Google OAuth Setup Guide for TribeUp

This guide will help you set up Google OAuth authentication for your TribeUp Sports Platform.

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
   - Authorized redirect URIs:
     - `https://alegufnopsminqcokelr.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback` (for development)

6. **Copy Credentials**
   - Copy the Client ID and Client Secret
   - Keep these secure!

## Step 2: Configure Supabase

1. **Set OAuth Credentials in Supabase**
   ```bash
   # Method 1: Using Supabase CLI
   supabase secrets set --project-ref alegufnopsminqcokelr GOOGLE_CLIENT_ID=your_actual_client_id
   supabase secrets set --project-ref alegufnopsminqcokelr GOOGLE_CLIENT_SECRET=your_actual_client_secret
   
   # Method 2: Using Supabase Dashboard
   # Go to Settings → Auth → External OAuth Providers → Google
   # Enable Google and add your Client ID and Secret
   ```

2. **Configure Supabase Auth Settings**
   - Go to Supabase Dashboard → Authentication → Settings
   - Site URL: `http://localhost:5173` (development) or your production URL
   - Redirect URLs:
     - `http://localhost:5173/auth/callback`
     - `https://yourdomain.com/auth/callback` (production)

## Step 3: Update Environment Variables

Create or update your `.env.oauth` file with actual values:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
```

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

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review Supabase authentication documentation
3. Check Google OAuth 2.0 documentation
4. Verify all configuration steps are completed correctly
