-- Add user roles and permissions system
-- This migration adds role-based access control to the TribeUp platform

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');

-- Add role column to users table
ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user' NOT NULL;

-- Create index for efficient role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Create user_permissions table for granular permissions
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission)
);

-- Create index for efficient permission lookups
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission);

-- Enable RLS on user_permissions table
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_permissions
-- Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON user_permissions
    FOR SELECT USING (user_id = auth.uid());

-- Only admins can manage permissions
CREATE POLICY "Admins can manage all permissions" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create audit log table for admin actions
CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'user', 'game', 'permission'
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit log queries
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only system can insert audit logs (via functions)
CREATE POLICY "System can insert audit logs" ON admin_audit_log
    FOR INSERT WITH CHECK (true);

-- Update games table RLS to allow admins and moderators to manage all games
DROP POLICY IF EXISTS "Users can view all games" ON games;
DROP POLICY IF EXISTS "Users can create games" ON games;
DROP POLICY IF EXISTS "Users can update own games" ON games;

-- New game policies with admin/moderator support
CREATE POLICY "Anyone can view games" ON games
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create games" ON games
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own games or admins/moderators can update any" ON games
    FOR UPDATE USING (
        creator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can delete own games or admins/moderators can delete any" ON games
    FOR DELETE USING (
        creator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action VARCHAR(100),
    p_target_type VARCHAR(50),
    p_target_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
    VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
    has_perm BOOLEAN := FALSE;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM users WHERE id = user_id;
    
    -- Admins have all permissions
    IF user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Check specific permission
    SELECT EXISTS(
        SELECT 1 FROM user_permissions 
        WHERE user_permissions.user_id = has_permission.user_id 
        AND user_permissions.permission = permission_name
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant initial admin role to the first user (you can update this manually)
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';

COMMENT ON TABLE user_permissions IS 'Granular permissions for users beyond their base role';
COMMENT ON TABLE admin_audit_log IS 'Audit trail for all administrative actions';
COMMENT ON FUNCTION has_permission IS 'Check if a user has a specific permission';
COMMENT ON FUNCTION log_admin_action IS 'Log administrative actions for audit trail';
