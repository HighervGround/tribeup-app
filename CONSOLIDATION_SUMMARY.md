# Game Card & Live Counts Consolidation Summary

## What Was Changed

### 1. ✅ Unified to Single Game Card Component

**Removed:**
- ❌ `src/components/GameCard.tsx` (legacy component)

**Kept:**
- ✅ `src/components/UnifiedGameCard.tsx` (single source of truth)
- ✅ `src/components/GameCapacity.tsx` (reusable count display)

**Benefits:**
- Single component for all game displays
- Consistent UI/UX across entire app
- Easier maintenance and updates
- All cards use live counts

### 2. ✅ All Queries Use `games_with_counts` View

**Updated in `supabaseService.ts`:**

| Method | Changed From | Changed To |
|--------|-------------|------------|
| `searchGames()` | `from('games')` | `from('games_with_counts')` |
| `getArchivedGames()` | `from('games')` | `from('games_with_counts')` |
| `getUserStats()` | `from('games')` | `from('games_with_counts')` |

**Still using `from('games')` (correct):**
- `deleteGame()` - DELETE operation
- `createGame()` - INSERT operation
- `updateGame()` - UPDATE operation
- Permission checks - Need base table for creator_id checks

### 3. ✅ Live Count Fields Available Everywhere

**Every game object now has:**
```typescript
{
  currentPlayers: number;      // Authenticated (status='joined')
  publicRsvpCount: number;     // Anonymous (attending=true)
  totalPlayers: number;        // currentPlayers + publicRsvpCount
  availableSpots: number;      // maxPlayers - totalPlayers
  maxPlayers: number;          // Capacity
}
```

### 4. ✅ Components Using GameCapacity

- `UnifiedGameCard` - Both full and simple variants
- `PublicGamePage` - Uses `GameCapacityLine`
- All search results
- All home screen games
- All detail views

## Architecture

```
┌─────────────────────────────────────────┐
│         Database Layer                  │
├─────────────────────────────────────────┤
│  games (base table)                     │
│    - Writes (INSERT/UPDATE/DELETE)      │
│    - Permission checks                  │
│                                         │
│  games_with_counts (VIEW)               │
│    - All SELECT queries                 │
│    - Live participant counting          │
│    - JOIN game_participants             │
│    - JOIN public_rsvps                  │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│       Service Layer                     │
├─────────────────────────────────────────┤
│  SupabaseService                        │
│    - getGames()                         │
│    - getGameById()                      │
│    - searchGames()                      │
│    - getRecommendedGames()              │
│    - getArchivedGames()                 │
│    All query games_with_counts          │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      Component Layer                    │
├─────────────────────────────────────────┤
│  UnifiedGameCard (ONLY card component)  │
│    ├─ GameCapacity                      │
│    │    Shows: X/Y +Z public            │
│    │    Logic: total = private + public │
│    └─ Full variant & Simple variant     │
│                                         │
│  PublicGamePage                         │
│    └─ GameCapacityLine                  │
│         Shows detailed breakdown         │
└─────────────────────────────────────────┘
```

## Data Flow

### Before (Inconsistent):
```
GameCard.tsx        → .from('games') → currentPlayers only
UnifiedGameCard.tsx → .from('games_with_counts') → all counts
SearchDiscovery     → Mixed data sources
```

### After (Consistent):
```
All Components → .from('games_with_counts') → Live counts everywhere
     ↓
UnifiedGameCard (only card)
     ↓
GameCapacity component
     ↓
Display: "6/10 +2 public" or "Full" or "2 left"
```

## Files Modified

1. **Service Layer:**
   - `src/lib/supabaseService.ts` - Updated 3 SELECT queries

2. **Component Layer:**
   - ❌ Deleted: `src/components/GameCard.tsx`
   - ✅ Already using: `src/components/UnifiedGameCard.tsx`
   - ✅ Already using: `src/components/ui/GameCapacity.tsx`
   - ✅ Already using: `src/components/SearchDiscovery.tsx`
   - ✅ Already using: `src/components/HomeScreen.tsx`
   - ✅ Already using: `src/components/PublicGamePage.tsx`

3. **Documentation:**
   - `src/ACCESSIBILITY_GUIDE.md` - Updated example

## Next Steps

### Apply the Migration (REQUIRED):

```bash
# In Supabase Dashboard SQL Editor, run:
supabase/migrations/20250120000012_create_games_with_live_counts.sql
```

This creates:
- `games_with_counts` view
- `game_rsvp_stats` view
- Fixes RLS policies
- Adds proper indexes

### Verify It Works:

```sql
-- Test the view exists
SELECT * FROM games_with_counts LIMIT 1;

-- Check live counts
SELECT 
  id,
  title,
  current_players,
  public_rsvp_count,
  total_players,
  available_spots
FROM games_with_counts
WHERE id = 'some-game-id';
```

## Benefits

1. **✅ Consistency** - Same card component everywhere
2. **✅ Accuracy** - Live counts from database, not cached
3. **✅ Maintainability** - Single source of truth
4. **✅ Performance** - Optimized LATERAL joins
5. **✅ Clarity** - Clear separation: base table for writes, view for reads

## Testing Checklist

- [ ] Apply migration to Supabase
- [ ] Verify `games_with_counts` view exists
- [ ] Check home screen shows counts
- [ ] Check search shows counts
- [ ] Check game details shows counts
- [ ] Check public game page shows counts
- [ ] Verify "+X public" badge shows when applicable
- [ ] Verify "Full" badge shows when at capacity
- [ ] Verify "X left" badge shows when nearly full

## Rollback Plan

If issues arise:

1. **Quick fix**: Temporarily query `games` table instead:
   ```typescript
   .from('games')
   .select('*, current_players, public_rsvp_count')
   ```

2. **Complete rollback**: Restore `GameCard.tsx` from git history

But this shouldn't be needed - the changes are straightforward and safe.

