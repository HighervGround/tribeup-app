# Force Refresh After Migration

## The Problem

You applied the migration but the UI still shows old counts because:
- ✅ Database has the new view
- ✅ Code is updated  
- ❌ **React Query cached the old data** (staleTime: 2 minutes)

## Quick Fix Options:

### Option 1: Hard Refresh Browser (Easiest)
```
Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
Safari: Cmd+Option+R (Mac)
```

### Option 2: Clear React Query Cache via Console

Open browser console (F12) and run:
```javascript
// Clear ALL cached queries
window.queryClient.clear();

// Or just invalidate game queries
window.queryClient.invalidateQueries({ queryKey: ['games'] });

// Then reload
window.location.reload();
```

### Option 3: Clear All Caches via UI

1. Open your app
2. Look for the "Cache Clear" button (only shows in development/localhost)
3. Click it
4. Reload page

### Option 4: Temporary Code Fix (Auto-invalidate on load)

Add this to `src/components/HomeScreen.tsx` at the top of the component:

```typescript
// TEMPORARY: Force refresh after migration
useEffect(() => {
  const hasRefreshed = sessionStorage.getItem('migration_refresh');
  if (!hasRefreshed) {
    queryClient.invalidateQueries({ queryKey: ['games'] });
    sessionStorage.setItem('migration_refresh', 'true');
  }
}, []);
```

## Why This Happened:

React Query caches queries for **2 minutes** (staleTime):
```typescript
// src/providers/QueryProvider.tsx line 10
staleTime: 2 * 60 * 1000, // 2 minutes
```

When you:
1. Applied migration → Database updated ✅
2. Page was already loaded → Using cached data ❌
3. Stale cache showing old counts → Still shows "3/10" instead of "6/10"

## Verify It's Working:

After clearing cache:

1. **Check Console** - Should see:
```
🚀 Starting getGames with two-step fetch...
✅ Games fetched: X games
```

2. **Check Network Tab** - Should see query to `games_with_counts`

3. **Check Counts** - Should show:
```
Top right: 6/10 players
Details: 6/10 +3 public
```

## Permanent Fix:

To prevent this in future, reduce staleTime:

```typescript
// src/providers/QueryProvider.tsx
staleTime: 30 * 1000, // 30 seconds instead of 2 minutes
```

But for now, just **hard refresh your browser** (Cmd+Shift+R) and it should work!

