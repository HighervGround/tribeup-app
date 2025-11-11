-- Option B: Add duration_minutes column with sync trigger
-- This provides clean integer handling while maintaining backward compatibility

-- Step 1: Add the new column
ALTER TABLE public.games
ADD COLUMN duration_minutes integer;

-- Step 2: Backfill from existing interval data
UPDATE public.games
SET duration_minutes = GREATEST(1, (EXTRACT(EPOCH FROM duration)::int / 60))
WHERE duration IS NOT NULL;

-- Step 3: Set default and make NOT NULL
ALTER TABLE public.games
ALTER COLUMN duration_minutes SET DEFAULT 60;

-- Update any remaining NULL values
UPDATE public.games
SET duration_minutes = 60
WHERE duration_minutes IS NULL;

-- Make column NOT NULL
ALTER TABLE public.games
ALTER COLUMN duration_minutes SET NOT NULL;

-- Step 4: Add positive check constraint
ALTER TABLE public.games
ADD CONSTRAINT games_duration_minutes_positive CHECK (duration_minutes > 0);

-- Step 5: Create sync trigger function
CREATE OR REPLACE FUNCTION public.sync_games_duration_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If minutes present/changed, derive interval
  IF NEW.duration_minutes IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes) THEN
    NEW.duration := make_interval(mins => NEW.duration_minutes);
    RETURN NEW;
  END IF;

  -- Else if interval present/changed, derive minutes
  IF NEW.duration IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.duration IS DISTINCT FROM OLD.duration) THEN
    NEW.duration_minutes := GREATEST(1, (EXTRACT(EPOCH FROM NEW.duration)::int / 60));
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 6: Create the trigger
DROP TRIGGER IF EXISTS trg_sync_games_duration ON public.games;

CREATE TRIGGER trg_sync_games_duration
BEFORE INSERT OR UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.sync_games_duration_columns();

-- Step 7: Add performance index
CREATE INDEX IF NOT EXISTS idx_games_duration_minutes ON public.games(duration_minutes);

-- Step 8: Add documentation
COMMENT ON COLUMN public.games.duration_minutes IS 'Game duration in minutes - automatically synced with duration interval column via trigger';
COMMENT ON FUNCTION public.sync_games_duration_columns() IS 'Keeps duration and duration_minutes columns in sync automatically';

-- Step 9: Validation query (for testing)
-- SELECT id, duration, duration_minutes, 
--        EXTRACT(EPOCH FROM duration)::int / 60 as computed_minutes
-- FROM public.games 
-- LIMIT 5;
