-- Fix game_participants table conflict
-- This migration handles the case where game_participants already exists

-- First, check if the table exists and rename if needed
DO $$ 
BEGIN
    -- If game_participants exists but doesn't have the stats tracking columns, add them
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_participants' AND table_schema = 'public') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_participants' AND column_name = 'status' AND table_schema = 'public') THEN
            ALTER TABLE public.game_participants ADD COLUMN status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'completed'));
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_participants' AND column_name = 'joined_at' AND table_schema = 'public') THEN
            ALTER TABLE public.game_participants ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_participants' AND column_name = 'left_at' AND table_schema = 'public') THEN
            ALTER TABLE public.game_participants ADD COLUMN left_at TIMESTAMPTZ;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_participants' AND column_name = 'play_time_minutes' AND table_schema = 'public') THEN
            ALTER TABLE public.game_participants ADD COLUMN play_time_minutes INTEGER DEFAULT 0;
        END IF;
        
        -- Update existing records to have 'joined' status if they don't have one
        UPDATE public.game_participants SET status = 'joined' WHERE status IS NULL;
        
        -- Ensure RLS is enabled
        ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies if they don't exist
        DO $policy$
        BEGIN
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
        
        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON public.game_participants(user_id);
        CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON public.game_participants(game_id);
        CREATE INDEX IF NOT EXISTS idx_game_participants_status ON public.game_participants(status);
        CREATE INDEX IF NOT EXISTS idx_game_participants_joined_at ON public.game_participants(joined_at);
    END IF;
END $$;
