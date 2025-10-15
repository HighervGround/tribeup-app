import { supabase } from './supabase';

// Idempotent profile creation service using RPC
export async function ensureUserProfile({ 
  email, 
  username, 
  full_name, 
  avatar_url = null,
  bio = '',
  location = '',
  preferred_sports = []
}: {
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string;
  location?: string;
  preferred_sports?: string[];
}) {
  // Make sure user is authenticated before calling
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('🔧 Calling ensure_user_profile RPC for user:', user.id);

  const { data, error } = await supabase.rpc('ensure_user_profile', {
    p_email: email,
    p_username: username,
    p_full_name: full_name,
    p_avatar_url: avatar_url,
    p_bio: bio,
    p_location: location,
    p_preferred_sports: preferred_sports,
  });

  if (error) {
    console.error('❌ ensure_user_profile RPC failed:', error);
    throw error;
  }

  console.log('✅ Profile ensured successfully:', data);
  return data;
}

// Check if user profile exists
export async function checkUserProfileExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking profile existence:', error);
    return false;
  }
}
