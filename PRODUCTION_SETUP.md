# TribeUp Production Environment Setup Guide

## 🚀 Pre-Launch Checklist

This guide covers all steps required to deploy TribeUp to production. Complete each section before launching.

---

## 1. Database Schema Setup (BLOCKING)

### Step 1.1: Verify Database Schema

Before deploying, ensure your production database has all required columns. The most critical missing column is `status` in `game_participants`.

**Run this SQL in your Supabase SQL Editor to check:**

```sql
-- Check if status column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'game_participants'
  AND column_name = 'status';
```

**If the column doesn't exist, run this migration:**

```sql
-- Add missing columns to game_participants table
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'status' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN status TEXT DEFAULT 'joined' 
        CHECK (status IN ('joined', 'left', 'completed', 'no_show'));
        
        -- Update existing records
        UPDATE public.game_participants 
        SET status = 'joined' 
        WHERE status IS NULL;
    END IF;
    
    -- Add other missing columns if needed
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'joined_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
        
        UPDATE public.game_participants 
        SET joined_at = COALESCE(created_at, NOW()) 
        WHERE joined_at IS NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'left_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN left_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'play_time_minutes' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN play_time_minutes INTEGER DEFAULT 0;
    END IF;
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_game_participants_status 
    ON public.game_participants(status);
    
    CREATE INDEX IF NOT EXISTS idx_game_participants_joined_at 
    ON public.game_participants(joined_at);
END $$;
```

### Step 1.2: Apply All Migrations

If using Supabase CLI:

```bash
# Link to your production project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

Or manually apply migrations in order from `supabase/migrations/` directory.

### Step 1.3: Verify Schema

Run this verification query:

```sql
-- Verify all required columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'game_participants'
ORDER BY ordinal_position;
```

**Expected columns:**
- `id` (uuid)
- `game_id` (uuid)
- `user_id` (uuid)
- `status` (text) ✅ **CRITICAL**
- `joined_at` (timestamptz)
- `left_at` (timestamptz)
- `play_time_minutes` (integer)
- `rating` (numeric, nullable)
- `review` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

## 2. Environment Variables (BLOCKING)

### Step 2.1: Required Environment Variables

Set these in your production hosting platform (Vercel, Netlify, etc.):

#### **Required (Blocking)**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# App Configuration
VITE_APP_URL=https://your-production-domain.com
```

#### **Recommended (High Priority)**
```bash
# Weather API (for weather features)
VITE_OPENWEATHER_API_KEY=your_openweather_api_key

# Google Maps (for map features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Push Notifications (optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

#### **Optional Configuration**
```bash
# Weather Settings
VITE_WEATHER_TEMP_UNIT=fahrenheit  # or celsius
VITE_WEATHER_UPDATE_INTERVAL=3600  # seconds
VITE_WEATHER_RAIN_THRESHOLD=0.1    # inches
VITE_WEATHER_WIND_THRESHOLD=15     # mph

# Timeouts
VITE_PROFILE_CHECK_TIMEOUT=5000
VITE_PRESENCE_HEARTBEAT_INTERVAL=30000

# Business Rules
VITE_GAME_EDIT_RESTRICTION_HOURS=2
VITE_GAME_DELETION_RESTRICTION_HOURS=4

# Development
VITE_LOG_LEVEL=info  # debug, info, warn, error
```

### Step 2.2: Vercel Setup

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add each variable for **Production** environment
4. Redeploy after adding variables

### Step 2.3: Verify Environment Variables

After deployment, check the browser console for:
- ✅ No "Missing Supabase environment variables" errors
- ✅ No "VITE_SUPABASE_URL is required" errors
- ✅ App connects to Supabase successfully

---

## 3. Supabase Production Configuration

### Step 3.1: Enable Real-time

1. Go to **Database** → **Replication** in Supabase dashboard
2. Ensure these tables have replication enabled:
   - ✅ `games`
   - ✅ `game_participants`
   - ✅ `chat_messages`
   - ✅ `notifications`

### Step 3.2: Configure Authentication

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain: `https://your-production-domain.com`
3. Add **Redirect URLs**:
   - `https://your-production-domain.com/auth/callback`
   - `https://your-production-domain.com/**`

### Step 3.3: Configure OAuth Providers

If using Google OAuth:
1. Go to **Authentication** → **Providers** → **Google**
2. Add authorized redirect URIs:
   - `https://your-production-domain.com/auth/callback`
3. Update OAuth consent screen in Google Cloud Console

### Step 3.4: Enable Database Backups

1. Go to **Database** → **Backups**
2. Enable **Point-in-time Recovery** (recommended)
3. Set up **Scheduled Backups** (daily recommended)

### Step 3.5: Configure Row Level Security

Verify RLS is enabled on all tables:
- `users`
- `games`
- `game_participants`
- `chat_messages`
- `notifications`

Run this query to check:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'games', 'game_participants', 'chat_messages', 'notifications');
```

All should show `rowsecurity = true`.

---

## 4. Frontend Deployment

### Step 4.1: Build for Production

```bash
# Install dependencies
npm install

# Build production bundle
npm run build
```

### Step 4.2: Verify Build

Check the `build/` directory contains:
- `index.html`
- `assets/` folder with JS/CSS files
- `manifest.json`
- Service worker files

### Step 4.3: Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`
4. Add environment variables (see Step 2)
5. Deploy

### Step 4.4: Configure Custom Domain

1. In Vercel, go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `VITE_APP_URL` environment variable

---

## 5. Post-Deployment Verification

### Step 5.1: Smoke Tests

Run these tests on production:

- [ ] App loads without errors
- [ ] User can sign up
- [ ] User can sign in
- [ ] User can create a game
- [ ] User can join a game
- [ ] Real-time updates work (see REALTIME_TESTING.md)
- [ ] Chat messages send/receive
- [ ] Notifications appear

### Step 5.2: Performance Check

- [ ] Page load time < 3 seconds
- [ ] No console errors
- [ ] Images load correctly
- [ ] Maps render properly
- [ ] Service worker registers

### Step 5.3: Security Check

- [ ] HTTPS enabled
- [ ] No sensitive data in client-side code
- [ ] RLS policies working (test with different users)
- [ ] OAuth redirects work correctly

---

## 6. Monitoring & Analytics

### Step 6.1: Set Up Error Monitoring

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Supabase Analytics for database monitoring

### Step 6.2: Set Up Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- Vercel Analytics (built-in)

### Step 6.3: Database Monitoring

In Supabase dashboard:
- Monitor **Database** → **Reports** for slow queries
- Set up alerts for high error rates
- Monitor connection pool usage

---

## 7. Launch Checklist

Before going live, verify:

### Database
- [ ] All migrations applied
- [ ] `status` column exists in `game_participants`
- [ ] RLS enabled on all tables
- [ ] Real-time enabled on required tables
- [ ] Backups configured

### Environment
- [ ] All required environment variables set
- [ ] Production Supabase URL configured
- [ ] `VITE_APP_URL` set to production domain
- [ ] OAuth redirect URIs configured

### Frontend
- [ ] Production build successful
- [ ] Deployed to hosting platform
- [ ] Custom domain configured
- [ ] HTTPS enabled

### Testing
- [ ] Basic user flows tested (see USER_TESTING_CHECKLIST.md)
- [ ] Real-time features tested (see REALTIME_TESTING.md)
- [ ] Mobile devices tested
- [ ] Cross-browser compatibility verified

### Monitoring
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Uptime monitoring active

---

## 🆘 Troubleshooting

### Issue: "Column 'status' does not exist"

**Solution**: Run the migration from Step 1.1

### Issue: Real-time not working

**Solution**: 
1. Check Replication settings in Supabase
2. Verify tables are added to `supabase_realtime` publication
3. Check browser console for WebSocket errors

### Issue: OAuth redirect not working

**Solution**:
1. Verify redirect URIs in Supabase match production domain
2. Check `VITE_APP_URL` environment variable
3. Ensure HTTPS is enabled

### Issue: Environment variables not loading

**Solution**:
1. Restart Vercel deployment after adding variables
2. Verify variable names start with `VITE_`
3. Check build logs for variable injection

---

## 📞 Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [TribeUp Developer Guide](./src/DEVELOPER_GUIDE.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)

---

## ✅ Success Criteria

Your production environment is ready when:
- ✅ All database migrations applied
- ✅ All environment variables configured
- ✅ App deploys without errors
- ✅ Users can sign up and authenticate
- ✅ Games can be created and joined
- ✅ Real-time features work
- ✅ No blocking console errors

**Once all items are checked, you're ready to launch! 🚀**

