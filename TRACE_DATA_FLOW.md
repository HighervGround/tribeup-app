# Trace Data Flow - Find the Bug

## The Issue

You're seeing: **"Players (1/10) +2 public RSVPs"**  
Should be: **"Players (2/10) +1 public RSVPs"**

This means:
- Main count is using `currentPlayers` (1) instead of `totalPlayers` (2)
- Badge is showing `publicRsvpCount` as 2 instead of 1

## Step-by-Step Debugging

### 1. Check Database Response

Open Network tab, find `games_with_counts` request, check the response:

```json
{
  "private_count": 1,  // Should be 1
  "public_count": 1,   // Should be 1
  "capacity_used": 2,  // Should be 2 (1+1)
  "max_players": 10
}
```

**If these numbers are WRONG**: The database view calculation is broken.

**If these numbers are CORRECT**: Continue to step 2.

### 2. Check Transform Function

Add debug log to `src/lib/supabase.ts` line 134:

```typescript
currentPlayers: Number(dbGame.private_count ?? 0), // Authenticated participants (status='joined')
publicRsvpCount: Number(dbGame.public_count ?? 0), // Anonymous RSVPs (attending=true)
totalPlayers: Number(dbGame.capacity_used ?? (dbGame.private_count ?? 0) + (dbGame.public_count ?? 0)), // Total of both
availableSpots: Number(dbGame.capacity_available ?? Math.max(0, (dbGame.max_players ?? 0) - (dbGame.capacity_used ?? 0))), // Available capacity

// ADD THIS DEBUG LINE:
(() => {
  const result = {
    db_private: dbGame.private_count,
    db_public: dbGame.public_count,
    db_capacity_used: dbGame.capacity_used,
    mapped_currentPlayers: Number(dbGame.private_count ?? 0),
    mapped_publicRsvpCount: Number(dbGame.public_count ?? 0),
    mapped_totalPlayers: Number(dbGame.capacity_used ?? 0)
  };
  console.log('Transform:', dbGame.id?.slice(0,8), result);
  return result.mapped_totalPlayers; // Just to make it an expression
})();
```

**Expected log:**
```
Transform: 12345678 {
  db_private: 1,
  db_public: 1,
  db_capacity_used: 2,
  mapped_currentPlayers: 1,
  mapped_publicRsvpCount: 1,
  mapped_totalPlayers: 2
}
```

**If mapped values are WRONG**: The database isn't returning the fields correctly.

### 3. Check Game Object in Component

In `src/components/UnifiedGameCard.tsx`, add debug at line 60:

```typescript
  } = useGameCard(game, { onSelect, onJoinLeave });

  // DEBUG: Log game object
  console.log('🎮 UnifiedGameCard render:', game.id?.slice(0,8), {
    currentPlayers: game.currentPlayers,
    publicRsvpCount: game.publicRsvpCount,
    totalPlayers: game.totalPlayers,
    availableSpots: game.availableSpots
  });
```

**Expected:**
```
🎮 UnifiedGameCard render: 12345678 {
  currentPlayers: 1,
  publicRsvpCount: 1,
  totalPlayers: 2,
  availableSpots: 8
}
```

**If totalPlayers is undefined or wrong**: The issue is between the transform and the component.

### 4. Check GameCapacity Props

Enable debug mode (from ENABLE_DEBUG.md):

```javascript
window.__debugCapacity = true;
```

Refresh page. You should see:

```
🎯 GameCapacity render: {
  props: {
    currentPlayers: 1,
    publicRsvpCount: 1,
    totalPlayers: 2,  // ← Should be 2!
    maxPlayers: 10
  },
  computed: { total: 2 },
  displayWillShow: "2/10"
}
```

**If `totalPlayers` prop is undefined or 1**: The component is not receiving correct props.

**If `computed.total` is wrong but `props.totalPlayers` is correct**: The `??` fallback is choosing the wrong value.

### 5. Check What's Actually Rendering

Run this in console:

```javascript
// Find all elements that display player counts
document.querySelectorAll('[class*="player"], [class*="capacity"]').forEach(el => {
  if (el.textContent.includes('Players') || el.textContent.includes('players')) {
    console.log('Found:', el.textContent, el);
  }
});
```

This will show you ALL places where player counts are displayed. You might find a rogue component that's not using `GameCapacity`.

## Common Issues & Fixes

### Issue 1: `totalPlayers` is undefined

**Cause**: Transform isn't setting it.

**Fix**: Check if `dbGame.capacity_used` is actually in the SELECT:

```typescript
.select('..., private_count, public_count, capacity_used, capacity_available')
```

### Issue 2: `publicRsvpCount` is doubled (showing 2 instead of 1)

**Cause**: Summing it twice somewhere.

**Fix**: Search for where `publicRsvpCount` is used:

```bash
grep -r "publicRsvpCount.*publicRsvpCount" src/
grep -r "public_count.*public_count" src/
```

### Issue 3: Display uses `currentPlayers` instead of `totalPlayers`

**Cause**: A component is using the wrong field.

**Fix**: Find where "Players (" is rendered:

```bash
grep -r "Players (" src/components/
```

Make sure it's using `totalPlayers` or `GameCapacity` component.

### Issue 4: Correct data but wrong display

**Cause**: Browser cache showing old component code.

**Fix**: Hard refresh (`Cmd+Shift+R`) and clear React Query cache:

```javascript
window.queryClient.clear();
location.reload();
```

## Quick Nuclear Option

If you can't find it, add this to `GameCapacity.tsx` line 34:

```typescript
const total = totalPlayers ?? (currentPlayers + publicRsvpCount);
// FORCE DEBUG: Always use totalPlayers if available
if (totalPlayers !== undefined && totalPlayers !== total) {
  console.error('⚠️ totalPlayers mismatch!', { totalPlayers, calculated: currentPlayers + publicRsvpCount, using: total });
}
```

This will scream if there's a mismatch.

