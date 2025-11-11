-- Add duration_minutes column with automatic sync to duration interval
-- This eliminates client-side interval conversion issues and provides clean DX

-- 1) Add the duration_minutes column
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- 2) Backfill existing rows from interval to minutes
UPDATE public.games
SET duration_minutes = (EXTRACT(epoch FROM duration)::int / 60)
WHERE duration IS NOT NULL AND duration_minutes IS NULL;

-- 3) Create trigger function to keep both columns in sync
CREATE OR REPLACE FUNCTION public.sync_duration_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If minutes provided/changed, compute interval
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.duration_minutes IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes) THEN
    NEW.duration := make_interval(mins => NEW.duration_minutes);
  END IF;

  -- If interval provided/changed (fallback), compute minutes
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.duration IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.duration IS DISTINCT FROM OLD.duration) THEN
    NEW.duration_minutes := (EXTRACT(epoch FROM NEW.duration)::int / 60);
  END IF;

  RETURN NEW;
END;
$$;

-- 4) Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trg_sync_duration ON public.games;
CREATE TRIGGER trg_sync_duration
  BEFORE INSERT OR UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.sync_duration_columns();

-- 5) Add helpful constraint to ensure positive duration
ALTER TABLE public.games
  ADD CONSTRAINT IF NOT EXISTS duration_minutes_positive 
  CHECK (duration_minutes IS NULL OR duration_minutes > 0);

-- 6) Add comment for documentation
COMMENT ON COLUMN public.games.duration_minutes IS 'Game duration in minutes - automatically synced with duration interval column';

-- 7) Set default value for new games
ALTER TABLE public.games
  ALTER COLUMN duration_minutes SET DEFAULT 60;
