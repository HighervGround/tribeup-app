-- ELO Rating and Matchmaking System Migration
-- This creates tables for skill-based matchmaking with ELO ratings and automated moderation

-- 1. Player ELO Ratings Table (sport-specific ratings)
CREATE TABLE IF NOT EXISTS public.player_elo_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  sport text NOT NULL,
  elo_rating integer DEFAULT 1200 NOT NULL, -- Standard starting ELO
  games_played integer DEFAULT 0 NOT NULL,
  wins integer DEFAULT 0 NOT NULL,
  losses integer DEFAULT 0 NOT NULL,
  draws integer DEFAULT 0 NOT NULL,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, sport)
);

-- 2. Game Results Table (for ELO calculations)
CREATE TABLE IF NOT EXISTS public.game_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  result_type text NOT NULL CHECK (result_type IN ('completed', 'cancelled', 'no_show')),
  winning_team jsonb, -- Array of user IDs for team sports
  losing_team jsonb,  -- Array of user IDs for team sports
  individual_winner uuid REFERENCES public.users(id), -- For individual sports
  individual_loser uuid REFERENCES public.users(id),
  is_draw boolean DEFAULT false,
  recorded_by uuid REFERENCES public.users(id), -- Who recorded the result
  recorded_at timestamp with time zone DEFAULT now(),
  elo_changes jsonb, -- Store ELO changes for each player
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Player Behavior Tracking
CREATE TABLE IF NOT EXISTS public.player_behavior (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  behavior_type text NOT NULL CHECK (behavior_type IN ('no_show', 'late_arrival', 'early_leave', 'disruptive', 'positive', 'helpful')),
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  severity text DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'severe')),
  description text,
  reported_by uuid REFERENCES public.users(id),
  auto_detected boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Player Reputation System
CREATE TABLE IF NOT EXISTS public.player_reputation (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reputation_score integer DEFAULT 100 NOT NULL, -- 0-100 scale
  reliability_score integer DEFAULT 100 NOT NULL, -- Attendance/punctuality
  sportsmanship_score integer DEFAULT 100 NOT NULL, -- Behavior during games
  total_games integer DEFAULT 0 NOT NULL,
  no_shows integer DEFAULT 0 NOT NULL,
  late_arrivals integer DEFAULT 0 NOT NULL,
  positive_feedback integer DEFAULT 0 NOT NULL,
  negative_feedback integer DEFAULT 0 NOT NULL,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Automated Penalties System
CREATE TABLE IF NOT EXISTS public.player_penalties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  penalty_type text NOT NULL CHECK (penalty_type IN ('warning', 'temporary_ban', 'skill_restriction', 'reputation_penalty')),
  reason text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  duration_hours integer, -- NULL for permanent penalties
  active boolean DEFAULT true,
  auto_applied boolean DEFAULT false,
  applied_by uuid REFERENCES public.users(id),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Matchmaking Preferences
CREATE TABLE IF NOT EXISTS public.matchmaking_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  skill_matching_enabled boolean DEFAULT true,
  preferred_skill_range integer DEFAULT 200, -- ELO range for matching
  competitive_mode boolean DEFAULT false, -- Stricter skill matching
  allow_mixed_skill boolean DEFAULT true, -- Allow games with varied skill levels
  reputation_threshold integer DEFAULT 70, -- Minimum reputation to join games
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. Game Skill Requirements
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'mixed', 'competitive'));
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS min_elo_rating integer;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS max_elo_rating integer;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS min_reputation integer DEFAULT 70;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS competitive_mode boolean DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.player_elo_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ELO Ratings
CREATE POLICY "Users can view all ELO ratings" ON public.player_elo_ratings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own ELO ratings" ON public.player_elo_ratings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can insert ELO ratings" ON public.player_elo_ratings
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for Game Results
CREATE POLICY "Users can view game results" ON public.game_results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Game participants can insert results" ON public.game_results
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.game_participants 
      WHERE game_id = game_results.game_id AND user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM public.games 
      WHERE id = game_results.game_id AND creator_id = auth.uid()
    )
  );

-- RLS Policies for Player Behavior
CREATE POLICY "Users can view behavior reports" ON public.player_behavior
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can report behavior" ON public.player_behavior
  FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid() OR auto_detected = true);

-- RLS Policies for Reputation
CREATE POLICY "Users can view all reputations" ON public.player_reputation
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can update reputation" ON public.player_reputation
  FOR ALL TO authenticated USING (true);

-- RLS Policies for Penalties
CREATE POLICY "Users can view penalties" ON public.player_penalties
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));

CREATE POLICY "Moderators can manage penalties" ON public.player_penalties
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));

-- RLS Policies for Matchmaking Preferences
CREATE POLICY "Users can manage their own preferences" ON public.matchmaking_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_elo_ratings_user_sport ON public.player_elo_ratings(user_id, sport);
CREATE INDEX IF NOT EXISTS idx_player_elo_ratings_sport_rating ON public.player_elo_ratings(sport, elo_rating);
CREATE INDEX IF NOT EXISTS idx_game_results_game_id ON public.game_results(game_id);
CREATE INDEX IF NOT EXISTS idx_player_behavior_user_id ON public.player_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_player_behavior_game_id ON public.player_behavior(game_id);
CREATE INDEX IF NOT EXISTS idx_player_penalties_user_active ON public.player_penalties(user_id, active);
CREATE INDEX IF NOT EXISTS idx_games_skill_level ON public.games(skill_level);
CREATE INDEX IF NOT EXISTS idx_games_elo_range ON public.games(min_elo_rating, max_elo_rating);

-- Functions for ELO calculations
CREATE OR REPLACE FUNCTION public.calculate_elo_change(
  current_rating integer,
  opponent_rating integer,
  result numeric, -- 1 for win, 0.5 for draw, 0 for loss
  k_factor integer DEFAULT 32
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  expected_score numeric;
  rating_change integer;
BEGIN
  -- Calculate expected score using ELO formula
  expected_score := 1.0 / (1.0 + power(10.0, (opponent_rating - current_rating) / 400.0));
  
  -- Calculate rating change
  rating_change := round(k_factor * (result - expected_score));
  
  RETURN rating_change;
END;
$$;

-- Function to update player ELO after game
CREATE OR REPLACE FUNCTION public.update_player_elo(
  p_user_id uuid,
  p_sport text,
  p_opponent_rating integer,
  p_result numeric
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_elo integer;
  elo_change integer;
  new_elo integer;
BEGIN
  -- Get current ELO or create new rating
  SELECT elo_rating INTO current_elo
  FROM public.player_elo_ratings
  WHERE user_id = p_user_id AND sport = p_sport;
  
  IF current_elo IS NULL THEN
    current_elo := 1200; -- Default starting ELO
    INSERT INTO public.player_elo_ratings (user_id, sport, elo_rating)
    VALUES (p_user_id, p_sport, current_elo);
  END IF;
  
  -- Calculate ELO change
  elo_change := public.calculate_elo_change(current_elo, p_opponent_rating, p_result);
  new_elo := GREATEST(100, current_elo + elo_change); -- Minimum ELO of 100
  
  -- Update ELO rating
  UPDATE public.player_elo_ratings
  SET 
    elo_rating = new_elo,
    games_played = games_played + 1,
    wins = wins + CASE WHEN p_result = 1 THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN p_result = 0 THEN 1 ELSE 0 END,
    draws = draws + CASE WHEN p_result = 0.5 THEN 1 ELSE 0 END,
    last_updated = now()
  WHERE user_id = p_user_id AND sport = p_sport;
END;
$$;

-- Function to check if player meets game requirements
CREATE OR REPLACE FUNCTION public.player_meets_game_requirements(
  p_user_id uuid,
  p_game_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  game_record record;
  player_elo integer;
  player_reputation integer;
  active_penalties integer;
BEGIN
  -- Get game requirements
  SELECT skill_level, min_elo_rating, max_elo_rating, min_reputation, sport
  INTO game_record
  FROM public.games
  WHERE id = p_game_id;
  
  -- Get player ELO for this sport
  SELECT elo_rating INTO player_elo
  FROM public.player_elo_ratings
  WHERE user_id = p_user_id AND sport = game_record.sport;
  
  -- Default ELO if no rating exists
  IF player_elo IS NULL THEN
    player_elo := 1200;
  END IF;
  
  -- Get player reputation
  SELECT reputation_score INTO player_reputation
  FROM public.player_reputation
  WHERE user_id = p_user_id;
  
  -- Default reputation if no record exists
  IF player_reputation IS NULL THEN
    player_reputation := 100;
  END IF;
  
  -- Check for active penalties
  SELECT COUNT(*) INTO active_penalties
  FROM public.player_penalties
  WHERE user_id = p_user_id 
    AND active = true 
    AND (expires_at IS NULL OR expires_at > now());
  
  -- Check all requirements
  IF active_penalties > 0 THEN
    RETURN false;
  END IF;
  
  IF game_record.min_reputation IS NOT NULL AND player_reputation < game_record.min_reputation THEN
    RETURN false;
  END IF;
  
  IF game_record.min_elo_rating IS NOT NULL AND player_elo < game_record.min_elo_rating THEN
    RETURN false;
  END IF;
  
  IF game_record.max_elo_rating IS NOT NULL AND player_elo > game_record.max_elo_rating THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to automatically detect no-shows
CREATE OR REPLACE FUNCTION public.detect_no_shows()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  game_record record;
  participant_record record;
BEGIN
  -- Find games that ended more than 2 hours ago without results
  FOR game_record IN
    SELECT id, date, time, sport
    FROM public.games
    WHERE (date || ' ' || time)::timestamp < (now() - interval '2 hours')
      AND NOT EXISTS (
        SELECT 1 FROM public.game_results WHERE game_id = games.id
      )
  LOOP
    -- Mark all participants as potential no-shows
    FOR participant_record IN
      SELECT user_id
      FROM public.game_participants
      WHERE game_id = game_record.id
    LOOP
      -- Record no-show behavior
      INSERT INTO public.player_behavior (
        user_id, behavior_type, game_id, severity, 
        description, auto_detected
      ) VALUES (
        participant_record.user_id, 'no_show', game_record.id, 'moderate',
        'Automatically detected no-show for game on ' || game_record.date,
        true
      );
      
      -- Update reputation
      INSERT INTO public.player_reputation (user_id, no_shows, reputation_score)
      VALUES (participant_record.user_id, 1, 95)
      ON CONFLICT (user_id) DO UPDATE SET
        no_shows = player_reputation.no_shows + 1,
        reputation_score = GREATEST(0, player_reputation.reputation_score - 5),
        last_updated = now();
    END LOOP;
    
    -- Mark game as having no-show result
    INSERT INTO public.game_results (
      game_id, result_type, recorded_by
    ) VALUES (
      game_record.id, 'no_show', NULL
    );
  END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.calculate_elo_change TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_player_elo TO authenticated;
GRANT EXECUTE ON FUNCTION public.player_meets_game_requirements TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_no_shows TO service_role;

-- Create a scheduled job to run no-show detection (requires pg_cron extension)
-- This would typically be set up separately in production
-- SELECT cron.schedule('detect-no-shows', '0 */2 * * *', 'SELECT public.detect_no_shows();');
