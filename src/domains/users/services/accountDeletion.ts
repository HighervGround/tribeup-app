import { supabase } from '@/core/database/supabase';

export interface AccountDeletionResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes the current user's account and all associated data.
 * This operation is irreversible.
 * 
 * The deletion process:
 * 1. Calls the Supabase RPC function to delete all user data
 * 2. Signs out the user from the current session
 * 
 * @returns Promise<AccountDeletionResult> - Success status and optional error message
 */
export async function deleteUserAccount(): Promise<AccountDeletionResult> {
  try {
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    console.log('🗑️ Starting account deletion for user:', user.id);

    // Call the RPC function to delete all user data
    const { error: deleteError } = await supabase.rpc('delete_user_account');

    if (deleteError) {
      console.error('❌ Account deletion failed:', deleteError);
      return { 
        success: false, 
        error: deleteError.message || 'Failed to delete account data' 
      };
    }

    console.log('✅ User data deleted successfully');

    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.warn('⚠️ Sign out failed after account deletion:', signOutError);
      // Don't fail the operation since data is already deleted
    }

    console.log('✅ Account deletion completed successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Unexpected error during account deletion:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}
