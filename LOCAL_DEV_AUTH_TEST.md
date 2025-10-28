# Local Development - Email/Password Auth Testing

## Quick Start

1. **Ensure environment variables are set:**
   ```bash
   # Check if .env file exists and has:
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3008` (see vite.config.ts)

3. **Test authentication:**
   - Navigate to `http://localhost:3008/login`
   - Click "Continue with Email"
   - Test sign-up with a new email
   - Test sign-in with existing credentials

## Using Test Script

Test auth from command line:
```bash
# Sign up
node test-auth-local.js test@example.com password123 signup

# Sign in  
node test-auth-local.js test@example.com password123 signin
```

## Supabase Configuration for Localhost

Make sure your Supabase project allows localhost redirects:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add these to "Redirect URLs":
   - `http://localhost:3008/auth/callback`
   - `http://127.0.0.1:3008/auth/callback`
   - `http://localhost:5173/auth/callback` (if using default Vite port)

3. Site URL can be: `http://localhost:3008`

## Debugging

- Open browser DevTools → Console to see auth flow logs
- Check Network tab for failed Supabase requests
- Verify `.env` file is in project root
- Test connection: `node test-connection.js` (if it exists)

## Current Auth Flow

- **Sign Up**: Uses `SupabaseService.signUp()` → Creates auth user → Creates profile via auth listener
- **Sign In**: Uses `SupabaseService.signIn()` → Returns auth user → Profile loaded by SimpleAuthProvider

Both flows should work in local dev if Supabase redirect URLs include localhost.
