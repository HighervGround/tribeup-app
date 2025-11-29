# Game Retention Policy

## Overview
This document outlines the game visibility and retention policy implemented in TribeUp.

## Business Rule
**Games remain visible until their end time + 2 hour buffer**

### Rationale
Extending game visibility beyond the start time provides several user benefits:
- ✅ Post-game reviews and ratings
- ✅ Chat/photos sharing after completion  
- ✅ Late arrivals can still see details
- ✅ Extended social interaction window
- ✅ Better user engagement and retention

## Implementation

### Client-Side Filtering
Games are filtered in real-time on the client using the `isGameActive()` utility function.

**Location:** `src/shared/utils/dateUtils.ts`

```typescript
export function isGameActive(
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 120,
  bufferMinutes: number = 120
): boolean
```

**Default Values:**
- `durationMinutes`: 120 (2 hours) - used if game duration is not specified
- `bufferMinutes`: 120 (2 hours) - buffer time after game ends

### Calculation Logic

```
Game Expiry Time = Start Time + Duration + Buffer
```

**Example:**
- Basketball game at 6:00 PM
- Duration: 90 minutes
- Buffer: 120 minutes
- Visible until: 9:30 PM (6:00 PM + 90 min + 120 min)

### Database Archival
Games are permanently archived in the database 7 days after their date.

**Location:** `supabase/migrations/20250913170000_add_game_archiving.sql`

```sql
-- Function to auto-archive games that are more than 7 days past their date
CREATE OR REPLACE FUNCTION auto_archive_old_games()
RETURNS void AS $$
BEGIN
  UPDATE games 
  SET archived = TRUE 
  WHERE archived = FALSE 
    AND date < (CURRENT_DATE - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;
```

**Note:** This function needs to be scheduled to run automatically (e.g., via cron job or Supabase scheduled functions).

## Code Locations

### Primary Implementation
1. **Utility Functions:** `src/shared/utils/dateUtils.ts`
   - `calculateGameExpiryTime()` - Calculate when game should be hidden
   - `isGameActive()` - Check if game should still be visible

2. **Game Fetching:** `src/domains/games/hooks/useGamesWithCreators.ts`
   - Filters games using `isGameActive()` before displaying

### Usage Example

```typescript
import { isGameActive } from '@/shared/utils/dateUtils';

// Filter games
const activeGames = allGames.filter(game => {
  const durationMinutes = game.duration_minutes || game.duration || 120;
  return isGameActive(game.date, game.time, durationMinutes);
});
```

## Timeline Examples

### Scenario 1: Regular Game
- **Game:** Soccer, 7:00 PM, 90 minutes duration
- **Start:** 7:00 PM
- **Actual End:** 8:30 PM
- **Visible Until:** 10:30 PM (8:30 PM + 2 hours)

### Scenario 2: Short Game
- **Game:** Tennis, 3:00 PM, 60 minutes duration
- **Start:** 3:00 PM
- **Actual End:** 4:00 PM
- **Visible Until:** 6:00 PM (4:00 PM + 2 hours)

### Scenario 3: Long Game
- **Game:** Hiking, 8:00 AM, 240 minutes (4 hours) duration
- **Start:** 8:00 AM
- **Actual End:** 12:00 PM
- **Visible Until:** 2:00 PM (12:00 PM + 2 hours)

## Configuration

### Adjusting the Buffer Time
To change the 2-hour buffer, update the default value in `dateUtils.ts`:

```typescript
export function isGameActive(
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 120,
  bufferMinutes: number = 120  // ← Change this value
): boolean
```

### Custom Buffer for Specific Games
You can pass a custom buffer when calling the function:

```typescript
// 4-hour buffer for tournament events
isGameActive(game.date, game.time, game.duration, 240)
```

## Future Enhancements

### Potential Improvements
1. **Dynamic Buffer Based on Game Type**
   - Tournaments: 4-hour buffer
   - Casual games: 2-hour buffer
   - Practice sessions: 1-hour buffer

2. **User-Specific Retention**
   - Participants see games longer (e.g., 24 hours)
   - Non-participants see normal retention

3. **Smart Scheduling**
   - Implement pg_cron for automatic database archival
   - Add monitoring for archival job status

## Related Documentation
- Business Rules: `.cursor/rules/game-management-models.mdc`
- Database Schema: `docs/DATABASE_SCHEMA.md`
- Migration File: `supabase/migrations/20250913170000_add_game_archiving.sql`

## Change History
- **2024-11-29:** Implemented duration-based retention (end time + 2 hour buffer)
- **Previous:** Games hidden immediately after start time

