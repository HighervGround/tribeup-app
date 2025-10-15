import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function OrphanedUserFixer() {
  const { user } = useAppStore();
  const [isFixing, setIsFixing] = useState(false);
  const [needsFix, setNeedsFix] = useState(false);

  useEffect(() => {
    // Check if current user might be orphaned
    if (user?.id) {
      // If user has a very basic profile (likely from auth fallback), they might be orphaned
      const isLikelyOrphaned = user.name?.startsWith('User ') || user.name?.includes('Unknown User');
      setNeedsFix(isLikelyOrphaned);
    }
  }, [user]);

  const fixOrphanedProfile = async () => {
    if (!user?.id) return;

    setIsFixing(true);
    try {
      console.log('🔧 Attempting to fix orphaned user profile...');

      // Get current session to ensure we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated - please sign in first');
        return;
      }

      // Use the idempotent ensure_user_profile RPC function
      const profileParams = {
        p_email: session.user.email || user.email,
        p_username: session.user.user_metadata?.username || 
                   session.user.email?.split('@')[0] || 
                   `user_${Date.now()}`,
        p_full_name: session.user.user_metadata?.full_name || 
                     session.user.email?.split('@')[0] || 
                     'Demo User',
        p_avatar_url: session.user.user_metadata?.avatar_url || null,
        p_bio: 'Profile created via orphaned user fix',
        p_location: '',
        p_preferred_sports: []
      };

      console.log('📝 Calling ensure_user_profile RPC for fix:', profileParams);

      // Call the idempotent RPC function (prevents race conditions)
      // Use only the 4 parameters the function actually accepts
      const { data, error } = await supabase
        .rpc('ensure_user_profile', {
          p_email: profileParams.p_email,
          p_username: profileParams.p_username,
          p_full_name: profileParams.p_full_name,
          p_avatar_url: profileParams.p_avatar_url,
        });

      if (error) {
        console.error('❌ Profile fix failed:', error);
        
        // Handle duplicate key errors gracefully
        if (error.code === '23505') {
          console.log('🔄 Profile already exists, checking if it can be fetched...');
          // Try to fetch the existing profile
          const { data: existingProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (existingProfile) {
            console.log('✅ Profile already exists and is accessible');
            toast.success('Profile already exists! Refreshing...');
            setNeedsFix(false);
            setTimeout(() => window.location.reload(), 1000);
          } else {
            toast.error('Profile exists but cannot be accessed - check RLS policies');
          }
        } else {
          toast.error(`Profile fix failed: ${error.message}`);
        }
      } else {
        console.log('✅ Profile fixed successfully:', data);
        toast.success('Profile fixed! Please refresh the page.');
        setNeedsFix(false);
        
        // Trigger a page refresh to reload with new profile
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Fix attempt failed:', error);
      toast.error('Fix attempt failed - check console for details');
    } finally {
      setIsFixing(false);
    }
  };

  // Only show if user needs fixing and we're in development or they have the specific orphaned ID
  const shouldShow = needsFix || 
    (user?.id === 'ca2ee1cc-3ccc-4d34-8f8e-b9e02c38bfc0') ||
    (user?.id === '654fbc89-0211-4c1e-9977-21f42084b918') || // New orphaned user
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="text-sm text-yellow-800 mb-2">
        <strong>Profile Issue Detected</strong>
        <br />
        Your profile may need to be recreated to fix display issues.
      </div>
      <Button
        onClick={fixOrphanedProfile}
        disabled={isFixing}
        size="sm"
        className="w-full"
      >
        {isFixing ? 'Fixing...' : 'Fix Profile'}
      </Button>
    </div>
  );
}
