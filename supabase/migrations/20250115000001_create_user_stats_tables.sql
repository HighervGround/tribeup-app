-- Create user_stats table for tracking user statistics
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0,
    games_hosted INTEGER DEFAULT 0,
    total_play_time_minutes INTEGER DEFAULT 0,
    favorite_sport TEXT,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Create game_participation table for detailed participation tracking
CREATE TABLE IF NOT EXISTS public.game_participation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'completed')),
    play_time_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);

-- Create achievements table for tracking user achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    category TEXT NOT NULL,
    criteria JSONB NOT NULL, -- Store achievement criteria as JSON
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table for tracking which users have earned which achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    progress JSONB, -- Store progress data for partial achievements
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_stats
CREATE POLICY "Users can view all stats" ON public.user_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own stats" ON public.user_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for game_participation
CREATE POLICY "Users can view all participation" ON public.game_participation
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own participation" ON public.game_participation
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participation" ON public.game_participation
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for achievements
CREATE POLICY "Everyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

-- Create RLS policies for user_achievements
CREATE POLICY "Users can view all user achievements" ON public.user_achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_activity ON public.user_stats(last_activity);

CREATE INDEX IF NOT EXISTS idx_game_participation_user_id ON public.game_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participation_game_id ON public.game_participation(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participation_status ON public.game_participation(status);
CREATE INDEX IF NOT EXISTS idx_game_participation_joined_at ON public.game_participation(joined_at);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON public.achievements(is_active);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON public.user_achievements(earned_at);

-- Create function to update user stats when participation changes
CREATE OR REPLACE FUNCTION update_user_stats_on_participation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user stats when participation is inserted or updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.user_stats (user_id, games_played, last_activity)
        VALUES (NEW.user_id, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            games_played = CASE 
                WHEN NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') 
                THEN user_stats.games_played + 1
                ELSE user_stats.games_played
            END,
            last_activity = NOW(),
            updated_at = NOW();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for participation changes
CREATE TRIGGER trigger_update_user_stats_on_participation
    AFTER INSERT OR UPDATE ON public.game_participation
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_on_participation();

-- Create function to update hosted games count
CREATE OR REPLICT FUNCTION update_hosted_games_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update hosted games count when a game is created
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.user_stats (user_id, games_hosted, last_activity)
        VALUES (NEW.created_by, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            games_hosted = user_stats.games_hosted + 1,
            last_activity = NOW(),
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hosted games
CREATE TRIGGER trigger_update_hosted_games_count
    AFTER INSERT ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION update_hosted_games_count();

-- Insert some default achievements
INSERT INTO public.achievements (name, description, icon, category, criteria, points) VALUES
('First Game', 'Play your first game', '🎮', 'participation', '{"games_played": 1}', 10),
('Game Host', 'Host your first game', '🏠', 'hosting', '{"games_hosted": 1}', 15),
('Regular Player', 'Play 10 games', '🏃', 'participation', '{"games_played": 10}', 50),
('Community Builder', 'Host 5 games', '🏗️', 'hosting', '{"games_hosted": 5}', 75),
('Sports Enthusiast', 'Play 25 games', '⚽', 'participation', '{"games_played": 25}', 100),
('Event Organizer', 'Host 10 games', '📅', 'hosting', '{"games_hosted": 10}', 150),
('Veteran Player', 'Play 50 games', '🏆', 'participation', '{"games_played": 50}', 200),
('Community Leader', 'Host 20 games', '👑', 'hosting', '{"games_hosted": 20}', 300);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON public.user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_participation_updated_at
    BEFORE UPDATE ON public.game_participation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
