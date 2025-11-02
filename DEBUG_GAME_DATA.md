# Debug Game Data Issue

## Run This in Browser Console

After loading the page with games showing "Players (1/10) +2 public RSVPs", open console (F12) and run:

```javascript
// Get games from React Query cache
const gamesData = window.queryClient?.getQueryData(['games', 'list']);
if (!gamesData) {
  console.error('No games data found. Try window.queryClient.getQueriesData()');
} else {
  const firstGame = gamesData[0];
  console.log('🔍 First game data:', {
    // Raw database fields (snake_case)
    private_count: firstGame.private_count,
    public_count: firstGame.public_count,
    capacity_used: firstGame.capacity_used,
    capacity_available: firstGame.capacity_available,
    max_players: firstGame.max_players,
    
    // Mapped fields (camelCase)
    currentPlayers: firstGame.currentPlayers,
    publicRsvpCount: firstGame.publicRsvpCount,
    totalPlayers: firstGame.totalPlayers,
    availableSpots: firstGame.availableSpots,
    maxPlayers: firstGame.maxPlayers
  });
  
  // Check if there's a mismatch
  console.log('🔍 Checking for issues:');
  if (firstGame.private_count !== firstGame.currentPlayers) {
    console.error('❌ MISMATCH: private_count !== currentPlayers');
  }
  if (firstGame.public_count !== firstGame.publicRsvpCount) {
    console.error('❌ MISMATCH: public_count !== publicRsvpCount');
  }
  if (firstGame.capacity_used !== firstGame.totalPlayers) {
    console.error('❌ MISMATCH: capacity_used !== totalPlayers');
  }
  
  console.log('✅ All checks done. Expected for "Players (2/10) +1 public":');
  console.log('  - totalPlayers should be 2');
  console.log('  - publicRsvpCount should be 1');
}
```

## What We're Looking For

**If correct (should show "Players (2/10) +1 public RSVPs"):**
```
private_count: 1
public_count: 1
capacity_used: 2
currentPlayers: 1
publicRsvpCount: 1
totalPlayers: 2
```

**If incorrect (showing "Players (1/10) +2 public RSVPs"):**
```
private_count: 1
public_count: 1
capacity_used: 2
currentPlayers: 1     ← Wrong, UI uses this instead of totalPlayers
publicRsvpCount: 2    ← Wrong, doubled somehow
totalPlayers: 2       ← Correct, but not being used
```

## If Network Response is Wrong

Check the actual Supabase response:

```javascript
// Find the games_with_counts request in Network tab
// Or run a fresh query:
const { data, error } = await supabase
  .from('games_with_counts')
  .select('id,title,private_count,public_count,capacity_used,capacity_available,max_players')
  .limit(1);

console.log('Database response:', data[0]);
```

Expected:
```json
{
  "private_count": 1,
  "public_count": 1,
  "capacity_used": 2,
  "capacity_available": 8,
  "max_players": 10
}
```

If this is wrong, the view calculation is broken.

## If UI Display is Wrong

The issue is in how `GameCapacity` receives props. Check in React DevTools:

1. Open React DevTools
2. Find `<GameCapacity>` component
3. Check its props:
   - `currentPlayers` should be `1`
   - `publicRsvpCount` should be `1`
   - `totalPlayers` should be `2`
   - `maxPlayers` should be `10`

If `totalPlayers` is missing or wrong, the issue is in the transform or how props are passed.

## Quick Fix - Force Use totalPlayers

If `totalPlayers` is correct but not being displayed, update `GameCapacity`:

```typescript
// In GameCapacity.tsx line 34
const total = totalPlayers ?? (currentPlayers + publicRsvpCount);
```

Change to:
```typescript
const total = totalPlayers ?? (currentPlayers + publicRsvpCount);
console.log('GameCapacity received:', { currentPlayers, publicRsvpCount, totalPlayers, calculated: currentPlayers + publicRsvpCount, using: total });
```

This will show what the component is actually using.

