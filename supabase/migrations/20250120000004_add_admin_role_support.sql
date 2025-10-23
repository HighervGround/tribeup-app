-- Add admin role support and consolidate admin policies
-- This migration adds proper admin role support and consolidates admin policies

-- ============================================================================
-- PART 1: Add admin role support to users table
-- ============================================================================

-- Add role column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
  END IF;
END;
$$;

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role) WHERE role IS NOT NULL;

-- ============================================================================
-- PART 2: Create admin-specific policies
-- ============================================================================

-- Drop existing admin policies to recreate them
DROP POLICY IF EXISTS "admin_delete_users" ON public.users;
DROP POLICY IF EXISTS "admin_select_users" ON public.users;
DROP POLICY IF EXISTS "admin_update_users" ON public.users;

-- Create consolidated admin policies for users
CREATE POLICY "admin_delete_users" ON public.users
  FOR DELETE USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

CREATE POLICY "admin_select_all_users" ON public.users
  FOR SELECT USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

CREATE POLICY "admin_update_all_users" ON public.users
  FOR UPDATE USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

-- Create admin policies for games
CREATE POLICY "admin_manage_all_games" ON public.games
  FOR ALL USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

-- Create admin policies for game_participants
CREATE POLICY "admin_manage_all_participants" ON public.game_participants
  FOR ALL USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

-- Create admin policies for chat_messages
CREATE POLICY "admin_manage_all_messages" ON public.chat_messages
  FOR ALL USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

-- Create admin policies for notifications
CREATE POLICY "admin_manage_all_notifications" ON public.notifications
  FOR ALL USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

-- ============================================================================
-- PART 3: Create admin audit log table
-- ============================================================================

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin audit log
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_table_name ON public.admin_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

-- Enable RLS on admin audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for admin audit log
CREATE POLICY "Audit select (jwt)" ON public.admin_audit_log
  FOR SELECT USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

-- ============================================================================
-- PART 4: Create admin functions
-- ============================================================================

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_admin_id UUID := (SELECT auth.uid());
  current_role TEXT := (SELECT auth.jwt() ->> 'role');
BEGIN
  -- Check if current user is admin
  IF current_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  -- Update user role
  UPDATE public.users 
  SET role = 'admin' 
  WHERE id = user_uuid;
  
  -- Log the action
  INSERT INTO public.admin_audit_log (
    admin_id, 
    action, 
    table_name, 
    record_id, 
    new_values
  ) VALUES (
    current_admin_id,
    'PROMOTE_TO_ADMIN',
    'users',
    user_uuid,
    jsonb_build_object('role', 'admin')
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote admin to user
CREATE OR REPLACE FUNCTION public.demote_from_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_admin_id UUID := (SELECT auth.uid());
  current_role TEXT := (SELECT auth.jwt() ->> 'role');
BEGIN
  -- Check if current user is admin
  IF current_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;
  
  -- Prevent self-demotion
  IF user_uuid = current_admin_id THEN
    RAISE EXCEPTION 'Cannot demote yourself';
  END IF;
  
  -- Update user role
  UPDATE public.users 
  SET role = 'user' 
  WHERE id = user_uuid;
  
  -- Log the action
  INSERT INTO public.admin_audit_log (
    admin_id, 
    action, 
    table_name, 
    record_id, 
    new_values
  ) VALUES (
    current_admin_id,
    'DEMOTE_FROM_ADMIN',
    'users',
    user_uuid,
    jsonb_build_object('role', 'user')
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin statistics
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  -- Check if current user is admin
  IF (SELECT auth.jwt() ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Only admins can view statistics';
  END IF;
  
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.users),
    'total_games', (SELECT COUNT(*) FROM public.games),
    'total_participants', (SELECT COUNT(*) FROM public.game_participants),
    'total_messages', (SELECT COUNT(*) FROM public.chat_messages),
    'total_notifications', (SELECT COUNT(*) FROM public.notifications),
    'admin_actions', (SELECT COUNT(*) FROM public.admin_audit_log)
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: Create admin views
-- ============================================================================

-- Create view for admin dashboard
CREATE OR REPLACE VIEW public.admin_dashboard AS
SELECT 
  'users' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d
FROM public.users
UNION ALL
SELECT 
  'games' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d
FROM public.games
UNION ALL
SELECT 
  'game_participants' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE joined_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE joined_at >= NOW() - INTERVAL '7 days') as last_7d
FROM public.game_participants;

-- Create RLS policy for admin dashboard
CREATE POLICY "admin_dashboard_access" ON public.admin_dashboard
  FOR SELECT USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

-- ============================================================================
-- PART 6: Set proper permissions
-- ============================================================================

-- Grant execute permissions on admin functions
GRANT EXECUTE ON FUNCTION public.promote_to_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_from_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- Grant select on admin views
GRANT SELECT ON public.admin_dashboard TO authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;

-- ============================================================================
-- PART 7: Verify admin setup
-- ============================================================================

-- Test that admin functions work
DO $$
BEGIN
  -- Check that admin functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'promote_to_admin'
  ) THEN
    RAISE EXCEPTION 'Admin functions not created properly';
  END IF;
  
  -- Check that admin policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'admin_delete_users'
  ) THEN
    RAISE EXCEPTION 'Admin policies not created properly';
  END IF;
  
  RAISE NOTICE 'Admin role support added successfully';
END;
$$;

-- Final status message
SELECT 'Admin role support and policies added successfully' as status;
