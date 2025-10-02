-- Database Security Cleanup and Hardening
-- This script safely cleans up unused functions and hardens existing ones

-- ============================================================================
-- STEP 1: Add Missing Critical Constraint
-- ============================================================================

-- Add unique constraint that your code expects but doesn't exist
ALTER TABLE public.game_participants 
ADD CONSTRAINT unique_game_user_participation 
UNIQUE (game_id, user_id);

-- ============================================================================
-- STEP 2: Harden Existing Functions (Keep Signatures, Add Security)
-- ============================================================================

-- Harden join_game function while keeping existing signature
CREATE OR REPLACE FUNCTION public.join_game(game_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    current_user_id uuid;
    game_exists boolean;
    is_full boolean;
    max_capacity integer;
    current_count integer;
BEGIN
    -- Get authenticated user ID
    current_user_id := auth.uid();
    
    -- Security check: must be authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to join games';
    END IF;
    
    -- Check if game exists and get capacity info
    SELECT 
        EXISTS(SELECT 1 FROM games WHERE id = game_uuid),
        COALESCE(max_players, 20),
        COALESCE(current_players, 0)
    INTO game_exists, max_capacity, current_count
    FROM games 
    WHERE id = game_uuid;
    
    IF NOT game_exists THEN
        RAISE EXCEPTION 'Game not found';
    END IF;
    
    -- Check if game is full
    IF current_count >= max_capacity THEN
        RAISE EXCEPTION 'Game is full (% / % players)', current_count, max_capacity;
    END IF;
    
    -- Join the game (unique constraint prevents duplicates)
    INSERT INTO game_participants (game_id, user_id)
    VALUES (game_uuid, current_user_id)
    ON CONFLICT (game_id, user_id) DO NOTHING;
    
    -- Update player count if we actually inserted
    IF FOUND THEN
        UPDATE games 
        SET current_players = current_players + 1 
        WHERE id = game_uuid;
    END IF;
    
EXCEPTION 
    WHEN unique_violation THEN
        -- User already joined, silently succeed
        RETURN;
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- Harden leave_game function while keeping existing signature  
CREATE OR REPLACE FUNCTION public.leave_game(game_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    current_user_id uuid;
    rows_deleted integer;
BEGIN
    -- Get authenticated user ID
    current_user_id := auth.uid();
    
    -- Security check: must be authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to leave games';
    END IF;
    
    -- Leave the game
    DELETE FROM game_participants 
    WHERE game_id = game_uuid AND user_id = current_user_id;
    
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    
    -- Update player count if we actually deleted
    IF rows_deleted > 0 THEN
        UPDATE games 
        SET current_players = GREATEST(current_players - 1, 0)
        WHERE id = game_uuid;
    END IF;
    
END;
$$;

-- ============================================================================
-- STEP 3: Drop All Unused Function Overloads
-- ============================================================================

-- Drop unused hardened overloads (we kept the legacy signatures your app uses)
DROP FUNCTION IF EXISTS public.join_game(p_user_id uuid, p_game_id uuid);
DROP FUNCTION IF EXISTS public.leave_game(p_user_id uuid, p_game_id uuid);

-- Drop completely unused functions
DROP FUNCTION IF EXISTS public.is_joined_to_game(p_user_id uuid, p_game_id uuid);
DROP FUNCTION IF EXISTS public.is_joined_to_game(game_uuid uuid);
DROP FUNCTION IF EXISTS public.admin_delete_game(p_admin_user_id uuid, p_game_id uuid);
DROP FUNCTION IF EXISTS public.admin_delete_game(game_id_param uuid, reason_param text);
DROP FUNCTION IF EXISTS public.admin_update_user_role(p_admin_user_id uuid, p_user_id uuid, p_new_role text);
DROP FUNCTION IF EXISTS public.admin_update_user_role(target_user_id uuid, new_role text);
DROP FUNCTION IF EXISTS public.create_dev_user(p_email text, p_username text, p_role text);
DROP FUNCTION IF EXISTS public.create_dev_user(user_id uuid, user_name text, user_username text, user_email text, user_bio text, user_location text);

-- Keep update_user_presence_updated_at() - it's used by triggers
-- Keep update_updated_at_column() - it's used by triggers

-- ============================================================================
-- STEP 4: Set Proper Security Permissions
-- ============================================================================

-- Revoke public access and grant only to authenticated users
REVOKE EXECUTE ON FUNCTION public.join_game(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_game(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.leave_game(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_game(uuid) TO authenticated;

-- ============================================================================
-- STEP 5: Add Performance Indexes (if not already present)
-- ============================================================================

-- Composite index for game participants (already exists in some migrations)
CREATE INDEX IF NOT EXISTS idx_game_participants_game_user 
ON public.game_participants(game_id, user_id);

-- Status index for filtering
CREATE INDEX IF NOT EXISTS idx_game_participants_status 
ON public.game_participants(status);

-- Games date index for filtering upcoming games
CREATE INDEX IF NOT EXISTS idx_games_date_only 
ON public.games(date);

-- ============================================================================
-- STEP 6: Optional - Add Data Integrity Check
-- ============================================================================

-- Function to reconcile player counts (run periodically if needed)
CREATE OR REPLACE FUNCTION public.reconcile_game_player_counts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fixed_count integer := 0;
BEGIN
    -- Update all game player counts based on actual participants
    UPDATE games 
    SET current_players = (
        SELECT COUNT(*) 
        FROM game_participants 
        WHERE game_id = games.id
    )
    WHERE current_players != (
        SELECT COUNT(*) 
        FROM game_participants 
        WHERE game_id = games.id
    );
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RETURN fixed_count;
END;
$$;

-- Grant execute to authenticated users for the reconcile function
REVOKE EXECUTE ON FUNCTION public.reconcile_game_player_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_game_player_counts() TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify functions exist with correct signatures
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('join_game', 'leave_game', 'update_user_presence_updated_at', 'update_updated_at_column')
ORDER BY p.proname, p.oid;

-- Verify unique constraint exists
SELECT 
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'game_participants' 
AND tc.constraint_type = 'UNIQUE';

-- Check permissions
SELECT 
    p.proname,
    pg_get_function_arguments(p.oid) as args,
    array_agg(pr.rolname) as granted_to
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_proc_acl pa ON p.oid = pa.objoid
LEFT JOIN pg_roles pr ON pa.grantee = pr.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('join_game', 'leave_game')
GROUP BY p.proname, p.oid
ORDER BY p.proname;
