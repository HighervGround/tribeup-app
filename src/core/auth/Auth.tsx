// Enhanced Auth component using official Supabase components to prevent orphaned users
import EnhancedAuth from '@/core/auth/EnhancedAuth';

// Legacy Auth component backed up as Auth.backup.tsx
// This file now exports the enhanced version that properly handles user creation
export default EnhancedAuth;
