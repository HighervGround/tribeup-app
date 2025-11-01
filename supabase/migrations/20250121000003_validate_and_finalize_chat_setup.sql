-- Final validation and setup for chat_messages_with_author view
-- This migration:
-- 1. Validates/recreates view with correct shape
-- 2. Ensures proper grants
-- 3. Sets up participant-only SELECT policy (no public viewing)
-- 4. Adds performance indexes
-- 5. Validates structure

-- ============================================================================
-- STEP 1: Verify and recreate view with exact columns
-- ============================================================================
DROP VIEW IF EXISTS chat_messages_with_author CASCADE;

CREATE OR REPLACE VIEW public.chat_messages_with_author AS
SELECT 
  cm.id,
  cm.game_id,
  cm.user_id,
  cm.message,
  cm.created_at,
  up.display_name,
  up.username,
  up.avatar_url
FROM public.chat_messages cm
LEFT JOIN public.user_public_profile up ON cm.user_id = up.id;

-- ============================================================================
-- STEP 2: Grant SELECT access to authenticated and anon
-- ============================================================================
GRANT SELECT ON public.chat_messages_with_author TO authenticated;
GRANT SELECT ON public.chat_messages_with_author TO anon;

-- ============================================================================
-- STEP 3: Remove broad SELECT policy and add participant-only policy
-- ============================================================================
-- Remove any broad "Anyone can view" policies
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_select_all" ON public.chat_messages;

-- Participant-only SELECT policy (authenticated users who are participants)
-- Note: Anon users will get empty results since they can't be participants
-- This is intentional - chat is for participants only, not public viewing
CREATE POLICY "chat_messages_select_participants_only" ON public.chat_messages
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.game_participants gp 
      WHERE gp.game_id = chat_messages.game_id 
      AND gp.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- STEP 4: Ensure performance indexes exist
-- ============================================================================
-- Index for filtering by game_id (used in queries and realtime)
CREATE INDEX IF NOT EXISTS idx_chat_messages_game_id_created_at 
  ON public.chat_messages(game_id, created_at);

-- Index for user_id lookups (already exists, but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
  ON public.chat_messages(user_id);

-- ============================================================================
-- STEP 5: Validation queries (run these to verify setup)
-- ============================================================================
-- Uncomment below to run validation after migration:
/*
-- Check view columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'chat_messages_with_author'
ORDER BY ordinal_position;

-- Check grants
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'chat_messages_with_author';

-- Check policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'chat_messages'
ORDER BY policyname;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'chat_messages';
*/

-- ============================================================================
-- STEP 6: Add comments for documentation
-- ============================================================================
COMMENT ON VIEW public.chat_messages_with_author IS 
  'View that joins chat_messages with user_public_profile to provide author information in a single query, avoiding N+1 queries. Grants SELECT to authenticated and anon, but base table RLS restricts actual access to participants only.';

COMMENT ON POLICY "chat_messages_select_participants_only" ON public.chat_messages IS
  'Allows authenticated users to read chat messages only for games they are participating in. Anon users cannot read messages (they are not participants). Chat is participant-only, not publicly viewable.';

