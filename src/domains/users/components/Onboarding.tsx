import React, { useState, useEffect } from 'react';
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
  Trophy,
  Shield,
  Plus,
  Search,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '@/core/auth/SimpleAuthProvider';
import { SupabaseService } from '@/core/database/supabaseService';
import { supabase } from '@/core/database/supabase';
import { toast } from 'sonner';
import { LocationPermissionModal } from '@/domains/locations/components/LocationPermissionModal';
import { OnboardingGameBrowse } from './OnboardingGameBrowse';
import { OnboardingGameCreate } from './OnboardingGameCreate';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

const onboardingSteps = [
  { id: 1, title: 'Welcome', description: 'Find your activity, find your tribe' },
  { id: 2, title: 'Sports', description: 'Choose your favorite sports' },
  { id: 3, title: 'Location', description: 'Find activities near you' },
  { id: 4, title: 'Profile', description: 'Set up your profile' },
  { id: 5, title: 'First Game', description: 'Create or join your first game' },
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
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    skillLevel: ''
  });
  const [firstGameMode, setFirstGameMode] = useState<'create' | 'browse' | null>(null);
  const [hasCompletedFirstGame, setHasCompletedFirstGame] = useState(false);
  const [platformStats, setPlatformStats] = useState({
    totalGames: 0,
    totalUsers: 0,
    activeGamesToday: 0
  });
  const navigate = useNavigate();
  const { user } = useSimpleAuth();

  // Fetch platform stats for value proposition
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: gamesCount } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true });
        
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        const today = new Date().toISOString().split('T')[0];
        const { count: todayGamesCount } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .eq('date', today);
        
        setPlatformStats({
          totalGames: gamesCount || 0,
          totalUsers: usersCount || 0,
          activeGamesToday: todayGamesCount || 0
        });
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      }
    };
    
    fetchStats();
  }, []);

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
        
        // Track onboarding completion
        const { analyticsService } = await import('@/core/analytics/analyticsService');
        analyticsService.trackEvent('complete_onboarding', {
          sports_count: payload.selectedSports?.length || 0,
          has_skill_level: !!payload.skillLevel,
          has_location: payload.locationPermission === 'granted',
          completed_first_game: hasCompletedFirstGame,
          first_game_mode: firstGameMode,
        });
        
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

  // Show the location permission explanation modal
  const showLocationExplanation = () => {
    setShowLocationModal(true);
  };

  // Handle when user allows location access from the modal
  const handleLocationAllow = () => {
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
      case 5: return hasCompletedFirstGame || firstGameMode !== null; // Can skip or complete
      default: return false;
    }
  };

  const handleFirstGameComplete = () => {
    setHasCompletedFirstGame(true);
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
        {/* Step 1: Welcome - Enhanced Value Proposition */}
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
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-3xl font-semibold">Welcome to TribeUp!</h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-sm">
                Connect with fellow players and discover pickup games happening around you.
              </p>
            </div>

            {/* Live Stats - Show Real Value */}
            <div className="w-full max-w-sm">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <div className="text-2xl font-bold text-primary">
                          {platformStats.totalGames > 0 ? platformStats.totalGames : '...'}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">Games Created</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-secondary" />
                        <div className="text-2xl font-bold text-secondary">
                          {platformStats.totalUsers > 0 ? platformStats.totalUsers : '...'}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">Active Players</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap className="w-4 h-4 text-success" />
                        <div className="text-2xl font-bold text-success">
                          {platformStats.activeGamesToday > 0 ? platformStats.activeGamesToday : '...'}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">Today's Games</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="text-sm font-medium">Find Players</div>
                <div className="text-xs text-muted-foreground mt-1">Near you</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
                <div className="text-sm font-medium">Join Games</div>
                <div className="text-xs text-muted-foreground mt-1">In minutes</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-success" />
                </div>
                <div className="text-sm font-medium">Have Fun</div>
                <div className="text-xs text-muted-foreground mt-1">Play more</div>
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
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="w-16 h-16 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Enable Location Access</h2>
              <p className="text-muted-foreground max-w-sm">
                Help us show you sports activities and players near you.
              </p>
            </div>

            {/* Benefits section */}
            <div className="w-full max-w-sm space-y-3">
              <div className="flex items-start gap-3 text-left p-3 bg-muted/30 rounded-lg">
                <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Find Nearby Games</h4>
                  <p className="text-xs text-muted-foreground">Discover pickup games happening close to you.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left p-3 bg-muted/30 rounded-lg">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Sort by Distance</h4>
                  <p className="text-xs text-muted-foreground">See games sorted by how far they are from you.</p>
                </div>
              </div>
            </div>

            {locationPermission === 'pending' && (
              <Button 
                onClick={showLocationExplanation}
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
                  onClick={showLocationExplanation}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Privacy notice */}
            <div className="w-full max-w-sm bg-muted/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground text-left">
                  Your exact location is never shared with other users. You can disable location access anytime in settings.
                </p>
              </div>
            </div>
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

        {/* Step 5: First Game - Create or Join */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Get Started with Your First Game</h2>
              <p className="text-muted-foreground">
                Choose how you want to begin your TribeUp journey
              </p>
            </div>

            {!firstGameMode && (
              <div className="grid grid-cols-1 gap-4">
                {/* Browse and Join Games Option */}
                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setFirstGameMode('browse')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Search className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold mb-1">Browse & Join Games</h3>
                        <p className="text-sm text-muted-foreground">
                          Discover games in your favorite sports and join one that fits your schedule
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            Quick start
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Meet players
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Create Your Own Game Option */}
                <Card 
                  className="cursor-pointer hover:border-secondary transition-colors"
                  onClick={() => setFirstGameMode('create')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Plus className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold mb-1">Create Your Game</h3>
                        <p className="text-sm text-muted-foreground">
                          Host your own game and invite others to join you
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Trophy className="w-3 h-3 mr-1" />
                            Be the host
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            Your location
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {firstGameMode === 'browse' && (
              <OnboardingGameBrowse
                selectedSports={selectedSports}
                onGameJoined={handleFirstGameComplete}
                onBack={() => setFirstGameMode(null)}
              />
            )}

            {firstGameMode === 'create' && (
              <OnboardingGameCreate
                selectedSports={selectedSports}
                userProfile={userProfile}
                onGameCreated={handleFirstGameComplete}
                onBack={() => setFirstGameMode(null)}
              />
            )}

            {hasCompletedFirstGame && (
              <Card className="border-success bg-success/5">
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-success mb-2">
                    <Check className="w-6 h-6" />
                    <span className="font-semibold">Great job!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You've {firstGameMode === 'create' ? 'created' : 'joined'} your first game. Ready to explore more?
                  </p>
                </CardContent>
              </Card>
            )}
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
          {currentStep === onboardingSteps.length 
            ? hasCompletedFirstGame ? 'Get Started' : 'Skip for Now'
            : 'Continue'}
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

      {/* Location Permission Modal */}
      <LocationPermissionModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        onAllow={handleLocationAllow}
        onDeny={() => setShowLocationModal(false)}
      />
    </div>
  );
}

export default Onboarding;

