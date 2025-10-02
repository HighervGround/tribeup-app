-- Create public view for column information
-- This replaces direct access to information_schema which PostgREST doesn't expose

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.v_columns;

-- Create the view with essential column information
CREATE VIEW public.v_columns AS 
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public';

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.v_columns TO authenticated, anon;

-- Create additional view for table information if needed
DROP VIEW IF EXISTS public.v_tables;

CREATE VIEW public.v_tables AS
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public';

-- Grant access
GRANT SELECT ON public.v_tables TO authenticated, anon;

-- Add status column to game_participants if it doesn't exist
-- This prevents the "status column does not exist" errors

-- Create enum type for participant status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_status') THEN
        CREATE TYPE participant_status AS ENUM ('joined', 'left', 'pending', 'confirmed');
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'game_participants' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN status participant_status DEFAULT 'joined';
        
        -- Add index for performance
        CREATE INDEX idx_game_participants_status 
        ON public.game_participants(status);
        
        -- Update existing records to have 'joined' status
        UPDATE public.game_participants 
        SET status = 'joined' 
        WHERE status IS NULL;
    END IF;
END $$;

-- Verify the views were created
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('v_columns', 'v_tables')
ORDER BY viewname;

-- Verify the status column was created
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM public.v_columns 
WHERE table_name = 'game_participants' 
AND column_name = 'status';
