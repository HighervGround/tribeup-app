# Code Review - SELECT Query and Render Logic

## 1. SELECT Query (HomeScreen uses useGamesWithCreators)

**File: `src/hooks/useGamesWithCreators.ts` Lines 76-88**

```typescript
const { data: gamesData, error: gamesErr } = await supabase
  .from('games_with_counts')
  .select(`
    id, title, sport, date, time, duration, location, latitude, longitude,
    cost, max_players, description, image_url, creator_id, created_at,
    public_count, private_count, capacity_used, capacity_available
  `)
  .gte('date', new Date().toISOString().split('T')[0])
  .order('date', { ascending: true })
  .limit(50);
```

✅ **Correct**: Selects `public_count`, `private_count`, `capacity_used`, `capacity_available`

---

## 2. Transform Mapping

**File: `src/hooks/useGamesWithCreators.ts` Lines 204-207**

```typescript
currentPlayers: game.private_count || 0,      // Map new field
publicRsvpCount: game.public_count || 0,      // Map new field
totalPlayers: game.capacity_used || 0,        // Map new field
availableSpots: game.capacity_available || 0, // Map new field
```

✅ **Correct**: Maps database fields to camelCase properties

---

## 3. Render Logic - "Players (X/Y)"

**File: `src/components/ui/GameCapacity.tsx` Lines 33-48**

```typescript
}: GameCapacityProps) {
  // IMPORTANT: Use capacity_used directly, DON'T recalculate (avoids doubling)
  const total = totalPlayers ?? 0; // totalPlayers should come from capacity_used
  const available = availableSpots ?? Math.max(0, maxPlayers - total);
  
  // Determine if game is full or nearly full
  const isFull = available === 0;
  const isNearlyFull = available <= 2 && available > 0;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>
          {total}/{maxPlayers}
        </span>
      </div>
```

**Line 36:** `const total = totalPlayers ?? 0;` ✅ Uses capacity_used directly  
**Line 46:** `{total}/{maxPlayers}` ✅ Renders "2/10"

---

## 4. Render Logic - Public Badge

**File: `src/components/ui/GameCapacity.tsx` Lines 50-62**

```typescript
      {showDetailed && publicRsvpCount > 0 && (
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          {currentPlayers} private, {publicRsvpCount} public
        </Badge>
      )}
      
      {publicRsvpCount > 0 && !showDetailed && (
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          +{publicRsvpCount} public
        </Badge>
      )}
      
      {isFull && (
        <Badge variant="destructive" className="text-xs px-2 py-0.5">
```

**Line 58:** `{publicRsvpCount > 0 && !showDetailed && (...)}` ✅ Only renders if > 0  
**Line 60:** `+{publicRsvpCount} public` ✅ Shows "+1 public"

---

## Summary

### SELECT Query:
```sql
SELECT 
  id, title, sport, ...,
  public_count,        ← public RSVPs
  private_count,       ← authenticated participants  
  capacity_used,       ← total (private + public)
  capacity_available   ← available spots
FROM games_with_counts
```

### Transform:
```typescript
totalPlayers: game.capacity_used || 0,    // ← from capacity_used
publicRsvpCount: game.public_count || 0,  // ← from public_count
```

### Render:
```tsx
const total = totalPlayers ?? 0;  // ← NO recalculation

<span>{total}/{maxPlayers}</span>  {/* "2/10" */}

{publicRsvpCount > 0 && (
  <Badge>+{publicRsvpCount} public</Badge>  {/* "+1 public" */}
)}
```

✅ **All correct - uses capacity_used directly, no recalculation**

