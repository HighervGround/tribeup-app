# TribeUp Environment Variables Reference

This document provides a comprehensive reference for all environment variables used by the TribeUp application.

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values (see [Required Variables](#required-variables) below)

3. Verify your configuration:
   ```bash
   node scripts/verify-env.js
   ```

## Security Best Practices

### ⚠️ Critical Security Rules

1. **Never commit secrets to version control**
   - `.env` files (except `.env.example`) are in `.gitignore`
   - If you accidentally commit secrets, rotate them immediately

2. **Use your deployment platform's secrets management**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site settings → Environment variables
   - Supabase Edge Functions: Dashboard → Edge Functions → Secrets

3. **Separate client and server secrets**
   - Client-side variables (prefixed with `VITE_`) are exposed to the browser
   - Server-side secrets (service role keys, private keys) should NEVER have `VITE_` prefix
   - Use Supabase Edge Functions or server-side APIs for operations requiring secrets

4. **Restrict API keys by domain**
   - Google Maps: Restrict to your domains in Google Cloud Console
   - Supabase: RLS policies protect data even if anon key is exposed

---

## Required Variables

These variables are required for the application to start.

### Supabase Configuration

| Variable | Description | Where to Get | Security |
|----------|-------------|--------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) → Project URL | Public (safe to expose) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) → anon/public key | Public (enforces RLS) |

**Example:**
```bash
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Recommended Variables

These variables enable important features but have fallbacks.

### Application URL

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_URL` | Production URL for OAuth redirects | Auto-detected from `window.location.origin` |

**Important:** Must be set in production for OAuth to work correctly.

```bash
VITE_APP_URL=https://tribeup.app
```

### Google Maps API

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `VITE_GOOGLE_PLACES_API_KEY` | Google Places API key (can be same key) | Same as above |

**Required APIs to enable:**
- Maps JavaScript API
- Places API
- Geocoding API

**Security:** Restrict keys to your domains in the Google Cloud Console.

```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
VITE_GOOGLE_PLACES_API_KEY=AIzaSy...
```

### Weather API

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_OPENWEATHER_API_KEY` | OpenWeatherMap API key | [OpenWeatherMap](https://openweathermap.org/api) |
| `VITE_WEATHERAPI_KEY` | WeatherAPI.com key (alternative) | [WeatherAPI](https://www.weatherapi.com/) |

**Note:** Only one weather API is required. The app tries OpenWeatherMap first, then WeatherAPI.

```bash
VITE_OPENWEATHER_API_KEY=abc123...
```

### Push Notifications

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key for web push | `npx web-push generate-vapid-keys` |

```bash
VITE_VAPID_PUBLIC_KEY=BC4DMZ...
```

---

## Optional Variables

These variables have sensible defaults.

### App Configuration

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `VITE_APP_VERSION` | Application version | `1.0.0` | Semantic version |
| `VITE_ENVIRONMENT` | Environment name | `development` | `development`, `staging`, `production` |
| `VITE_ENABLE_MOCK_DATA` | Enable mock data | `false` | `true`, `false` |
| `VITE_LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |

### Weather Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_WEATHER_TEMP_UNIT` | Temperature unit | `fahrenheit` |
| `VITE_WEATHER_UPDATE_INTERVAL` | Update interval in seconds | `3600` |
| `VITE_WEATHER_INCLUDE_HOURLY` | Include hourly forecast | `true` |
| `VITE_WEATHER_RAIN_THRESHOLD` | Rain alert threshold (inches) | `0.1` |
| `VITE_WEATHER_WIND_THRESHOLD` | Wind alert threshold (mph) | `15` |

### Timeout Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_PROFILE_CHECK_TIMEOUT` | Profile check timeout (ms) | `5000` |
| `VITE_PROFILE_FORCE_TIMEOUT` | Force profile timeout (ms) | `15000` |
| `VITE_PRESENCE_HEARTBEAT_INTERVAL` | Presence heartbeat (ms) | `30000` |
| `VITE_LOCATION_MONITORING_INTERVAL` | Location check interval (ms) | `1800000` |

### Business Rules

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_GAME_EDIT_RESTRICTION_HOURS` | Hours before game when edits are restricted | `2` |
| `VITE_GAME_DELETION_RESTRICTION_HOURS` | Hours before game when deletion is restricted | `4` |

---

## Server-Side Only Variables

⚠️ **These should NEVER be exposed in client-side code. Set them only in:**
- Supabase Dashboard (Auth settings)
- Supabase Edge Functions (Secrets)
- Server-side environment (if using custom backend)

### Supabase Service Role

| Variable | Description | Security |
|----------|-------------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key that bypasses RLS | **NEVER expose to client** |

### OAuth Provider Secrets

Configure these in Supabase Dashboard → Authentication → Providers:

| Provider | Settings Required |
|----------|------------------|
| Google | Client ID, Client Secret, Redirect URI |
| Apple | Services ID, Private Key, Team ID, Key ID |

### Push Notification Private Key

| Variable | Description |
|----------|-------------|
| `VAPID_PRIVATE_KEY` | Private key for server-side push notifications |

---

## Deployment Configuration

### Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable with the appropriate scope:
   - **Production**: For production deployments
   - **Preview**: For PR previews
   - **Development**: For local development (optional)

3. Recommended settings:
   ```
   VITE_SUPABASE_URL       Production, Preview, Development
   VITE_SUPABASE_ANON_KEY  Production, Preview, Development
   VITE_APP_URL            Production only (set to production domain)
   VITE_ENVIRONMENT        Production: "production", Preview: "staging"
   ```

### Netlify

1. Go to Site settings → Environment variables
2. Add variables with deploy context:
   - Production deploy
   - Deploy previews
   - Branch deploys

---

## Verification

### Using the Verification Script

```bash
# Standard check
node scripts/verify-env.js

# Strict mode (fails if recommended vars are missing)
node scripts/verify-env.js --strict
```

### Adding to Build Process

Add to `package.json`:
```json
{
  "scripts": {
    "verify:env": "node scripts/verify-env.js",
    "prebuild": "npm run verify:env"
  }
}
```

---

## Troubleshooting

### "Missing Supabase environment variables" Error

1. Verify `.env` file exists and has correct values
2. Check variable names start with `VITE_`
3. Restart development server after changing `.env`

### OAuth Redirect Not Working

1. Verify `VITE_APP_URL` matches your production domain
2. Check redirect URIs in Supabase Dashboard → Authentication → URL Configuration
3. Ensure HTTPS is enabled for production

### Weather Features Not Working

1. Verify API key is set: `VITE_OPENWEATHER_API_KEY` or `VITE_WEATHERAPI_KEY`
2. Check API key is valid and active
3. Verify API usage limits haven't been exceeded

### Maps Not Loading

1. Verify `VITE_GOOGLE_MAPS_API_KEY` is set
2. Check Google Cloud Console for API errors
3. Ensure required APIs are enabled (Maps JavaScript, Places, Geocoding)
4. Verify domain restrictions match your deployment URL

---

## Related Documentation

- [Production Setup Guide](./PRODUCTION_SETUP.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [OAuth Configuration](./GOOGLE_OAUTH_SETUP.md)
- [Launch Checklist](./LAUNCH_CHECKLIST.md)
