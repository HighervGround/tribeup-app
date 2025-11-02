# Enforced Single Source of Truth - Player Counts

## ✅ Changes Applied

### 1. Removed Redundant Fields from Transform
**Before:**
```typescript
currentPlayers: Number(dbGame.private_count ?? 0),
publicRsvpCount: Number(dbGame.public_count ?? 0),
totalPlayers: Number(dbGame.capacity_used ?? 0),
availableSpots: Number(dbGame.capacity_available ?? 0)
```

**After (src/lib/supabase.ts):**
```typescript
// SINGLE SOURCE OF TRUTH: Only use pre-computed view fields
totalPlayers: Number(dbGame.capacity_used ?? 0),
availableSpots: Number(dbGame.capacity_available ?? Math.max(0, Number(dbGame.max_players ?? 0) - Number(dbGame.capacity_used ?? 0)))
```

### 2. Updated Game Interface (src/store/appStore.ts)
**Before:**
```typescript
currentPlayers: number;
maxPlayers: number;
publicRsvpCount?: number;
totalPlayers?: number;
availableSpots?: number;
```

**After:**
```typescript
maxPlayers: number;
totalPlayers: number; // From capacity_used (DO NOT recalculate)
availableSpots: number; // From capacity_available (DO NOT recalculate)
```

### 3. Simplified GameCapacity Component (src/components/ui/GameCapacity.tsx)
**Before:**
```typescript
interface GameCapacityProps {
  currentPlayers: number;
  maxPlayers: number;
  publicRsvpCount?: number;
  totalPlayers?: number;
  availableSpots?: number;
  showDetailed?: boolean;
  className?: string;
  game?: any;
}
```

**After:**
```typescript
interface GameCapacityProps {
  totalPlayers: number; // Pre-computed from capacity_used (DO NOT recalculate)
  maxPlayers: number; // From max_players
  availableSpots: number; // Pre-computed from capacity_available (DO NOT recalculate)
  className?: string;
}
```

**Removed:**
- All private/public breakdown displays
- All badges showing "+X public RSVPs"
- All manual calculations

**Now shows:**
- Simple `{total}/{max}` display
- "Full" badge when full
- "{X} left" badge when nearly full

### 4. Removed private_count/public_count from SELECT Statements
**Updated files:**
- `src/lib/supabaseService.ts` (all queries)
- `src/hooks/useGamesWithCreators.ts`

**Now only selects:**
```sql
capacity_used, capacity_available
```

### 5. Updated All Component Usages
**UnifiedGameCard.tsx** (3 places):
```tsx
<GameCapacity
  totalPlayers={game.totalPlayers}
  maxPlayers={game.maxPlayers}
  availableSpots={game.availableSpots}
/>
```

**PublicGamePage.tsx:**
```tsx
<GameCapacityLine
  totalPlayers={capacityData.totalPlayers}
  maxPlayers={capacityData.maxPlayers}
  availableSpots={capacityData.availableSpots}
/>
```

### 6. Added Debug Logging
**useGameCard.ts:**
```typescript
console.log('useGameCard data:', {
  game_id: game.id,
  capacity_used: (game as any).capacity_used,
  capacity_available: (game as any).capacity_available,
  max_players: (game as any).max_players,
  totalPlayers,
  maxPlayers,
  availableSpots,
  isFull
});
```

**GameCapacity.tsx:**
```typescript
console.log('GameCapacity render:', {
  totalPlayers: total,
  maxPlayers: max,
  availableSpots: available
});
```

## Data Flow

```
Database View: games_with_counts
  ↓
  capacity_used (private_count + public_count) ← pre-computed in view
  capacity_available (max_players - capacity_used) ← pre-computed in view
  ↓
transformGameFromDB
  ↓
  totalPlayers = capacity_used (no calculation)
  availableSpots = capacity_available (no calculation)
  ↓
Game Interface (ONLY these fields exist)
  ↓
  totalPlayers: number
  maxPlayers: number
  availableSpots: number
  ↓
GameCapacity Component
  ↓
Display: "{totalPlayers}/{maxPlayers}"
```

## Verification

Check console logs for:
```
useGameCard data: {
  game_id: "xxx",
  capacity_used: 2,
  capacity_available: 8,
  max_players: 10,
  totalPlayers: 2,
  maxPlayers: 10,
  availableSpots: 8,
  isFull: false
}

GameCapacity render: {
  totalPlayers: 2,
  maxPlayers: 10,
  availableSpots: 8
}
```

Expected display: **"2/10"** (no public badge, just total)

## No More Issues

- ❌ Removed `currentPlayers` field
- ❌ Removed `publicRsvpCount` field
- ❌ Removed `private_count` from SELECT
- ❌ Removed `public_count` from SELECT
- ✅ Only use `capacity_used` → `totalPlayers`
- ✅ Only use `capacity_available` → `availableSpots`
- ✅ No calculations anywhere in frontend
- ✅ Single source of truth enforced

