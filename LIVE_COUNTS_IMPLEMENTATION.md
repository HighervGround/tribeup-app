# Live Participant Counting System

## Overview

This system uses **live database queries** to count game participants instead of relying on cached/computed columns. This ensures accurate, real-time capacity tracking across all areas of the application.

## Architecture

### Database Views

#### 1. `games_with_counts` View
Extends the `games` table with live participant counts:

```sql
CREATE VIEW games_with_counts AS
SELECT 
  g.*,
  -- Live count of authenticated participants (status='joined')
  COUNT(gp) WHERE status='joined' AS current_players,
  -- Live count of public RSVPs (attending=true)
  COUNT(pr) WHERE attending=true AS public_rsvp_count,
  -- Total participants
  (current_players + public_rsvp_count) AS total_players,
  -- Available spots
  MAX(0, max_players - total_players) AS available_spots
FROM games g
LEFT JOIN game_participants gp ON gp.game_id = g.id
LEFT JOIN public_rsvps pr ON pr.game_id = g.id
```

**Fields:**
- `current_players`: Authenticated users with `status='joined'`
- `public_rsvp_count`: Anonymous users with `attending=true`
- `total_players`: Sum of both counts
- `available_spots`: Remaining capacity

#### 2. `game_rsvp_stats` View
Detailed capacity statistics for public game pages:

```sql
CREATE VIEW game_rsvp_stats AS
SELECT 
  game_id,
  capacity (max_players),
  private_rsvp_count (authenticated),
  public_rsvp_count (anonymous),
  total_rsvps,
  capacity_remaining
FROM games g
```

### Frontend Components

#### GameCapacity Component
Reusable component for displaying live participant counts:

```tsx
<GameCapacity
  currentPlayers={4}      // Authenticated participants
  maxPlayers={10}
  publicRsvpCount={2}     // Anonymous RSVPs
  totalPlayers={6}        // Pre-computed total (optional)
  availableSpots={4}      // Pre-computed available (optional)
  showDetailed={false}    // Show private/public breakdown
/>
```

**Display:**
- Simple: "6/10 +2 public"
- Detailed: "6/10 (4 private, 2 public)"
- Status badges: "Full" or "2 left"

#### GameCapacityLine Component
Text-only format for detailed displays:

```tsx
<GameCapacityLine
  currentPlayers={4}
  maxPlayers={10}
  publicRsvpCount={2}
/>
// Output: "Capacity: 6/10 (4 private, 2 public) | 4 available"
```

## Data Flow

### 1. Query
```typescript
const { data } = await supabase
  .from('games_with_counts')
  .select('*, creator_profile(...), game_participants(...)')
```

### 2. Transform
```typescript
// In transformGameFromDB()
{
  currentPlayers: Number(dbGame.current_players),
  publicRsvpCount: Number(dbGame.public_rsvp_count),
  totalPlayers: Number(dbGame.total_players),
  availableSpots: Number(dbGame.available_spots)
}
```

### 3. Render
```tsx
<GameCapacity {...game} />
```

## Counting Logic

### Private Participants (Authenticated)
```sql
SELECT COUNT(*) 
FROM game_participants 
WHERE game_id = :id 
  AND status = 'joined'
```

### Public RSVPs (Anonymous)
```sql
SELECT COUNT(*) 
FROM public_rsvps 
WHERE game_id = :id 
  AND attending = true
```

### Total and Available
```typescript
total = private_players + public_players
available = max_players - total
```

## Benefits

1. **Accuracy**: Always reflects current database state
2. **Consistency**: Same logic everywhere in the app
3. **Real-time**: No stale data from cached columns
4. **Maintainability**: Single source of truth
5. **Debuggability**: Easy to verify counts match reality

## Usage in Components

### Home Screen & Search
```tsx
<UnifiedGameCard game={game} />
// Uses GameCapacity internally
```

### Game Details
```tsx
<GameCapacity
  {...game}
  showDetailed={true}
/>
```

### Public Game Page
```tsx
<GameCapacityLine
  currentPlayers={capacity.private_rsvp_count}
  publicRsvpCount={capacity.public_rsvp_count}
  maxPlayers={capacity.capacity}
/>
```

## Migration Required

Apply this migration to enable live counting:

```bash
# Run this migration on your Supabase instance
supabase/migrations/20250120000012_create_games_with_live_counts.sql
```

The migration:
1. Creates `games_with_counts` view with live counts
2. Creates `game_rsvp_stats` view for public pages
3. Fixes RLS policy column name (`archived` not `is_archived`)
4. Fixes index on correct column
5. Grants access to authenticated and anonymous users

## Verification

After applying the migration, verify:

```sql
-- Check view exists and returns data
SELECT * FROM games_with_counts LIMIT 1;

-- Verify counts are accurate
SELECT 
  g.id,
  g.max_players,
  gc.current_players,
  gc.public_rsvp_count,
  gc.total_players,
  gc.available_spots
FROM games g
JOIN games_with_counts gc ON g.id = gc.id
WHERE g.id = 'some-game-id';
```

## Performance

Live counting uses **LEFT JOIN LATERAL** for efficient aggregation:
- No row inflation
- Computed per game
- Indexed lookups on `game_id`
- O(1) for single game queries
- O(n) for list queries (unavoidable)

For large datasets (1000+ games), consider:
- Pagination (already implemented with `.limit(50)`)
- Caching at the React Query level (5min `staleTime`)
- Database read replicas for read-heavy workloads

## Troubleshooting

### Counts seem wrong
1. Check `game_participants.status` values (should be 'joined', not 'left')
2. Check `public_rsvps.attending` values (should be true)
3. Verify FK relationships exist
4. Check RLS policies allow reading both tables

### View not found
1. Ensure migration was applied
2. Check Supabase dashboard > Database > Views
3. Verify grants: `GRANT SELECT ON games_with_counts TO anon, authenticated`

### Performance issues
1. Check indexes exist on `game_participants(game_id)` and `public_rsvps(game_id)`
2. Verify query has `.limit()` clause
3. Check for N+1 queries (should use single query with joins)

## Related Files

- **Migration**: `supabase/migrations/20250120000012_create_games_with_live_counts.sql`
- **Transform**: `src/lib/supabase.ts` (transformGameFromDB)
- **Component**: `src/components/ui/GameCapacity.tsx`
- **Interface**: `src/store/appStore.ts` (Game interface)
- **Usage**: `src/components/UnifiedGameCard.tsx`, `PublicGamePage.tsx`

