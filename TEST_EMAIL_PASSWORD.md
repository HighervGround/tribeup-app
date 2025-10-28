# Testing Email/Password Authentication Locally

## Quick Setup

1. **Start the dev server:**
```bash
npm run dev
```

2. **Verify your .env file has:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. **Make sure Supabase Auth Settings allow localhost:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Ensure these redirect URLs are added:
     - `http://localhost:5173/auth/callback`
     - `http://127.0.0.1:5173/auth/callback`
     - `http://localhost:3000/auth/callback` (if using port 3000)

4. **Test sign-up:**
   - Navigate to `http://localhost:5173/login`
   - Click "Continue with Email"
   - Enter email and password
   - Test both sign-up and sign-in

## Debugging Tips

If authentication fails:

1. **Check browser console** for errors
2. **Check Network tab** - look for failed requests to Supabase
3. **Verify environment variables** are loaded:
   ```bash
   node -e "console.log(process.env)" | grep SUPABASE
   ```
4. **Test Supabase connection directly:**
   ```bash
   node test-connection.js
   ```

## Common Issues

- **CORS errors**: Make sure localhost URLs are in Supabase allowed redirect URLs
- **"Invalid credentials"**: Check if user exists or email confirmation is required
- **Redirect loops**: Verify auth callback route exists at `/auth/callback`

