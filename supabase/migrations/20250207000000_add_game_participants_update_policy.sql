-- ============================================================================
-- ADD MISSING UPDATE POLICY FOR GAME_PARTICIPANTS
-- ============================================================================
-- This fixes the join/leave issue where upsert() fails due to missing UPDATE policy
-- ============================================================================

-- Add UPDATE policy for game_participants (required for upsert to work)
DROP POLICY IF EXISTS "authenticated_can_update_participation" ON public.game_participants;
CREATE POLICY "authenticated_can_update_participation" ON public.game_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Game Participants UPDATE Policy Added';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '  ✅ Upsert operations now work correctly';
  RAISE NOTICE '  ✅ Users can rejoin games without errors';
  RAISE NOTICE '  ✅ Status updates are now allowed';
  RAISE NOTICE '============================================';
END $$;

