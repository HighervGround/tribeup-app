-- Create game rating and review system for post-game player feedback
-- This migration creates the rating and review functionality

-- 1. Create game_reviews table
CREATE TABLE IF NOT EXISTS public.game_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Ratings (1-5 scale)
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  organization_rating integer CHECK (organization_rating >= 1 AND organization_rating <= 5),
  skill_level_rating integer CHECK (skill_level_rating >= 1 AND skill_level_rating <= 5),
  fun_rating integer CHECK (fun_rating >= 1 AND fun_rating <= 5),
  
  -- Written review
  review_text text,
  
  -- Review metadata
  would_play_again boolean DEFAULT true,
  recommend_to_others boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  UNIQUE(game_id, reviewer_id)
);

-- 2. Create player_ratings table for peer-to-peer ratings
CREATE TABLE IF NOT EXISTS public.player_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rated_player_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Player-specific ratings
  skill_rating integer NOT NULL CHECK (skill_rating >= 1 AND skill_rating <= 5),
  sportsmanship_rating integer NOT NULL CHECK (sportsmanship_rating >= 1 AND sportsmanship_rating <= 5),
  communication_rating integer NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
  
  -- Optional feedback
  feedback_text text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  UNIQUE(game_id, rater_id, rated_player_id),
  CHECK (rater_id != rated_player_id) -- Can't rate yourself
);

-- 3. Create game_rating_summary table for aggregated ratings
CREATE TABLE IF NOT EXISTS public.game_rating_summary (
  game_id uuid PRIMARY KEY REFERENCES public.games(id) ON DELETE CASCADE,
  
  -- Aggregated game ratings
  total_reviews integer DEFAULT 0,
  avg_overall_rating numeric(3,2),
  avg_organization_rating numeric(3,2),
  avg_skill_level_rating numeric(3,2),
  avg_fun_rating numeric(3,2),
  
  -- Recommendation stats
  would_play_again_count integer DEFAULT 0,
  recommend_count integer DEFAULT 0,
  
  -- Timestamps
  last_updated timestamp with time zone DEFAULT now()
);

-- 4. Create user_rating_summary table for player reputation
CREATE TABLE IF NOT EXISTS public.user_rating_summary (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Aggregated player ratings
  total_ratings_received integer DEFAULT 0,
  avg_skill_rating numeric(3,2),
  avg_sportsmanship_rating numeric(3,2),
  avg_communication_rating numeric(3,2),
  avg_overall_player_rating numeric(3,2),
  
  -- Games organized stats
  games_organized integer DEFAULT 0,
  avg_game_rating numeric(3,2),
  
  -- Timestamps
  last_updated timestamp with time zone DEFAULT now()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_reviews_game_id ON public.game_reviews(game_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_reviewer_id ON public.game_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_rating ON public.game_reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_player_ratings_game_id ON public.player_ratings(game_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_rater_id ON public.player_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_rated_player_id ON public.player_ratings(rated_player_id);

-- 6. Enable RLS
ALTER TABLE public.game_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rating_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rating_summary ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for game_reviews
CREATE POLICY "Users can view all game reviews" ON public.game_reviews
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews for games they participated in" ON public.game_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.game_participants 
      WHERE game_id = game_reviews.game_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reviews" ON public.game_reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can delete their own reviews" ON public.game_reviews
  FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid());

-- 8. Create RLS policies for player_ratings
CREATE POLICY "Users can view player ratings" ON public.player_ratings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can rate other players from games they participated in" ON public.player_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    rater_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.game_participants 
      WHERE game_id = player_ratings.game_id AND user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.game_participants 
      WHERE game_id = player_ratings.game_id AND user_id = player_ratings.rated_player_id
    )
  );

CREATE POLICY "Users can update their own player ratings" ON public.player_ratings
  FOR UPDATE TO authenticated
  USING (rater_id = auth.uid())
  WITH CHECK (rater_id = auth.uid());

-- 9. Create RLS policies for summary tables
CREATE POLICY "Users can view game rating summaries" ON public.game_rating_summary
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view user rating summaries" ON public.user_rating_summary
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can manage rating summaries" ON public.game_rating_summary
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "System can manage user summaries" ON public.user_rating_summary
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 10. Function to submit game review
CREATE OR REPLACE FUNCTION public.submit_game_review(
  p_game_id uuid,
  p_overall_rating integer,
  p_organization_rating integer DEFAULT NULL,
  p_skill_level_rating integer DEFAULT NULL,
  p_fun_rating integer DEFAULT NULL,
  p_review_text text DEFAULT NULL,
  p_would_play_again boolean DEFAULT true,
  p_recommend_to_others boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  review_id uuid;
  game_date date;
  game_time time;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if user participated in the game
  IF NOT EXISTS (
    SELECT 1 FROM public.game_participants 
    WHERE game_id = p_game_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'You can only review games you participated in';
  END IF;

  -- Check if game has already occurred
  SELECT date, time INTO game_date, game_time
  FROM public.games WHERE id = p_game_id;
  
  IF game_date > CURRENT_DATE OR 
     (game_date = CURRENT_DATE AND game_time > CURRENT_TIME) THEN
    RAISE EXCEPTION 'You can only review games that have already occurred';
  END IF;

  -- Insert or update review
  INSERT INTO public.game_reviews (
    game_id, reviewer_id, overall_rating, organization_rating,
    skill_level_rating, fun_rating, review_text, would_play_again, recommend_to_others
  ) VALUES (
    p_game_id, current_user_id, p_overall_rating, p_organization_rating,
    p_skill_level_rating, p_fun_rating, p_review_text, p_would_play_again, p_recommend_to_others
  )
  ON CONFLICT (game_id, reviewer_id) DO UPDATE SET
    overall_rating = EXCLUDED.overall_rating,
    organization_rating = EXCLUDED.organization_rating,
    skill_level_rating = EXCLUDED.skill_level_rating,
    fun_rating = EXCLUDED.fun_rating,
    review_text = EXCLUDED.review_text,
    would_play_again = EXCLUDED.would_play_again,
    recommend_to_others = EXCLUDED.recommend_to_others,
    updated_at = now()
  RETURNING id INTO review_id;

  -- Update game rating summary
  PERFORM public.update_game_rating_summary(p_game_id);

  -- Update organizer's user rating summary
  PERFORM public.update_user_rating_summary_for_organizer(p_game_id);

  RETURN review_id;
END;
$$;

-- 11. Function to submit player rating
CREATE OR REPLACE FUNCTION public.submit_player_rating(
  p_game_id uuid,
  p_rated_player_id uuid,
  p_skill_rating integer,
  p_sportsmanship_rating integer,
  p_communication_rating integer,
  p_feedback_text text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  rating_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if both users participated in the game
  IF NOT EXISTS (
    SELECT 1 FROM public.game_participants 
    WHERE game_id = p_game_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'You can only rate players from games you participated in';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.game_participants 
    WHERE game_id = p_game_id AND user_id = p_rated_player_id
  ) THEN
    RAISE EXCEPTION 'You can only rate players who participated in the same game';
  END IF;

  -- Insert or update rating
  INSERT INTO public.player_ratings (
    game_id, rater_id, rated_player_id, skill_rating,
    sportsmanship_rating, communication_rating, feedback_text
  ) VALUES (
    p_game_id, current_user_id, p_rated_player_id, p_skill_rating,
    p_sportsmanship_rating, p_communication_rating, p_feedback_text
  )
  ON CONFLICT (game_id, rater_id, rated_player_id) DO UPDATE SET
    skill_rating = EXCLUDED.skill_rating,
    sportsmanship_rating = EXCLUDED.sportsmanship_rating,
    communication_rating = EXCLUDED.communication_rating,
    feedback_text = EXCLUDED.feedback_text,
    created_at = now()
  RETURNING id INTO rating_id;

  -- Update user rating summary for the rated player
  PERFORM public.update_user_rating_summary(p_rated_player_id);

  RETURN rating_id;
END;
$$;

-- 12. Function to update game rating summary
CREATE OR REPLACE FUNCTION public.update_game_rating_summary(p_game_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  summary_data record;
BEGIN
  -- Calculate aggregated ratings
  SELECT 
    COUNT(*) as total_reviews,
    AVG(overall_rating) as avg_overall,
    AVG(organization_rating) as avg_organization,
    AVG(skill_level_rating) as avg_skill_level,
    AVG(fun_rating) as avg_fun,
    SUM(CASE WHEN would_play_again THEN 1 ELSE 0 END) as would_play_again_count,
    SUM(CASE WHEN recommend_to_others THEN 1 ELSE 0 END) as recommend_count
  INTO summary_data
  FROM public.game_reviews
  WHERE game_id = p_game_id;

  -- Insert or update summary
  INSERT INTO public.game_rating_summary (
    game_id, total_reviews, avg_overall_rating, avg_organization_rating,
    avg_skill_level_rating, avg_fun_rating, would_play_again_count, recommend_count
  ) VALUES (
    p_game_id, summary_data.total_reviews, summary_data.avg_overall,
    summary_data.avg_organization, summary_data.avg_skill_level,
    summary_data.avg_fun, summary_data.would_play_again_count, summary_data.recommend_count
  )
  ON CONFLICT (game_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    avg_overall_rating = EXCLUDED.avg_overall_rating,
    avg_organization_rating = EXCLUDED.avg_organization_rating,
    avg_skill_level_rating = EXCLUDED.avg_skill_level_rating,
    avg_fun_rating = EXCLUDED.avg_fun_rating,
    would_play_again_count = EXCLUDED.would_play_again_count,
    recommend_count = EXCLUDED.recommend_count,
    last_updated = now();
END;
$$;

-- 13. Function to update user rating summary
CREATE OR REPLACE FUNCTION public.update_user_rating_summary(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  player_summary record;
  organizer_summary record;
BEGIN
  -- Calculate player ratings received
  SELECT 
    COUNT(*) as total_ratings,
    AVG(skill_rating) as avg_skill,
    AVG(sportsmanship_rating) as avg_sportsmanship,
    AVG(communication_rating) as avg_communication,
    AVG((skill_rating + sportsmanship_rating + communication_rating) / 3.0) as avg_overall
  INTO player_summary
  FROM public.player_ratings
  WHERE rated_player_id = p_user_id;

  -- Calculate organizer ratings (games they created)
  SELECT 
    COUNT(DISTINCT g.id) as games_organized,
    AVG(grs.avg_overall_rating) as avg_game_rating
  INTO organizer_summary
  FROM public.games g
  LEFT JOIN public.game_rating_summary grs ON g.id = grs.game_id
  WHERE g.creator_id = p_user_id;

  -- Insert or update user summary
  INSERT INTO public.user_rating_summary (
    user_id, total_ratings_received, avg_skill_rating, avg_sportsmanship_rating,
    avg_communication_rating, avg_overall_player_rating, games_organized, avg_game_rating
  ) VALUES (
    p_user_id, COALESCE(player_summary.total_ratings, 0), player_summary.avg_skill,
    player_summary.avg_sportsmanship, player_summary.avg_communication,
    player_summary.avg_overall, COALESCE(organizer_summary.games_organized, 0),
    organizer_summary.avg_game_rating
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_ratings_received = EXCLUDED.total_ratings_received,
    avg_skill_rating = EXCLUDED.avg_skill_rating,
    avg_sportsmanship_rating = EXCLUDED.avg_sportsmanship_rating,
    avg_communication_rating = EXCLUDED.avg_communication_rating,
    avg_overall_player_rating = EXCLUDED.avg_overall_player_rating,
    games_organized = EXCLUDED.games_organized,
    avg_game_rating = EXCLUDED.avg_game_rating,
    last_updated = now();
END;
$$;

-- 14. Function to update organizer rating when game is reviewed
CREATE OR REPLACE FUNCTION public.update_user_rating_summary_for_organizer(p_game_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  organizer_id uuid;
BEGIN
  -- Get game organizer
  SELECT creator_id INTO organizer_id
  FROM public.games WHERE id = p_game_id;

  IF organizer_id IS NOT NULL THEN
    PERFORM public.update_user_rating_summary(organizer_id);
  END IF;
END;
$$;

-- 15. Function to get reviewable games for a user
CREATE OR REPLACE FUNCTION public.get_reviewable_games(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  game_id uuid,
  game_title text,
  game_date date,
  game_time time,
  sport text,
  has_reviewed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := COALESCE(p_user_id, auth.uid());
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    g.id,
    g.title,
    g.date,
    g.time,
    g.sport,
    (gr.id IS NOT NULL) as has_reviewed
  FROM public.games g
  INNER JOIN public.game_participants gp ON g.id = gp.game_id
  LEFT JOIN public.game_reviews gr ON g.id = gr.game_id AND gr.reviewer_id = current_user_id
  WHERE gp.user_id = current_user_id
    AND (g.date < CURRENT_DATE OR (g.date = CURRENT_DATE AND g.time < CURRENT_TIME))
  ORDER BY g.date DESC, g.time DESC;
END;
$$;

-- 16. Trigger to automatically update summaries
CREATE OR REPLACE FUNCTION public.handle_review_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.update_game_rating_summary(NEW.game_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_game_rating_summary(OLD.game_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_player_rating_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.update_user_rating_summary(NEW.rated_player_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_user_rating_summary(OLD.rated_player_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_review_changes ON public.game_reviews;
CREATE TRIGGER trigger_review_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.game_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_changes();

DROP TRIGGER IF EXISTS trigger_player_rating_changes ON public.player_ratings;
CREATE TRIGGER trigger_player_rating_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.player_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_player_rating_changes();

-- 17. Grant permissions
GRANT EXECUTE ON FUNCTION public.submit_game_review(uuid, integer, integer, integer, integer, text, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_player_rating(uuid, uuid, integer, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_game_rating_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_rating_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_rating_summary_for_organizer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reviewable_games(uuid) TO authenticated;
