-- Quick Fix: Restore DELETE policy for game_participants
-- This allows users to leave games they've joined

-- Drop any existing DELETE policies to avoid conflicts
DROP POLICY IF EXISTS "Users can leave games" ON public.game_participants;
DROP POLICY IF EXISTS "game_participants_delete_consolidated" ON public.game_participants;

-- Create the DELETE policy that allows users to leave games
CREATE POLICY "Users can leave games" ON public.game_participants
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'game_participants'
AND cmd = 'DELETE'
ORDER BY policyname;
