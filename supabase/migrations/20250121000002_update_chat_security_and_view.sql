-- Update chat security and view access
-- This migration:
-- 1. Recreates chat_messages_with_author view with proper columns from user_public_profile
-- 2. Grants SELECT to authenticated and anon (for public game pages)
-- 3. Removes broad "Anyone can view chat messages" policy
-- 4. Adds participant-only SELECT policy for security

-- Step 1: Drop and recreate chat_messages_with_author view with correct columns
-- Note: user_public_profile has: id, display_name, username, avatar_url, bio, location
-- It does NOT have full_name (display_name is computed as COALESCE(NULLIF(full_name, ''), username, 'User'))
DROP VIEW IF EXISTS chat_messages_with_author CASCADE;

CREATE OR REPLACE VIEW chat_messages_with_author AS
SELECT 
  cm.id,
  cm.game_id,
  cm.user_id,
  cm.message,
  cm.created_at,
  up.display_name,
  up.username,
  up.avatar_url
FROM chat_messages cm
LEFT JOIN user_public_profile up ON cm.user_id = up.id;

-- Step 2: Grant access to authenticated and anon (for public game page visibility)
GRANT SELECT ON chat_messages_with_author TO authenticated;
GRANT SELECT ON chat_messages_with_author TO anon;

-- Step 3: Remove broad "Anyone can view chat messages" policy for security
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;

-- Step 4: Create participant-only SELECT policy
-- Users can only read messages for games they're participating in
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

-- Step 5: Add comment
COMMENT ON VIEW chat_messages_with_author IS 
  'View that joins chat_messages with user_public_profile to provide author information in a single query, avoiding N+1 queries. Grants SELECT to authenticated and anon users.';

COMMENT ON POLICY "chat_messages_select_participants_only" ON public.chat_messages IS
  'Allows authenticated users to read chat messages only for games they are participating in. Replaces the broad "Anyone can view" policy for better security.';

