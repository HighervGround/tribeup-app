-- Add admin-related RLS policies after role column is confirmed to exist
-- This migration should run after the previous one to ensure role column exists

-- Add the admin audit log policy that requires the role column
CREATE POLICY "Admins can view audit logs" ON admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (select auth.uid()) 
            AND role IN ('admin', 'moderator')
        )
    );

-- Add policy for admins to view all users (needed for admin dashboard)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.id = (select auth.uid()) 
            AND u2.role IN ('admin', 'moderator')
        )
        OR id = (select auth.uid()) -- Users can still view their own profile
    );

-- Add policy for admins to update user roles
CREATE POLICY "Admins can update user roles" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.id = (select auth.uid()) 
            AND u2.role = 'admin'
        )
    );

-- Add policy for admins and moderators to delete any game
CREATE POLICY "Admins can delete any game" ON games
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (select auth.uid()) 
            AND role IN ('admin', 'moderator')
        )
        OR creator_id = (select auth.uid()) -- Game creators can still delete their own games
    );
