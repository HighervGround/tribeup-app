import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { SupabaseService } from '@/core/database/supabaseService';
import { useUpdateUserProfile } from '@/domains/users/hooks/useUserProfile';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/core/database/supabase';

interface ProfileFormData {
  fullName: string;
  username: string;
  bio: string;
  location: string;
  avatarUrl: string;
  sportsPreferences: string[];
}

const availableSports = [
  'Basketball', 'Soccer', 'Tennis', 'Volleyball', 'Football', 
  'Baseball', 'Swimming', 'Running', 'Cycling', 'Yoga'
];

function EditProfile() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const updateProfileMutation = useUpdateUserProfile();
  const loading = updateProfileMutation.isPending;
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    username: '',
    bio: '',
    location: '',
    avatarUrl: '',
    sportsPreferences: []
  });
  const [usernameError, setUsernameError] = useState(null as string | null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null as File | null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [avatarError, setAvatarError] = useState(null as string | null);
  const [authReady, setAuthReady] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const initialFormRef = React.useRef(null as ProfileFormData | null);

  const BIO_MAX = 200;
  const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,20}$/;

  // Wait for auth to be ready before loading profile data
  useEffect(() => {
    const waitForAuth = async () => {
      try {
        // Ensure auth session is initialized before querying
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ [EditProfile] Auth session error:', sessionError);
          toast.error('Authentication error. Please sign in again.');
          navigate('/auth');
          return;
        }

        if (!session || !session.user?.id) {
          console.warn('⚠️ [EditProfile] No authenticated session found');
          toast.error('Please sign in to edit your profile');
          navigate('/auth');
          return;
        }

        console.log('✅ [EditProfile] Auth ready, user ID:', session.user.id);
        setAuthReady(true);

        // Now that auth is ready, load profile data from public.users
        // Use a single data source (public.users row), not session metadata
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url, bio, location, preferred_sports')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('❌ [EditProfile] Error loading profile from users table:', userError);
          toast.error('Failed to load profile data');
          setLoadingProfile(false);
          return;
        }

        if (!userData) {
          console.warn('⚠️ [EditProfile] User profile not found in users table');
          toast.error('Profile not found');
          setLoadingProfile(false);
          return;
        }

        // Transform database row to form data
        const loaded: ProfileFormData = {
          fullName: userData.full_name || '',
          username: userData.username || '',
          bio: userData.bio || '',
          location: userData.location || '',
          avatarUrl: userData.avatar_url || '',
          sportsPreferences: Array.isArray(userData.preferred_sports) ? userData.preferred_sports : []
        };
        
        setFormData(loaded);
        initialFormRef.current = loaded;
        setLoadingProfile(false);
        console.log('✅ [EditProfile] Profile data loaded from public.users');
      } catch (error) {
        console.error('❌ [EditProfile] Exception loading profile:', error);
        toast.error('Failed to load profile data');
        setLoadingProfile(false);
      }
    };

    waitForAuth();
  }, [navigate]);

  // Debounced username availability check while typing (top-level)
  useEffect(() => {
    let timer: any;
    const uname = (formData.username || '').trim();
    if (!uname) {
      setUsernameError(null);
      return;
    }
    if (!USERNAME_REGEX.test(uname)) {
      setUsernameError('3-20 chars. Letters, numbers, dot, underscore, or hyphen.');
      return;
    }
    
    // If unchanged vs loaded form data, skip
    if (initialFormRef.current?.username && initialFormRef.current.username.trim().toLowerCase() === uname.toLowerCase()) {
      setUsernameError(null);
      return;
    }
    
    setCheckingUsername(true);
    timer = setTimeout(async () => {
      try {
        // Get current user ID from auth session (not store) to avoid timing issues
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        if (!currentUserId) {
          setUsernameError('Please sign in to check username');
          setCheckingUsername(false);
          return;
        }
        const available = await SupabaseService.isUsernameAvailable(uname, currentUserId);
        setUsernameError(available ? null : 'Username is already taken');
      } catch {
        setUsernameError('Unable to validate username right now');
      } finally {
        setCheckingUsername(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleInputChange = (field: keyof ProfileFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (field === 'username') {
      setUsernameError(null);
    }
    if (field === 'bio' && typeof value === 'string' && value.length > BIO_MAX) {
      // hard limit in UI
      setFormData(prev => ({ ...prev, bio: value.slice(0, BIO_MAX) }));
    }
  };

  const handleSportToggle = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      sportsPreferences: prev.sportsPreferences.includes(sport)
        ? prev.sportsPreferences.filter(s => s !== sport)
        : [...prev.sportsPreferences, sport]
    }));
  };

  const handleUsernameBlur = async () => {
    // Get current user ID from auth session
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    const uname = (formData.username || '').trim();
    if (!uname) return;
    
    // client-side validation rules first
    if (!USERNAME_REGEX.test(uname)) {
      setUsernameError('3-20 chars. Letters, numbers, dot, underscore, or hyphen.');
      return;
    }
    
    // If unchanged vs loaded form data, skip
    if (initialFormRef.current?.username && initialFormRef.current.username.trim().toLowerCase() === uname.toLowerCase()) {
      return;
    }
    
    try {
      setCheckingUsername(true);
      const available = await SupabaseService.isUsernameAvailable(uname, currentUserId);
      if (!available) setUsernameError('Username is already taken');
    } catch (e) {
      setUsernameError('Unable to validate username right now');
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setAvatarError(null);
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (!validTypes.includes(file.type)) {
        setAvatarError('Please upload a JPG, PNG, WEBP, or GIF image.');
        setSelectedFile(null);
        return;
      }
      if (file.size > maxBytes) {
        setAvatarError('Image is too large. Max size is 5 MB.');
        setSelectedFile(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleSave = async () => {
    // Ensure auth is still ready before saving
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user?.id) {
      console.error('❌ [EditProfile] No authenticated session for save');
      toast.error('Please sign in to save your profile');
      navigate('/auth');
      return;
    }

    const currentUserId = session.user.id;
    console.log('🔧 Starting profile save...', { userId: currentUserId, formData });

    try {
      // Validate username availability before save
      const uname = (formData.username || '').trim();
      if (uname) {
        if (!USERNAME_REGEX.test(uname)) {
          setUsernameError('3-20 chars. Letters, numbers, dot, underscore, or hyphen.');
          return;
        }
        const available = await SupabaseService.isUsernameAvailable(uname, currentUserId);
        if (!available) {
          setUsernameError('Username is already taken');
          return;
        }
      }

      // Upload avatar if a file is selected
      let finalAvatarUrl = formData.avatarUrl;
      if (selectedFile) {
        try {
          finalAvatarUrl = await SupabaseService.uploadAvatar(selectedFile);
          console.log('Avatar uploaded successfully:', finalAvatarUrl);
        } catch (avatarError) {
          console.error('Avatar upload failed:', avatarError);
          toast.error('Failed to upload profile picture. Profile will be saved without image.');
          // Continue with profile update even if avatar upload fails
        }
      }

      // Use React Query mutation for profile update
      updateProfileMutation.mutate({
        userId: currentUserId,
        profileData: {
          full_name: formData.fullName,
          username: formData.username,
          bio: formData.bio,
          location: formData.location,
          avatar_url: finalAvatarUrl,
          preferred_sports: formData.sportsPreferences
        }
      }, {
        onSuccess: (updatedProfile) => {
          console.log('✅ Profile update successful:', updatedProfile);
          // Update the user in the store
          setUser(updatedProfile);
          navigate('/profile');
        },
        onError: (error) => {
          console.error('❌ Profile update failed:', error);
          toast.error('Failed to update profile: ' + error.message);
        }
      });
    } catch (error) {
      console.error('Error in profile save:', error);
      toast.error('Failed to validate profile data');
    }
  };

  const handleBack = () => {
    const isDirty = initialFormRef.current && JSON.stringify(initialFormRef.current) !== JSON.stringify(formData);
    if (isDirty) {
      const confirmLeave = window.confirm('Discard unsaved changes?');
      if (!confirmLeave) return;
    }
    navigate('/profile');
  };

  // Warn on browser/tab close if form is dirty
  useEffect(() => {
    const isDirty = initialFormRef.current && JSON.stringify(initialFormRef.current) !== JSON.stringify(formData);
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [formData]);

  const isDirty = (initialFormRef.current && JSON.stringify(initialFormRef.current) !== JSON.stringify(formData)) || selectedFile !== null;

  // Show loading state while waiting for auth and profile data
  if (!authReady || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-12 pb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Edit Profile</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                {(previewUrl || formData.avatarUrl) && (
                  <AvatarImage src={previewUrl || formData.avatarUrl} alt="Avatar preview" />
                )}
                <AvatarFallback className="text-xl">
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={handleFileChange} />
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">Upload an image for your avatar</p>
                {avatarError && (
                  <p className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">{avatarError}</p>
                )}
                {/* Preview now shown inside Avatar above */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Username <span className="text-muted-foreground font-normal">(3–20 chars)</span></label>
              <Input
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                onBlur={handleUsernameBlur}
                aria-describedby={
                  usernameError ? 'username-error' : 'username-help'
                }
              />
              {checkingUsername && (
                <p className="text-xs text-muted-foreground mt-1" aria-live="polite">Checking availability…</p>
              )}
              {usernameError && (
                <p id="username-error" className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">{usernameError}</p>
              )}
              {!usernameError && !checkingUsername && formData.username && (
                <p id="username-help" className="text-xs text-muted-foreground mt-1">Allowed: letters, numbers, dot, underscore, hyphen.</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio <span className="text-muted-foreground font-normal">(max {BIO_MAX} chars)</span></label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
                maxLength={BIO_MAX}
                aria-describedby="bio-counter"
              />
              <div className="flex justify-end">
                <span id="bio-counter" className={`text-xs ${formData.bio.length >= BIO_MAX ? 'text-red-500' : 'text-muted-foreground'}`}>{formData.bio.length}/{BIO_MAX}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sports Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Sports I Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableSports.map((sport) => (
                <Badge
                  key={sport}
                  variant={formData.sportsPreferences.includes(sport) ? "default" : "secondary"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleSportToggle(sport)}
                >
                  {sport}
                  {formData.sportsPreferences.includes(sport) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Click on sports to add or remove them from your preferences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Save Button at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button 
          onClick={handleSave} 
          disabled={!isDirty || loading || checkingUsername || !!usernameError || !!avatarError || !formData.fullName || !formData.username}
          className="w-full flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

export default EditProfile;
