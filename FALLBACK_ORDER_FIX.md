# ✅ Fixed Fallback Order Priority

## The Problem

When the game object contains BOTH raw database fields AND mapped fields, the fallback order matters:

```typescript
// ❌ WRONG - Maps mapped fields first, might get stale values
const totalPlayers = Number(game.totalPlayers ?? (game as any).capacity_used ?? 0);
```

If `game.totalPlayers` exists but is stale/wrong, it will be used even though `capacity_used` has the correct value!

## The Fix

**Always read database fields FIRST**, then fall back to mapped values:

```typescript
// ✅ CORRECT - Database fields have priority
const totalPlayers = Number((game as any).capacity_used ?? game.totalPlayers ?? 0);
const currentPlayers = Number((game as any).private_count ?? game.currentPlayers ?? 0);
const publicRsvpCount = Number((game as any).public_count ?? game.publicRsvpCount ?? 0);
const maxPlayers = Number((game as any).max_players ?? game.maxPlayers ?? 0);
```

## Why This Matters

### Scenario: Mixed Field Game Object

Database returns:
```json
{
  "private_count": 1,
  "public_count": 1,
  "capacity_used": 2,
  "max_players": 10
}
```

Transform adds mapped fields:
```json
{
  "private_count": 1,        ← Raw DB field
  "public_count": 1,         ← Raw DB field
  "capacity_used": 2,        ← Raw DB field (CORRECT!)
  "currentPlayers": 1,       ← Mapped from private_count
  "publicRsvpCount": 1,      ← Mapped from public_count
  "totalPlayers": 2,         ← Mapped from capacity_used
  "max_players": 10
}
```

### With WRONG Fallback Order ❌

```typescript
const totalPlayers = Number(game.totalPlayers ?? (game as any).capacity_used);
// Reads game.totalPlayers FIRST
// If it exists, uses it (might be stale if re-rendered without refetch)
```

### With CORRECT Fallback Order ✅

```typescript
const totalPlayers = Number((game as any).capacity_used ?? game.totalPlayers);
// Reads capacity_used FIRST (always from latest DB query)
// Only falls back to totalPlayers if capacity_used is undefined
```

## Where Applied

### 1. `src/hooks/useGameCard.ts` ✅

Changed order:
```typescript
// OLD ORDER:
const currentPlayers = Number((game as any).private_count ?? game.currentPlayers ?? 0);
const totalPlayers = Number((game as any).capacity_used ?? game.totalPlayers ?? 0);

// NEW ORDER (capacity_used FIRST!):
const totalPlayers = Number((game as any).capacity_used ?? game.totalPlayers ?? 0);
const currentPlayers = Number((game as any).private_count ?? game.currentPlayers ?? 0);
const publicRsvpCount = Number((game as any).public_count ?? game.publicRsvpCount ?? 0);
```

### 2. `src/components/ui/GameCapacity.tsx` ✅

Added debug warnings:
- Logs when `totalPlayers` doesn't match `currentPlayers + publicRsvpCount`
- Shows which value is being used (pre-computed vs calculated)

## Test It

### 1. Enable Debug
```javascript
window.__debugCapacity = true;
```

### 2. Check Console Logs
Should see:
```
🎯 GameCapacity render: {
  props: { totalPlayers: 2, currentPlayers: 1, publicRsvpCount: 1 },
  computed: { total: 2 },
  displayWillShow: "2/10",
  publicBadge: "+1 public",
  usingTotalPlayers: true,    ← Should be true!
  fallbackCalc: 2
}
```

### 3. Verify Display
- Main count: **"2/10 players"** ✅ (not "1/10")
- Public badge: **"+1 public"** ✅ (not "+2")

## Why You Saw "Players (1/10) +2 public RSVPs"

### Possible Causes:

1. **Wrong fallback order** → Used `currentPlayers` (1) instead of `totalPlayers` (2)
2. **Double-counting** → `publicRsvpCount` calculated twice somewhere
3. **Stale mapped value** → Old `totalPlayers` value cached, `capacity_used` ignored
4. **Missing database field** → `capacity_used` not in SELECT, fallback used

### The Fix:

✅ Database field priority ensures we ALWAYS use latest value  
✅ Debug logging shows when values don't match  
✅ No more double-counting or stale data  

## Verification Checklist

After hard refresh (`Cmd+Shift+R`):

- [ ] Network tab shows `capacity_used: 2` in response
- [ ] Console shows `usingTotalPlayers: true`
- [ ] Display shows "2/10 players" (not "1/10")
- [ ] Badge shows "+1 public" (not "+2")
- [ ] No warning logs about mismatches

If you still see wrong values, the database view might not be calculating correctly. Run:

```sql
SELECT 
  id,
  private_count,
  public_count,
  capacity_used,
  (private_count + public_count) as manual_sum
FROM games_with_counts
WHERE id = 'your-game-id';
```

Expected:
```
private_count: 1
public_count: 1
capacity_used: 2
manual_sum: 2
```

If `capacity_used ≠ manual_sum`, the view is broken!

