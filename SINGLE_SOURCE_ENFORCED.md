# ✅ Single Source of Truth - ENFORCED

## What Was Fixed

The app was mixing data sources and recalculating totals in multiple places, causing inconsistent displays like "Players (1/10) +2 public RSVPs" when it should show "2/10".

### Root Cause
- Frontend was accessing both `private_count` and `public_count` from database
- UI components were manually calculating `currentPlayers + publicRsvpCount`
- Multiple transform layers creating duplicate/stale fields
- Components had fallback chains that pulled wrong properties

## Changes Applied

### 1. Database Query Layer
**Removed from SELECT:**
- `private_count` ❌
- `public_count` ❌

**Only select:**
- `capacity_used` ✅ (pre-computed: private_count + public_count)
- `capacity_available` ✅ (pre-computed: max_players - capacity_used)

### 2. Transform Layer (src/lib/supabase.ts)
**Before:**
```typescript
currentPlayers: Number(dbGame.private_count ?? 0),
publicRsvpCount: Number(dbGame.public_count ?? 0),
totalPlayers: Number(dbGame.capacity_used ?? 0),
availableSpots: Number(dbGame.capacity_available ?? 0)
```

**After:**
```typescript
// SINGLE SOURCE: Only map pre-computed view fields
totalPlayers: Number(dbGame.capacity_used ?? 0),
availableSpots: Number(dbGame.capacity_available ?? 0)
```

### 3. TypeScript Interface (src/store/appStore.ts)
**Removed:**
- `currentPlayers` ❌
- `publicRsvpCount` ❌

**Kept:**
- `totalPlayers: number` (required, from capacity_used)
- `availableSpots: number` (required, from capacity_available)

### 4. UI Component (src/components/ui/GameCapacity.tsx)
**Removed props:**
- `currentPlayers` ❌
- `publicRsvpCount` ❌
- `showDetailed` ❌
- `game` ❌

**Simplified to:**
```typescript
interface GameCapacityProps {
  totalPlayers: number;
  maxPlayers: number;
  availableSpots: number;
  className?: string;
}
```

**Removed UI elements:**
- Private/public breakdown badges
- "+X public RSVPs" badges
- All manual calculations

**Now only shows:**
- `{totalPlayers}/{maxPlayers}` 
- "Full" badge (when full)
- "{X} left" badge (when nearly full)

### 5. All Component Usages
Updated **4 locations** to only pass 3 props:

```tsx
<GameCapacity
  totalPlayers={game.totalPlayers}
  maxPlayers={game.maxPlayers}
  availableSpots={game.availableSpots}
/>
```

### 6. Debug Logging Added
**useGameCard.ts:**
```typescript
console.log('useGameCard data:', {
  game_id,
  capacity_used: (game as any).capacity_used,
  capacity_available: (game as any).capacity_available,
  totalPlayers,
  maxPlayers,
  availableSpots
});
```

**GameCapacity.tsx:**
```typescript
console.log('GameCapacity render:', {
  totalPlayers,
  maxPlayers,
  availableSpots
});
```

## Data Flow (Enforced)

```
PostgreSQL View: games_with_counts
  ↓
  SELECT capacity_used, capacity_available
  ↓
Supabase Client
  ↓
transformGameFromDB()
  totalPlayers = capacity_used
  availableSpots = capacity_available
  ↓
Game Interface (ONLY these exist)
  ↓
GameCapacity Component
  ↓
Display: "{totalPlayers}/{maxPlayers}"
```

## Files Modified
1. `src/lib/supabase.ts` - Removed currentPlayers/publicRsvpCount from transform
2. `src/store/appStore.ts` - Removed fields from interface
3. `src/components/ui/GameCapacity.tsx` - Simplified props and removed badges
4. `src/components/UnifiedGameCard.tsx` - Updated 3 usages
5. `src/components/PublicGamePage.tsx` - Updated usage
6. `src/hooks/useGameCard.ts` - Removed private_count/public_count reads
7. `src/hooks/useGamesWithCreators.ts` - Stopped selecting private_count/public_count
8. `src/lib/supabaseService.ts` - Removed from all SELECT statements (5 places)
9. `src/lib/locationNotificationService.ts` - Removed from SELECT

## Expected Behavior

### For a game with 1 authenticated player + 1 public RSVP out of 10:

**Database:**
- `private_count = 1`
- `public_count = 1`
- `capacity_used = 2`
- `capacity_available = 8`

**Console logs:**
```
useGameCard data: {
  game_id: "xxx",
  capacity_used: 2,
  capacity_available: 8,
  max_players: 10,
  totalPlayers: 2,
  maxPlayers: 10,
  availableSpots: 8
}

GameCapacity render: {
  totalPlayers: 2,
  maxPlayers: 10,
  availableSpots: 8
}
```

**UI Display:**
```
2/10
```

That's it. No badges, no breakdown, no confusion.

## Why This Works

1. **No client-side math** - All totals come from database view
2. **No field mixing** - Frontend never sees private_count or public_count
3. **No fallback chains** - Only one source: capacity_used
4. **No component variants** - Single GameCapacity for all screens
5. **Type safety** - Interface only has totalPlayers (required)

## Verification Steps

1. Open browser console
2. Navigate to Home, Search, or Game Details
3. Check logs for `useGameCard data` and `GameCapacity render`
4. Verify `capacity_used` matches `totalPlayers`
5. Verify UI shows exact same number

## Build Status

✅ Compiled successfully (no TypeScript errors)
✅ All components updated
✅ All queries fixed
✅ Debug logging active

