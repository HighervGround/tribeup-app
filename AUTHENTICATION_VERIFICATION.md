# Authentication Verification for RLS Queries

## ✅ Client-Side Authentication Setup

### Supabase Client Configuration
The Supabase client is created in `src/lib/supabase.ts` with proper authentication settings:

```typescript
createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Session stored in localStorage
    autoRefreshToken: true,      // Auto-refreshes JWT when needed
    detectSessionInUrl: true,    // Handles OAuth callbacks
    storageKey: 'tribeup-auth', // localStorage key
    flowType: 'pkce',           // PKCE flow for security
    storage: window.localStorage // Browser storage
  }
})
```

### ✅ Automatic JWT Inclusion
**The Supabase JS client automatically includes the JWT token from localStorage in the `Authorization` header for all requests.** This means:
- All `.from()` queries automatically include `Authorization: Bearer <jwt>` header
- RLS policies can access `auth.uid()` and other auth context
- No manual header configuration needed for client-side queries

### ✅ Session Verification in getOtherUserProfile
Added explicit session check before querying:

```typescript
// Verify authenticated session before querying (required for RLS)
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (sessionError || !session) {
  console.error('❌ No authenticated session');
  return null;
}
console.log('✅ Authenticated session confirmed, user:', session.user.id);
```

## 🔍 How to Verify in Browser

### 1. Check Session Exists
Open browser console and run:
```javascript
await window.supabase.auth.getSession()
// Should show: { data: { session: { access_token: "...", user: {...} } }, error: null }
```

### 2. Check Request Headers
In Network tab (F12 → Network):
- Filter by "user_public_profile" or "users"
- Open the request
- Check "Headers" tab
- Verify `Authorization: Bearer <jwt>` header is present

### 3. Test Query Manually
```javascript
// Should work with authenticated session
const { data, error } = await window.supabase
  .from('user_public_profile')
  .select('id, display_name, avatar_url')
  .eq('id', '654fbc89-0211-4c1e-9977-21f42084b918')
  .maybeSingle();
  
console.log('Result:', { data, error });
```

## 🚨 Common Issues

### Issue: "No authenticated session" error
**Cause**: User not logged in or session expired
**Fix**: 
- Ensure user is logged in: `await supabase.auth.getUser()`
- Check localStorage: `localStorage.getItem('tribeup-auth')`
- Re-authenticate if needed

### Issue: RLS policy still blocking despite session
**Cause**: 
- JWT not being forwarded (server-side only)
- Policy condition not matching
**Fix**:
- Verify `Authorization` header in Network tab
- Check RLS policy conditions match your auth context
- Use Supabase dashboard SQL editor to test policy directly

### Issue: Session exists but queries fail
**Cause**: Token expired or invalid
**Fix**:
- Check `session.expires_at` vs current time
- `autoRefreshToken: true` should handle this automatically
- Manually refresh: `await supabase.auth.refreshSession()`

## 📋 Server-Side / Edge Functions

If using server-side code or Edge Functions, you MUST forward the Authorization header:

### Edge Function Example:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  {
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') || ''
      }
    }
  }
);
```

### Server-Side Example:
```typescript
import { createServerClient } from '@supabase/ssr';

const supabase = createServerClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    cookies: {
      get: (name) => cookies.get(name)?.value,
      set: (name, value, options) => cookies.set(name, value, options),
    }
  }
);
```

## ✅ Current Status

- ✅ Client-side Supabase client configured with auth
- ✅ JWT automatically included in all requests
- ✅ Session verification added to `getOtherUserProfile`
- ✅ RLS policies configured (`users_read_public` for authenticated users)
- ✅ `user_public_profile` view accessible to authenticated users

## 🎯 Next Steps

1. Test clicking a participant from GameDetails
2. Check browser console for: `✅ Authenticated session confirmed`
3. Check Network tab for `Authorization` header
4. Profile should load successfully!

