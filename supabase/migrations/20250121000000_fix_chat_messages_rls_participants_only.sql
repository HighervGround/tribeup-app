-- Fix chat_messages RLS: Require user to be participant in game
-- This migration ensures users can only send messages if they're participants in the game

-- Step 1: Drop existing INSERT policies on chat_messages to avoid conflicts
-- Note: We keep admin policies since they use FOR ALL (not just INSERT)
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_consolidated" ON public.chat_messages;

-- Ensure admin policy exists (recreate if it was dropped, or create if missing)
-- Admin policy should allow admins to manage all messages regardless of participant status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages' 
    AND policyname = 'admin_manage_all_messages'
  ) THEN
    CREATE POLICY "admin_manage_all_messages" ON public.chat_messages
      FOR ALL 
      USING (((SELECT auth.jwt()) ->> 'role') = 'admin');
  END IF;
END $$;

-- Step 2: Create participant-only INSERT policy
-- This ensures:
-- 1. user_id matches auth.uid() (prevents spoofing)
-- 2. User is a participant in the game (prevents unauthorized chat access)
CREATE POLICY "chat_insert_participants_only" ON public.chat_messages
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_id = (SELECT auth.uid()) 
    AND EXISTS (
      SELECT 1 
      FROM public.game_participants gp 
      WHERE gp.game_id = chat_messages.game_id 
      AND gp.user_id = (SELECT auth.uid())
    )
  );

-- Step 3: Ensure SELECT policy exists (should already exist, but verify)
-- Allow authenticated users to read messages for games they're participating in
-- Or allow anyone to view (if you want public chat visibility)
-- Keeping the original "Anyone can view chat messages" policy if it exists
-- If not, create a participant-only SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages' 
    AND policyname = 'Anyone can view chat messages'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Anyone can view chat messages" ON public.chat_messages
      FOR SELECT 
      USING (true);
  END IF;
END $$;

-- Step 4: Optional trigger to auto-set user_id (more secure)
-- This ensures user_id is always set from auth.uid(), even if client doesn't send it
CREATE OR REPLACE FUNCTION public.set_chat_message_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Always set user_id from auth context, overriding any client-provided value
  NEW.user_id := (SELECT auth.uid());
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists, then recreate
DROP TRIGGER IF EXISTS set_chat_author ON public.chat_messages;
CREATE TRIGGER set_chat_author
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_chat_message_author();

-- Step 5: Add comment for documentation
COMMENT ON POLICY "chat_insert_participants_only" ON public.chat_messages IS 
  'Allows authenticated users to send messages only if they are participants in the game. The trigger automatically sets user_id from auth.uid().';

COMMENT ON FUNCTION public.set_chat_message_author() IS 
  'Automatically sets user_id from auth.uid() for chat messages, preventing client-side user_id spoofing.';

