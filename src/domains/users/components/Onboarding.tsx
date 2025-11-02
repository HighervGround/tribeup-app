import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Progress } from '@/shared/components/ui/progress';
import { 
  ArrowRight, 
  MapPin, 
  Camera, 
  Check,
  Users,
  Calendar,
  Trophy
} from 'lucide-react';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '@/core/auth/SimpleAuthProvider';
import { SupabaseService } from '@/core/database/supabaseService';
import { supabase } from '@/core/database/supabase';
import { toast } from 'sonner';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

const onboardingSteps = [
  { id: 1, title: 'Welcome', description: 'Find your activity, find your tribe' },
  { id: 2, title: 'Sports', description: 'Choose your favorite sports' },
  { id: 3, title: 'Location', description: 'Find activities near you' },
  { id: 4, title: 'Profile', description: 'Set up your profile' },
];

const sportsOptions = [
  { name: 'Basketball', icon: '🏀', color: 'bg-sport-basketball' },
  { name: 'Soccer', icon: '⚽', color: 'bg-sport-soccer' },
  { name: 'Tennis', icon: '🎾', color: 'bg-sport-tennis' },
  { name: 'Pickleball', icon: '🥒', color: 'bg-success' },
  { name: 'Volleyball', icon: '🏐', color: 'bg-sport-volleyball' },
  { name: 'Football', icon: '🏈', color: 'bg-sport-football' },
  { name: 'Baseball', icon: '⚾', color: 'bg-sport-baseball' },
  { name: 'Running', icon: '🏃', color: 'bg-primary' },
  { name: 'Cycling', icon: '🚴', color: 'bg-success' },
  { name: 'Swimming', icon: '🏊', color: 'bg-secondary' },
  { name: 'Rock Climbing', icon: '🧗', color: 'bg-primary' },
  { name: 'Hiking', icon: '🥾', color: 'bg-success' },
];

function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    skillLevel: ''
  });
  const navigate = useNavigate();
  const { user } = useSimpleAuth();

  const progress = (currentStep / onboardingSteps.length) * 100;

  const handleNext = async () => {
    console.log('handleNext called, currentStep:', currentStep);
    if (currentStep < onboardingSteps.length) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Onboarding complete, saving profile and navigating home');
      const payload = {
        ...userProfile,
        selectedSports,
        locationPermission
      };
      try {
        // Get authenticated user
        const { data: { user: authUser }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !authUser) throw userErr ?? new Error('No user after sign-in');

        console.log('🎯 [Onboarding] Completing onboarding for user:', authUser.id);

        // First, upsert the profile with all the onboarding data
        const { error: upsertError } = await supabase.from('users').upsert(
          {
            id: authUser.id,
            email: authUser.email ?? null,
            full_name: `${payload.firstName} ${payload.lastName}`.trim(),
            username: `${payload.firstName}_${payload.lastName}`.toLowerCase().replace(/\s+/g, '_'),
            bio: payload.bio,
            preferred_sports: payload.selectedSports ?? [],
            location: payload.locationPermission === 'granted' ? 'Location enabled' : null,
          },
          { onConflict: 'id' }
        );

        if (upsertError) {
          console.error('❌ [Onboarding] Error upserting profile:', upsertError);
          toast.error('Failed to save profile. Please try again.');
          return;
        }

        console.log('✅ [Onboarding] Profile upserted successfully');

        // Then, mark onboarding as completed
        const { error: updateError } = await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', authUser.id);

        if (updateError) {
          console.error('❌ [Onboarding] Error completing onboarding:', updateError);
          toast.error('Failed to complete onboarding. Please try again.');
          return;
        }

        console.log('✅ [Onboarding] Onboarding completed successfully');
        
        // Update the app store with the latest profile data
        const updatedProfile = await SupabaseService.getUserProfile(authUser.id);
        if (updatedProfile) {
          const { useAppStore } = await import('@/store/appStore');
          useAppStore.getState().setUser(updatedProfile);
          console.log('✅ [Onboarding] Updated app store with completed onboarding profile');
        }
        
        // Clear localStorage flag (no longer needed with proper DB tracking)
        localStorage.removeItem(`onboarding_completed_${authUser.id}`);
        console.log('✅ [Onboarding] Cleared localStorage onboarding flag');
        
        // Notify caller for any additional side-effects
        onComplete?.(payload);
        toast.success("You're all set!", { description: 'Your profile is ready. Enjoy discovering games.' });
        
        // Add a small delay to ensure the profile update is processed
        setTimeout(() => {
          navigate('/', { replace: true, state: { fromOnboarding: true } });
        }, 1000);
        
      } catch (err) {
        console.error('Error completing onboarding:', err);
        toast.error('Could not save your profile. You can update it anytime in Profile.');
        // Still navigate to home even if there's an error
        setTimeout(() => {
          navigate('/', { replace: true, state: { fromOnboarding: true } });
        }, 1000);
      }
    }
  };

  const handleSportToggle = (sport: string) => {
    setSelectedSports(prev => 
      prev.includes(sport) 
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission('granted');
        },
        () => {
          setLocationPermission('denied');
        }
      );
    } else {
      setLocationPermission('denied');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return true;
      case 2: return selectedSports.length > 0;
      case 3: return true;
      case 4: return userProfile.firstName && userProfile.lastName;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">TribeUp</h1>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {onboardingSteps.length}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4">
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-medium">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1746690783368-9bbcf7cea12a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWxjb21lJTIwb25ib2FyZGluZyUyMGlsbHVzdHJhdGlvbnxlbnwxfHx8fDE3NTYxNDU1OTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Welcome illustration"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold">Welcome to TribeUp!</h2>
              <p className="text-lg text-muted-foreground max-w-sm">
                Connect with fellow Gators and discover pickup games happening around campus.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="text-sm font-medium">Find Players</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
                <div className="text-sm font-medium">Join Games</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-success" />
                </div>
                <div className="text-sm font-medium">Have Fun</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Sports Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">What sports do you play?</h2>
              <p className="text-muted-foreground">
                Select all the sports you're interested in
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {sportsOptions.map((sport) => (
                <button
                  key={sport.name}
                  onClick={() => handleSportToggle(sport.name)}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    selectedSports.includes(sport.name)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl">{sport.icon}</div>
                    <div className="font-medium">{sport.name}</div>
                    {selectedSports.includes(sport.name) && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedSports.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-2">Selected sports:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSports.map((sport) => {
                      const sportData = sportsOptions.find(s => s.name === sport);
                      return (
                        <Badge key={sport} className={`${sportData?.color} text-white border-none`}>
                          {sportData?.icon} {sport}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Location Permission */}
        {currentStep === 3 && (
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="w-16 h-16 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Enable Location Access</h2>
              <p className="text-muted-foreground max-w-sm">
                We need your location to show you games happening nearby on campus.
              </p>
            </div>

            {locationPermission === 'pending' && (
              <Button 
                onClick={requestLocationPermission}
                className="w-full max-w-sm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Enable Location Access
              </Button>
            )}

            {locationPermission === 'granted' && (
              <div className="w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 text-success mb-4">
                  <Check className="w-5 h-5" />
                  Location access granted
                </div>
                <div className="text-sm text-muted-foreground">
                  Great! We can now show you games near your location.
                </div>
              </div>
            )}

            {locationPermission === 'denied' && (
              <div className="w-full max-w-sm">
                <div className="text-warning mb-4">
                  Location access denied
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  You can still use TribeUp, but you'll need to search for games manually.
                </div>
                <Button 
                  variant="outline" 
                  onClick={requestLocationPermission}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Profile Setup */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Set up your profile</h2>
              <p className="text-muted-foreground">
                Tell other players a bit about yourself
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="text-2xl">
                    {userProfile.firstName?.[0]}{userProfile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-medium">
                  <Camera className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      value={userProfile.firstName}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Alex"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      value={userProfile.lastName}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Bio (Optional)</label>
                  <Input
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Skill Level</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <Button
                        key={level}
                        variant={userProfile.skillLevel === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUserProfile(prev => ({ ...prev, skillLevel: level }))}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="p-4">
        <Button 
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full h-12"
        >
          {currentStep === onboardingSteps.length ? 'Get Started' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        {currentStep > 1 && (
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep(currentStep - 1)}
            className="w-full mt-2"
          >
            Back
          </Button>
        )}
      </div>
    </div>
  );
}

export default Onboarding;

