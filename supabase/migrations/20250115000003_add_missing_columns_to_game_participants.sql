-- Add missing columns to existing game_participants table
-- This handles the case where game_participants exists but is missing stats tracking columns

DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'game_participants' 
                   AND column_name = 'status' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'completed'));
        
        -- Update existing records to have 'joined' status
        UPDATE public.game_participants SET status = 'joined' WHERE status IS NULL;
    END IF;
    
    -- Add joined_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'game_participants' 
                   AND column_name = 'joined_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Set joined_at to created_at for existing records, or NOW() if created_at doesn't exist
        UPDATE public.game_participants 
        SET joined_at = COALESCE(created_at, NOW()) 
        WHERE joined_at IS NULL;
    END IF;
    
    -- Add left_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'game_participants' 
                   AND column_name = 'left_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN left_at TIMESTAMPTZ;
    END IF;
    
    -- Add play_time_minutes column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'game_participants' 
                   AND column_name = 'play_time_minutes' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.game_participants 
        ADD COLUMN play_time_minutes INTEGER DEFAULT 0;
    END IF;
    
    -- Ensure RLS is enabled
    ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
    
    -- Create indexes for performance if they don't exist
    CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON public.game_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON public.game_participants(game_id);
    CREATE INDEX IF NOT EXISTS idx_game_participants_status ON public.game_participants(status);
    CREATE INDEX IF NOT EXISTS idx_game_participants_joined_at ON public.game_participants(joined_at);
    
END $$;

-- Create RLS policies if they don't exist
DO $policy$
BEGIN
    -- Check and create policies only if they don't exist
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'game_participants' AND policyname = 'Users can view all participation') THEN
        CREATE POLICY "Users can view all participation" ON public.game_participants FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'game_participants' AND policyname = 'Users can update their own participation') THEN
        CREATE POLICY "Users can update their own participation" ON public.game_participants 
        FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'game_participants' AND policyname = 'Users can insert their own participation') THEN
        CREATE POLICY "Users can insert their own participation" ON public.game_participants 
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $policy$;
