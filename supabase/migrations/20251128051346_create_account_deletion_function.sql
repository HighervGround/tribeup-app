-- Account Deletion RPC Function
-- This function safely deletes a user account and all associated data

-- Create the delete_user_account function
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user's ID
  current_user_id := auth.uid();
  
  -- Verify user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Log the deletion attempt for audit purposes
  RAISE NOTICE 'Starting account deletion for user: %', current_user_id;
  
  -- Delete in order to respect foreign key constraints
  -- Most dependencies have ON DELETE CASCADE, but we explicitly delete for clarity and audit
  
  -- 1. Delete user's notifications
  DELETE FROM notifications WHERE user_id = current_user_id;
  
  -- 2. Delete user's chat messages  
  DELETE FROM chat_messages WHERE user_id = current_user_id;
  
  -- 3. Delete user's game participations
  DELETE FROM game_participants WHERE user_id = current_user_id;
  
  -- 4. Delete games created by the user (this will cascade delete related participants, chat messages)
  DELETE FROM games WHERE creator_id = current_user_id;
  
  -- 5. Delete user connections (friends)
  DELETE FROM user_connections WHERE user_id = current_user_id OR connected_user_id = current_user_id;
  
  -- 6. Delete tribe memberships
  DELETE FROM tribe_members WHERE user_id = current_user_id;
  
  -- 7. Delete tribes created by the user (transfers ownership or deletes)
  -- For simplicity, delete tribes where user is sole creator
  DELETE FROM tribes WHERE creator_id = current_user_id;
  
  -- 8. Delete user presence data
  DELETE FROM user_presence WHERE user_id = current_user_id;
  
  -- 9. Delete user stats
  DELETE FROM user_stats WHERE user_id = current_user_id;
  
  -- 10. Delete activity likes
  DELETE FROM activity_likes WHERE user_id = current_user_id;
  
  -- 11. Delete game reviews
  DELETE FROM game_reviews WHERE user_id = current_user_id;
  
  -- 12. Delete user testing feedback
  DELETE FROM user_testing_feedback WHERE user_id = current_user_id;
  
  -- 13. Finally, delete the user profile
  DELETE FROM users WHERE id = current_user_id;
  
  RAISE NOTICE 'Successfully deleted all data for user: %', current_user_id;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users only
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Add a comment for documentation
COMMENT ON FUNCTION public.delete_user_account() IS 'Safely deletes the authenticated user account and all associated data. This operation is irreversible.';

SELECT 'Account deletion function created successfully' as status;
