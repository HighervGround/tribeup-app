# Cache Clear Script - Run This in Browser Console

## Quick Fix: Force Clear Cache

Open your browser console (F12 or Cmd+Option+I) and paste this:

```javascript
// 1. Clear React Query cache
if (window.queryClient) {
  console.log('🧹 Clearing React Query cache...');
  window.queryClient.clear();
  console.log('✅ Cache cleared!');
} else {
  console.warn('⚠️ queryClient not found on window. Reloading anyway...');
}

// 2. Clear localStorage
console.log('🧹 Clearing localStorage...');
localStorage.clear();

// 3. Force hard reload
console.log('🔄 Reloading page...');
setTimeout(() => {
  window.location.reload(true);
}, 500);
```

## Alternative: Expose queryClient to window

If the above doesn't work, add this to your app:

**File: `src/providers/QueryProvider.tsx`**

```typescript
// At the bottom of the file, after the provider
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
}
```

Then hard refresh (Cmd+Shift+R) and run the script above.

## Verify It's Working

After refresh, run this in console:

```javascript
// Check if data has the new fields
const data = window.queryClient?.getQueryData(['games']);
if (data && data.length > 0) {
  const firstGame = data[0];
  console.log('🔍 Checking first game data:', {
    currentPlayers: firstGame.currentPlayers,
    publicRsvpCount: firstGame.publicRsvpCount,
    totalPlayers: firstGame.totalPlayers,
    availableSpots: firstGame.availableSpots,
    maxPlayers: firstGame.maxPlayers
  });
  
  if (firstGame.totalPlayers !== undefined) {
    console.log('✅ Data has new fields! Should display correctly.');
  } else {
    console.error('❌ totalPlayers is still undefined. Check network tab.');
  }
} else {
  console.log('📭 No games data in cache yet.');
}
```

## Check Network Response

1. Open Network tab (F12 → Network)
2. Filter by "games_with_counts" or "postgrest"
3. Click on a request
4. Look at Response tab
5. Verify you see these fields:
   ```json
   {
     "current_players": 3,
     "public_rsvp_count": 3,
     "total_players": 6,     ← Should be present!
     "available_spots": 4     ← Should be present!
   }
   ```

If you DON'T see `total_players` and `available_spots` in the network response:
- **Migration wasn't applied correctly**
- Run: `supabase db reset --local` (if local)
- Or re-apply the migration manually

## Expected Result After Cache Clear:

### Game Card Display:
```
┌─────────────────────────────────┐
│ Basketball @ Sven W. Hanson     │
│                                  │
│ 📍 Location                     │
│ 👥 6/10 players  +3 public      │ ← Both should match!
│ 🕐 Tomorrow at 12:00 PM         │
│                                  │
│ ─────────────────────────────── │
│                                  │
│ Capacity: 6/10 (3 private,      │ ← Detailed view
│           3 public) | 4 available│
└─────────────────────────────────┘
```

Both "6/10" counts should be identical!

