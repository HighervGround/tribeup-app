import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';

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
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
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
  const initialFormRef = React.useRef(null as ProfileFormData | null);

  const BIO_MAX = 200;
  const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,20}$/;

  // Load current user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const userProfile = await SupabaseService.getUserProfile(user.id);
        if (!userProfile) return;
        const loaded: ProfileFormData = {
          fullName: userProfile.name || '',
          username: userProfile.username || '',
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          avatarUrl: userProfile.avatar || '',
          sportsPreferences: Array.isArray(userProfile.preferences?.sports) ? userProfile.preferences.sports : []
        };
        setFormData(loaded);
        initialFormRef.current = loaded;
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error('Failed to load profile data');
      }
    };
    loadUserData();
  }, [user, navigate]);

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
    // If unchanged vs current store user, skip
    if (user?.username && user.username.trim().toLowerCase() === uname.toLowerCase()) {
      setUsernameError(null);
      return;
    }
    setCheckingUsername(true);
    timer = setTimeout(async () => {
      try {
        const available = await SupabaseService.isUsernameAvailable(uname, user?.id);
        setUsernameError(available ? null : 'Username is already taken');
      } catch {
        setUsernameError('Unable to validate username right now');
      } finally {
        setCheckingUsername(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [formData.username, user]);

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
    if (!user) return;
    const uname = (formData.username || '').trim();
    if (!uname) return;
    // client-side validation rules first
    if (!USERNAME_REGEX.test(uname)) {
      setUsernameError('3-20 chars. Letters, numbers, dot, underscore, or hyphen.');
      return;
    }
    if (user.username && user.username.trim().toLowerCase() === uname.toLowerCase()) return;
    try {
      setCheckingUsername(true);
      const available = await SupabaseService.isUsernameAvailable(uname, user.id);
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
    if (!user) return;

    setLoading(true);
    try {
      // Validate username availability before save
      const uname = (formData.username || '').trim();
      if (uname) {
        if (!USERNAME_REGEX.test(uname)) {
          setUsernameError('3-20 chars. Letters, numbers, dot, underscore, or hyphen.');
          setLoading(false);
          return;
        }
        const available = await SupabaseService.isUsernameAvailable(uname, user.id);
        if (!available) {
          setUsernameError('Username is already taken');
          setLoading(false);
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

      const updatedProfile = await SupabaseService.updateUserProfile(user.id, {
        full_name: formData.fullName,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        avatar_url: finalAvatarUrl,
        sports_preferences: formData.sportsPreferences
      });

      // Update the user in the store
      setUser(updatedProfile);
      
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Please sign in</h1>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Profile</h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!isDirty || loading || checkingUsername || !!usernameError || !!avatarError || !formData.fullName || !formData.username}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save'}
        </Button>
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
                <Input
                  placeholder="Avatar URL (optional)"
                  value={formData.avatarUrl}
                  onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                />
                <div className="mt-3 flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={handleFileChange} />
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">Enter a URL or upload an image</p>
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
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Username <span className="text-muted-foreground font-normal">(3–20 chars)</span></label>
              <Input
                placeholder="Choose a username"
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
                placeholder="City, State"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio <span className="text-muted-foreground font-normal">(max {BIO_MAX} chars)</span></label>
              <Textarea
                placeholder="Tell us about yourself..."
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
    </div>
  );
}

export default EditProfile;
