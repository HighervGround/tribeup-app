# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email us directly rather than opening a public issue.

## Environment Variables

**Never commit sensitive data to the repository.**

Required environment variables (use `.env.example` as template):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Weather API  
VITE_OPENWEATHER_API_KEY=your_weather_api_key
```

## Security Best Practices

1. **API Keys**: Store all sensitive keys in environment variables
2. **Authentication**: Uses Supabase Auth with row-level security
3. **Input Validation**: All user inputs are validated and sanitized
4. **HTTPS**: All production traffic uses HTTPS
5. **Dependencies**: Regularly updated to patch vulnerabilities

## Database Security

- Row Level Security (RLS) enabled on all tables
- User data is isolated per authenticated user
- Public endpoints have appropriate access controls

## Deployment Security

- Environment variables set in Vercel dashboard
- No sensitive data in build artifacts
- CORS properly configured for production domains
- PostHog API keys
- VAPID keys (private key only - public key is safe)

### 3. Configuration Files
- `supabase/config.toml` - Contains OAuth credentials (uses env vars)
- Any `*secret*.json` or `*credentials*.json` files
- Private keys (`.key`, `.pem`, `.p12` files)

## ✅ Secure Setup Instructions

### For New Developers

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Obtain your own API keys:**
   - **Supabase**: https://supabase.com/dashboard
     - Create a project
     - Copy the URL and anon key from Settings > API
   - **Google Maps**: https://console.cloud.google.com/
     - Enable Places API and Maps JavaScript API
     - Create an API key with proper restrictions
   - **Weather API**: https://www.weatherapi.com/
     - Sign up and get your free API key
   - **PostHog** (optional): https://posthog.com/
     - For analytics and monitoring

3. **Update `.env` with your keys:**
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
   VITE_WEATHERAPI_KEY=your_weather_api_key_here
   ```

4. **Never commit `.env`:**
   - The `.gitignore` is configured to exclude `.env` files
   - Always verify with `git status` before committing

### For Supabase Local Development

1. **Set up environment variables for Supabase CLI:**
   Create environment variables for local development:
   ```bash
   export GOOGLE_CLIENT_ID="your_google_oauth_client_id"
   export GOOGLE_CLIENT_SECRET="your_google_oauth_secret"
   export APPLE_CLIENT_ID="your_apple_client_id"
   export APPLE_CLIENT_SECRET="your_apple_secret"
   ```

2. **These are referenced in `supabase/config.toml`:**
   ```toml
   client_id = "env(GOOGLE_CLIENT_ID)"
   secret = "env(GOOGLE_CLIENT_SECRET)"
   ```

## 🔍 How to Check for Leaked Secrets

### Before Committing
```bash
# Check what you're about to commit
git status
git diff

# Make sure .env is not listed
# If it is, run: git reset .env
```

### Check Git History
```bash
# Search for potential API keys in history
git log --all --full-history -S "AIzaSy" --source --branches --remotes --tags
git log --all --full-history -S "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --source --branches --remotes --tags
```

### If You Accidentally Committed Secrets

1. **Immediately rotate all exposed credentials:**
   - Generate new API keys
   - Update your local `.env` file
   - Update production environment variables

2. **Remove from git history:**
   ```bash
   # WARNING: This rewrites history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (only for branches you control):**
   ```bash
   git push origin --force --all
   ```

## 🛡️ API Key Security Best Practices

### 1. Restrict API Keys
- **Google Maps API**: Restrict by HTTP referrer (your domain)
- **Supabase**: Use Row Level Security (RLS) policies
- **Weather API**: Monitor usage limits

### 2. Use Separate Keys for Development and Production
- Development: Use test/development API keys with limited quotas
- Production: Use separate keys with appropriate rate limits

### 3. Environment Variable Naming
- Client-side (exposed): `VITE_*` prefix
- Server-side (private): No prefix, keep in Supabase secrets or server env

### 4. Monitor Usage
- Set up alerts for unusual API usage
- Regularly check API key usage in dashboards
- Rotate keys periodically

## 📋 Checklist Before Going Public

- [ ] Remove `.env` from git tracking
- [ ] Verify `.env` is in `.gitignore`
- [ ] Remove all hardcoded API keys from source code
- [ ] Sanitize `supabase/config.toml` to use env vars
- [ ] Check git history for any leaked secrets
- [ ] Rotate any previously committed API keys
- [ ] Document setup process in README
- [ ] Add this SECURITY.md to repository
- [ ] Review all configuration files
- [ ] Test that application works with fresh environment setup

## 🚨 Reporting Security Issues

If you discover a security vulnerability, please email the maintainers directly instead of opening a public issue.

## 📚 Additional Resources

- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Supabase Security Guide](https://supabase.com/docs/guides/platform/going-into-prod)
