# Public RSVP Counter - SQL Setup

Run these SQL statements in your Supabase dashboard to complete the public RSVP implementation.

## 1. Ensure the column exists (if not already present)

```sql
-- Add public_rsvp_count column to games table if it doesn't exist
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS public_rsvp_count INTEGER DEFAULT 0;
```

## 2. Create trigger function to auto-maintain the counter

```sql
-- Function to update public_rsvp_count when public_rsvps changes
CREATE OR REPLACE FUNCTION update_public_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.attending = true AND NEW.status = 'confirmed' THEN
      UPDATE games 
      SET public_rsvp_count = public_rsvp_count + 1 
      WHERE id = NEW.game_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Was not counted, now should be
    IF (OLD.attending != true OR OLD.status != 'confirmed') AND 
       (NEW.attending = true AND NEW.status = 'confirmed') THEN
      UPDATE games 
      SET public_rsvp_count = public_rsvp_count + 1 
      WHERE id = NEW.game_id;
    END IF;

    -- Was counted, now shouldn't be
    IF (OLD.attending = true AND OLD.status = 'confirmed') AND 
       (NEW.attending != true OR NEW.status != 'confirmed') THEN
      UPDATE games 
      SET public_rsvp_count = public_rsvp_count - 1 
      WHERE id = NEW.game_id;
    END IF;

    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    IF OLD.attending = true AND OLD.status = 'confirmed' THEN
      UPDATE games 
      SET public_rsvp_count = GREATEST(0, public_rsvp_count - 1)
      WHERE id = OLD.game_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## 3. Create triggers on public_rsvps table

```sql
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_public_rsvp_count_trigger ON public.public_rsvps;

-- Create trigger for INSERT, UPDATE, DELETE
CREATE TRIGGER update_public_rsvp_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.public_rsvps
FOR EACH ROW
EXECUTE FUNCTION update_public_rsvp_count();
```

## 4. Backfill existing data (one-time operation)

```sql
-- Update existing games with correct public_rsvp_count
UPDATE games g
SET public_rsvp_count = (
  SELECT COUNT(*)
  FROM public_rsvps pr
  WHERE pr.game_id = g.id
    AND pr.attending = true
    AND pr.status = 'confirmed'
);
```

## 5. Verify RLS policies allow reading public_rsvp_count

```sql
-- Ensure authenticated users can read public_rsvp_count from games
-- Check existing SELECT policy on games table includes public_rsvp_count
-- If you have a SELECT policy like:
-- CREATE POLICY "Enable read access for authenticated users" ON games FOR SELECT USING (auth.role() = 'authenticated');
-- This already allows reading public_rsvp_count

-- For anonymous access (if needed for public game pages):
-- CREATE POLICY "Enable read for public games" ON games FOR SELECT USING (true);
```

## 6. Confirm indexes for performance

```sql
-- Ensure PK exists on games (should already exist)
-- Confirm indexes for common filters:

-- Index on date for chronological queries
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);

-- Composite index if you sort by date and created_at together
CREATE INDEX IF NOT EXISTS idx_games_date_created ON games(date, created_at);

-- Index on game_id in public_rsvps for faster count aggregations
CREATE INDEX IF NOT EXISTS idx_public_rsvps_game_id ON public_rsvps(game_id) 
WHERE attending = true AND status = 'confirmed';
```

## Testing

After running the SQL, test the implementation:

1. **Create a public RSVP**: Add a row to `public_rsvps` with `attending=true` and `status='confirmed'`
2. **Verify the count**: Check that `games.public_rsvp_count` increments
3. **Update RSVP**: Change `attending` or `status` and verify count updates
4. **Delete RSVP**: Delete the row and verify count decrements (never goes below 0)

## What Changed in the Code

All code changes have been completed:

- ✅ Added `publicRsvpCount` field to Game type
- ✅ Updated all game queries to select `public_rsvp_count`
- ✅ Added "+N public" badge to game cards in lists
- ✅ Added "+N public RSVPs" badge to game detail page
- ✅ Game transform function includes `publicRsvpCount`
- ✅ Creator dashboard automatically shows it via updated game cards

The badges only appear when `publicRsvpCount > 0`, keeping the UI clean.

