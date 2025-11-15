-- Verify and fix game_participants status column
-- This migration ensures the status column exists and has the correct constraint
-- Safe to run multiple times - uses IF NOT EXISTS checks

DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'status' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN status TEXT DEFAULT 'joined' 
        CHECK (status IN ('joined', 'left', 'completed', 'no_show'));
        
        -- Update existing records to have 'joined' status
        UPDATE public.game_participants 
        SET status = 'joined' 
        WHERE status IS NULL;
        
        RAISE NOTICE 'Added status column to game_participants';
    ELSE
        -- Column exists, verify constraint includes all required values
        -- Drop and recreate constraint if needed (PostgreSQL doesn't support ALTER CONSTRAINT easily)
        -- This is safe because we're only changing allowed values, not removing the column
        BEGIN
            ALTER TABLE public.game_participants 
            DROP CONSTRAINT IF EXISTS game_participants_status_check;
            
            ALTER TABLE public.game_participants 
            ADD CONSTRAINT game_participants_status_check 
            CHECK (status IN ('joined', 'left', 'completed', 'no_show'));
            
            RAISE NOTICE 'Updated status constraint to include all required values';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not update constraint, may need manual intervention: %', SQLERRM;
        END;
    END IF;
    
    -- Add other missing columns if they don't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'joined_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
        
        UPDATE public.game_participants 
        SET joined_at = COALESCE(created_at, NOW()) 
        WHERE joined_at IS NULL;
        
        RAISE NOTICE 'Added joined_at column to game_participants';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'left_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN left_at TIMESTAMPTZ;
        
        RAISE NOTICE 'Added left_at column to game_participants';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'play_time_minutes' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN play_time_minutes INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added play_time_minutes column to game_participants';
    END IF;
    
    -- Ensure RLS is enabled
    ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
    
    -- Create indexes for performance if they don't exist
    CREATE INDEX IF NOT EXISTS idx_game_participants_user_id 
    ON public.game_participants(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_game_participants_game_id 
    ON public.game_participants(game_id);
    
    CREATE INDEX IF NOT EXISTS idx_game_participants_status 
    ON public.game_participants(status);
    
    CREATE INDEX IF NOT EXISTS idx_game_participants_joined_at 
    ON public.game_participants(joined_at);
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

-- Verification query (for manual checking)
-- Run this after migration to verify:
/*
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'game_participants'
  AND column_name IN ('status', 'joined_at', 'left_at', 'play_time_minutes')
ORDER BY column_name;
*/

