-- Automatic Achievement System
-- Creates triggers to award achievements when users reach milestones

-- ============================================================================
-- 1. CREATE ACHIEVEMENT EVALUATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.evaluate_and_award_achievements(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    games_played_count INTEGER;
    games_hosted_count INTEGER;
    total_play_minutes INTEGER;
    achievement_record RECORD;
BEGIN
    -- Get user's current stats
    SELECT 
        COUNT(CASE WHEN gp.user_id = target_user_id THEN 1 END) as played_count,
        COUNT(CASE WHEN g.creator_id = target_user_id THEN 1 END) as hosted_count,
        COALESCE(SUM(CASE WHEN gp.user_id = target_user_id THEN g.duration END), 0) as total_minutes
    INTO games_played_count, games_hosted_count, total_play_minutes
    FROM games g
    LEFT JOIN game_participants gp ON g.id = gp.game_id
    WHERE g.creator_id = target_user_id OR gp.user_id = target_user_id;

    RAISE NOTICE 'User % stats: played=%, hosted=%, minutes=%', 
        target_user_id, games_played_count, games_hosted_count, total_play_minutes;

    -- Check and award achievements
    
    -- 1. First Game (10 pts) - Host or join your first game
    IF games_played_count >= 1 THEN
        INSERT INTO user_achievements (user_id, achievement_id, earned_at, points_earned)
        SELECT target_user_id, id, NOW(), 10
        FROM achievements 
        WHERE title = 'First Game'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = target_user_id 
            AND ua.achievement_id = achievements.id
        );
    END IF;

    -- 2. Team Player (50 pts) - Participate in 10 games
    IF games_played_count >= 10 THEN
        INSERT INTO user_achievements (user_id, achievement_id, earned_at, points_earned)
        SELECT target_user_id, id, NOW(), 50
        FROM achievements 
        WHERE title = 'Team Player'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = target_user_id 
            AND ua.achievement_id = achievements.id
        );
    END IF;

    -- 3. Host with the Most (40 pts) - Host 5 games
    IF games_hosted_count >= 5 THEN
        INSERT INTO user_achievements (user_id, achievement_id, earned_at, points_earned)
        SELECT target_user_id, id, NOW(), 40
        FROM achievements 
        WHERE title = 'Host with the Most'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = target_user_id 
            AND ua.achievement_id = achievements.id
        );
    END IF;

    -- 4. Marathoner (75 pts) - Accumulate 500 minutes of play
    IF total_play_minutes >= 500 THEN
        INSERT INTO user_achievements (user_id, achievement_id, earned_at, points_earned)
        SELECT target_user_id, id, NOW(), 75
        FROM achievements 
        WHERE title = 'Marathoner'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = target_user_id 
            AND ua.achievement_id = achievements.id
        );
    END IF;

    -- Log any new achievements awarded
    FOR achievement_record IN 
        SELECT a.title, ua.points_earned, ua.earned_at
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = target_user_id
        AND ua.earned_at >= NOW() - INTERVAL '1 second'
    LOOP
        RAISE NOTICE 'Awarded achievement: % (% pts) to user %', 
            achievement_record.title, achievement_record.points_earned, target_user_id;
    END LOOP;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error evaluating achievements for user %: %', target_user_id, SQLERRM;
END;
$$;

-- ============================================================================
-- 2. CREATE TRIGGER FUNCTIONS
-- ============================================================================

-- Trigger function for game_participants changes (joining/leaving games)
CREATE OR REPLACE FUNCTION public.trigger_achievement_check_on_participation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check achievements for the user who joined/left
    IF TG_OP = 'INSERT' THEN
        -- User joined a game
        PERFORM public.evaluate_and_award_achievements(NEW.user_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- User left a game (re-evaluate in case they lost an achievement)
        PERFORM public.evaluate_and_award_achievements(OLD.user_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Trigger function for games changes (creating/updating games)
CREATE OR REPLACE FUNCTION public.trigger_achievement_check_on_game_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check achievements for the game creator
    IF TG_OP = 'INSERT' THEN
        -- New game created
        PERFORM public.evaluate_and_award_achievements(NEW.creator_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Game updated (duration might have changed)
        PERFORM public.evaluate_and_award_achievements(NEW.creator_id);
        -- If creator changed, check both old and new
        IF OLD.creator_id != NEW.creator_id THEN
            PERFORM public.evaluate_and_award_achievements(OLD.creator_id);
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 3. CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_achievement_on_game_participation ON public.game_participants;
DROP TRIGGER IF EXISTS trigger_achievement_on_game_creation ON public.games;

-- Trigger on game_participants table (when users join/leave games)
CREATE TRIGGER trigger_achievement_on_game_participation
    AFTER INSERT OR DELETE ON public.game_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_achievement_check_on_participation();

-- Trigger on games table (when games are created/updated)
CREATE TRIGGER trigger_achievement_on_game_creation
    AFTER INSERT OR UPDATE ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_achievement_check_on_game_change();

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.evaluate_and_award_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_achievement_check_on_participation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_achievement_check_on_game_change() TO authenticated;

-- ============================================================================
-- 5. TEST THE SYSTEM (Optional - run manually to test)
-- ============================================================================

-- Test function to manually evaluate achievements for a specific user
CREATE OR REPLACE FUNCTION public.test_achievements_for_user(test_user_id UUID)
RETURNS TABLE(
    achievement_title TEXT,
    points_earned INTEGER,
    earned_at TIMESTAMPTZ,
    user_stats JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    games_played INTEGER;
    games_hosted INTEGER;
    total_minutes INTEGER;
BEGIN
    -- Get current stats
    SELECT 
        COUNT(CASE WHEN gp.user_id = test_user_id THEN 1 END),
        COUNT(CASE WHEN g.creator_id = test_user_id THEN 1 END),
        COALESCE(SUM(CASE WHEN gp.user_id = test_user_id THEN g.duration END), 0)
    INTO games_played, games_hosted, total_minutes
    FROM games g
    LEFT JOIN game_participants gp ON g.id = gp.game_id
    WHERE g.creator_id = test_user_id OR gp.user_id = test_user_id;

    -- Run achievement evaluation
    PERFORM public.evaluate_and_award_achievements(test_user_id);

    -- Return results
    RETURN QUERY
    SELECT 
        a.title::TEXT,
        ua.points_earned,
        ua.earned_at,
        json_build_object(
            'games_played', games_played,
            'games_hosted', games_hosted,
            'total_minutes', total_minutes
        )
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = test_user_id
    ORDER BY ua.earned_at DESC;
END;
$$;

-- Grant permission for testing
GRANT EXECUTE ON FUNCTION public.test_achievements_for_user(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if triggers were created successfully
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%achievement%'
ORDER BY event_object_table, trigger_name;

-- Check if functions were created successfully
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%achievement%'
ORDER BY routine_name;
