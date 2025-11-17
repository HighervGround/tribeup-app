-- Fix infinite recursion in tribe_members RLS policies
-- The issue: "Admins can manage members" policy used FOR ALL which includes INSERT,
-- causing recursion when the trigger tries to insert the creator as admin.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage members" ON public.tribe_members;

-- Add specific policy for tribe creators to insert themselves (for trigger)
CREATE POLICY "Tribe creators can insert themselves" ON public.tribe_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tribes
      WHERE id = tribe_id
      AND creator_id = auth.uid()
    )
  );

-- Update the "Users can join public tribes" policy to exclude creators
DROP POLICY IF EXISTS "Users can join public tribes" ON public.tribe_members;
CREATE POLICY "Users can join public tribes" ON public.tribe_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tribes
      WHERE id = tribe_id
      AND is_public = true
      AND creator_id != auth.uid() -- Don't allow creator to use this policy
    )
  );

-- Add separate policies for admin management (UPDATE and DELETE only, not INSERT)
CREATE POLICY "Admins can update members" ON public.tribe_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members tm
      WHERE tm.tribe_id = tribe_members.tribe_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'moderator')
      AND tm.status = 'active'
    )
  );

CREATE POLICY "Admins can delete members" ON public.tribe_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members tm
      WHERE tm.tribe_id = tribe_members.tribe_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'moderator')
      AND tm.status = 'active'
    )
  );

