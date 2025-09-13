import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, CheckCircle, Loader2, MapPin, Clock, Users, DollarSign, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { SupabaseService } from '../lib/supabaseService';
import { useLocationSearch } from '../hooks/useLocationSearch';
import { useGeolocation } from '../hooks/useGeolocation';

interface FormData {
  sport: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  maxPlayers: string;
  cost: string;
  requirements: string;
}

const sportOptions = [
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'soccer', label: 'Soccer', icon: '⚽' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'pickleball', label: 'Pickleball', icon: '🥒' },
  { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { value: 'football', label: 'Football', icon: '🏈' },
  { value: 'baseball', label: 'Baseball', icon: '⚾' },
];

const steps = [
  { id: 1, title: 'What & When', fields: ['sport', 'date', 'time'] },
  { id: 2, title: 'Where & Who', fields: ['location', 'maxPlayers', 'cost'] },
];

const quickTimes = [
  '09:00',
  '12:00', 
  '15:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00'
];

export function CreateGame() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  // Location hooks
  const { latitude: userLat, longitude: userLng, error: geoError } = useGeolocation();
  const { searchLocations, loading: isLocationLoading, suggestions, geocodeLocation } = useLocationSearch();
  const { user } = useAppStore();
  const navigationRef = useRef<HTMLDivElement>(null);
  const [navigationHeight, setNavigationHeight] = useState(0);

  // Smart defaults
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  const [formData, setFormData] = useState({
    title: '',
    sport: '',
    date: getDefaultDate(), // Default to tomorrow
    time: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    maxPlayers: '10',
    cost: 'FREE',
    imageUrl: ''
  });

  // Sport-based defaults
  const sportDefaults = {
    basketball: { maxPlayers: 10 },
    soccer: { maxPlayers: 22 },
    football: { maxPlayers: 22 },
    tennis: { maxPlayers: 4 },
    volleyball: { maxPlayers: 12 },
    baseball: { maxPlayers: 18 },
    hockey: { maxPlayers: 12 },
    badminton: { maxPlayers: 4 },
    pickleball: { maxPlayers: 4 },
    golf: { maxPlayers: 4 },
    running: { maxPlayers: 20 },
    cycling: { maxPlayers: 15 },
    swimming: { maxPlayers: 8 },
    yoga: { maxPlayers: 15 },
    crossfit: { maxPlayers: 12 }
  };

  // Smart time suggestions based on current time and day
  const getSmartTimes = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    if (isWeekend) {
      // Weekend: suggest morning and afternoon times
      return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    } else {
      // Weekday: suggest evening times after work
      if (currentHour < 17) {
        return ['17:00', '18:00', '19:00', '20:00', '21:00'];
      } else {
        return ['18:00', '19:00', '20:00', '21:00'];
      }
    }
  };
  
  const popularTimes = getSmartTimes();

  // Recent locations (stored in localStorage)
  const [recentLocations, setRecentLocations] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recentGameLocations') || '[]');
    } catch {
      return [];
    }
  });

  // Auto-populate location when GPS is available and location field is empty
  useEffect(() => {
    console.log('Location effect triggered:', { 
      userLat, 
      userLng, 
      location: formData.location, 
      latitude: formData.latitude,
      geoError 
    });
    
    // Only auto-fill if we have GPS coordinates and no location is set yet
    if (userLat && userLng && !formData.location.trim()) {
      console.log('Auto-filling location with GPS coordinates');
      
      // Auto-fill with coordinates and try to get address
      const autoFillLocation = async () => {
        try {
          console.log('Fetching reverse geocoding for:', userLat, userLng);
          
          // Try Google Geocoding API first if available
          const googleApiKey = (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY;
          let response;
          
          if (googleApiKey) {
            response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLat},${userLng}&key=${googleApiKey}`
            );
          } else {
            response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&addressdetails=1`
            );
          }
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Reverse geocoding response:', data);
          
          // Create a more readable address
          let address = '';
          
          if (googleApiKey && data.results && data.results.length > 0) {
            // Google Geocoding API response
            address = data.results[0].formatted_address;
          } else if (data.address) {
            // OpenStreetMap response
            const parts: string[] = [];
            if (data.address.house_number && data.address.road) {
              parts.push(`${data.address.house_number} ${data.address.road}`);
            } else if (data.address.road) {
              parts.push(data.address.road);
            }
            if (data.address.city || data.address.town || data.address.village) {
              parts.push(data.address.city || data.address.town || data.address.village);
            }
            if (data.address.state) {
              parts.push(data.address.state);
            }
            address = parts.join(', ');
          }
          
          // Fallback to display_name if address parsing fails
          if (!address) {
            address = data.display_name || `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;
          }
          
          console.log('Setting location to:', address);
          setFormData(prev => ({
            ...prev,
            location: address,
            latitude: userLat,
            longitude: userLng
          }));
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Fallback to coordinates if reverse geocoding fails
          const fallbackLocation = `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;
          console.log('Using fallback location:', fallbackLocation);
          
          setFormData(prev => ({
            ...prev,
            location: fallbackLocation,
            latitude: userLat,
            longitude: userLng
          }));
        }
      };
      
      autoFillLocation();
    }
  }, [userLat, userLng, geoError]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Dynamic navigation height calculation
  useEffect(() => {
    const updateNavigationHeight = () => {
      if (navigationRef.current) {
        const height = navigationRef.current.offsetHeight;
        setNavigationHeight(height);
      }
    };

    updateNavigationHeight();
    window.addEventListener('resize', updateNavigationHeight);
    
    return () => window.removeEventListener('resize', updateNavigationHeight);
  }, [currentStep, isSubmitting]);

  const generateGameTitle = (sport: string, time: string, location: string) => {
    if (!sport || !time || !location) return '';
    
    const timeFormats = {
      morning: ['Morning', 'AM', 'Early'],
      afternoon: ['Afternoon', 'PM', 'Midday'],
      evening: ['Evening', 'Night', 'Late']
    };
    
    const hour = parseInt(time.split(':')[0]);
    let timeOfDay = 'Morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
    else if (hour >= 17) timeOfDay = 'Evening';
    
    const locationName = location.split(',')[0].trim();
    const sportName = sport.charAt(0).toUpperCase() + sport.slice(1);
    
    const templates = [
      `${timeOfDay} ${sportName} at ${locationName}`,
      `${sportName} Game - ${locationName}`,
      `${timeOfDay} ${sportName} Session`,
      `${locationName} ${sportName} Meetup`,
      `${sportName} @ ${locationName}`,
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const checkForDuplicateGame = async (sport: string, date: string, time: string, location: string): Promise<string | null> => {
    if (!sport || !date || !time || !location) return null;
    
    try {
      const games = await SupabaseService.getGames();
      const duplicates = games.filter(game => {
        const sameDate = game.date === date;
        const sameTime = Math.abs(new Date(`2000-01-01T${game.time}`).getTime() - new Date(`2000-01-01T${time}`).getTime()) < 3600000; // Within 1 hour
        const sameSport = game.sport.toLowerCase() === sport.toLowerCase();
        const sameLocation = game.location.toLowerCase().includes(location.toLowerCase()) || location.toLowerCase().includes(game.location.toLowerCase());
        
        return sameDate && sameTime && sameSport && sameLocation;
      });
      
      if (duplicates.length > 0) {
        return `Similar ${sport} game already exists at ${location} on ${date} around ${time}`;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return null;
    }
  };

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'date':
        if (!value) return null;
        const today = new Date();
        const chosen = new Date(value + 'T00:00:00');
        if (chosen < new Date(today.toDateString())) {
          return 'Date cannot be in the past';
        }
        return null;
        
      case 'time':
        if (!value) return null;
        const hour = parseInt(value.split(':')[0]);
        if (hour < 6 || hour > 23) {
          return 'Unusual time - games typically happen 6 AM - 11 PM';
        }
        if (hour >= 2 && hour <= 5) {
          return 'Did you mean PM instead of AM?';
        }
        return null;
        
      case 'maxPlayers':
        if (!value) return null;
        const num = parseInt(value);
        if (num < 2) return 'Need at least 2 players';
        if (num > 100) return 'That seems like a lot of players - double check?';
        
        // Smart capacity check based on sport
        const sportLower = formData.sport?.toLowerCase();
        if (sportLower === 'tennis' && num > 4) return 'Tennis usually has 2-4 players';
        if (sportLower === 'basketball' && num > 10) return 'Basketball usually has 6-10 players';
        if (sportLower === 'soccer' && num > 22) return 'Soccer usually has up to 22 players';
        
        return null;
        
      case 'location':
        if (!value) return null;
        if (value.length < 3) return 'Location too short';
        if (value.toLowerCase().includes('ocean') || value.toLowerCase().includes('sea')) {
          return 'Are you sure this location is correct?';
        }
        if (value.toLowerCase().includes('home') || value.toLowerCase().includes('house')) {
          return 'Consider using a public venue for safety';
        }
        return null;
        
      case 'cost':
        if (!value) return null;
        const cost = parseFloat(value);
        if (cost < 0) return 'Cost cannot be negative';
        if (cost > 500) return 'That seems expensive - double check?';
        return null;
        
      default:
        return null;
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-generate title when sport, time, or location changes (only if title is empty or matches previous auto-generated title)
      const currentAutoTitle = generateGameTitle(prev.sport, prev.time, prev.location);
      const newAutoTitle = generateGameTitle(
        name === 'sport' ? value : prev.sport,
        name === 'time' ? value : prev.time,
        name === 'location' ? value : prev.location
      );
      
      if ((name === 'sport' || name === 'time' || name === 'location') && 
          (!prev.title || prev.title === currentAutoTitle) && newAutoTitle) {
        newData.title = newAutoTitle;
      }
      
      // Auto-set max players based on sport
      if (name === 'sport' && sportDefaults[value.toLowerCase()]) {
        newData.maxPlayers = sportDefaults[value.toLowerCase()].maxPlayers.toString();
      }
      
      // Save location to recent locations
      if (name === 'location' && value.trim()) {
        const updated = [value, ...recentLocations.filter(loc => loc !== value)].slice(0, 5);
        setRecentLocations(updated);
        localStorage.setItem('recentGameLocations', JSON.stringify(updated));
      }
      
      return newData;
    });
    
    // Real-time validation
    const fieldError = validateField(name, value);
    setErrors(prev => {
      if (fieldError) {
        return { ...prev, [name]: fieldError };
      } else {
        const { [name]: _removed, ...rest } = prev;
        return rest;
      }
    });

    // Check for duplicate games when all key fields are filled
    if (name === 'location' && formData.sport && formData.date && formData.time && value) {
      checkForDuplicateGame(formData.sport, formData.date, formData.time, value).then(duplicateError => {
        if (duplicateError) {
          setErrors(prev => ({ ...prev, duplicate: duplicateError }));
        } else {
          setErrors(prev => {
            const { duplicate: _removed, ...rest } = prev;
            return rest;
          });
        }
      });
    }
    
    // Auto-advance to next step when current step is complete
    setTimeout(() => {
      if (isStepComplete(currentStep) && !Object.keys(errors).length) {
        if (currentStep < steps.length) {
          setCurrentStep(currentStep + 1);
        }
      }
    }, 500);
  };
  
  const isStepComplete = (step: number): boolean => {
    const stepFields = steps[step - 1]?.fields || [];
    const isComplete = stepFields.every(field => {
      const value = formData[field as keyof typeof formData];
      return value && value.toString().trim() !== '';
    });
    
    console.log('[CreateGame] isStepComplete - Step:', step, 'Fields:', stepFields, 'Complete:', isComplete, 'FormData:', formData);
    return isComplete;
  };

  const validateCurrentStep = (): boolean => {
    const stepErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.sport) stepErrors.sport = 'Please select a sport.';
      if (!formData.date) stepErrors.date = 'Please choose a date.';
      if (!formData.time) stepErrors.time = 'Please choose a time.';
      if (formData.date) {
        const today = new Date();
        const chosen = new Date(formData.date + 'T00:00:00');
        if (chosen < new Date(today.toDateString())) {
          stepErrors.date = 'Date cannot be in the past.';
        }
      }
    }
    if (currentStep === 2) {
      if (!formData.location.trim()) stepErrors.location = 'Location is required.';
      const mp = parseInt(formData.maxPlayers, 10);
      if (!formData.maxPlayers) stepErrors.maxPlayers = 'Max players is required.';
      else if (Number.isNaN(mp) || mp <= 0) stepErrors.maxPlayers = 'Enter a valid number greater than 0.';
      if (!formData.cost) stepErrors.cost = 'Please select a cost option.';
    }
    
    console.log('[CreateGame] Validation - Step:', currentStep, 'Errors:', stepErrors, 'FormData:', formData);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { user } = useAppStore.getState();
      console.log('[CreateGame] submit clicked. user =', user?.id);
      if (!user) {
        throw new Error('You must be logged in to create a game');
      }

      const gameData = {
        title: formData.title,
        sport: formData.sport,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        maxPlayers: parseInt(formData.maxPlayers) || 10,
        cost: formData.cost || 'Free',
        description: '', // Default empty description
        imageUrl: formData.imageUrl
      };
      console.log('[CreateGame] creating game with data =', gameData);
      await SupabaseService.createGame(gameData as any);
      navigate('/');
    } catch (error) {
      console.error('Error creating game:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create game');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;
  const selectedSport = sportOptions.find(sport => sport.value === formData.sport);

  const renderField = (name: string, label: string, type: string = 'text', options?: Array<{ value: string; label: string; icon?: React.ReactNode }>) => {
    const value = formData[name as keyof typeof formData] as string;
    const error = errors[name];
    const isValid = value && !error;

    if (type === 'select') {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <select 
            value={value} 
            onChange={(e) => handleInputChange(name, e.target.value)}
            className={`w-full p-3 border rounded-lg transition-colors bg-background text-foreground ${
              error ? 'border-destructive bg-destructive/10 dark:bg-destructive/20' : 
              isValid ? 'border-green-500 bg-green-50 dark:bg-green-950/50 dark:border-green-400' : 
              'border-input hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20'
            }`}
          >
            <option value="" className="bg-background text-foreground">Select {label.toLowerCase()}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value} className="bg-background text-foreground">
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-destructive flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>}
          {isValid && !error && <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <span>✅</span> Looks good!
          </p>}
        </div>
      );
    } else if (type === 'textarea') {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            {label}
            {steps[currentStep - 1].fields.includes(name) && (
              <span className="text-destructive">*</span>
            )}
          </label>
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(name, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className={`resize-none ${error ? 'border-destructive' : ''}`}
            rows={3}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            {label}
            {steps[currentStep - 1].fields.includes(name) && (
              <span className="text-destructive">*</span>
            )}
          </label>
          <Input
            type={type}
            value={formData[name]}
            onChange={(e) => handleInputChange(name, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            min={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
            className={`transition-colors ${
              error ? 'border-red-500 bg-red-50' : 
              isValid ? 'border-green-500 bg-green-50' : 
              'border-gray-300'
            }`}
          />
          {error && <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>}
          {isValid && !error && <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <span>✅</span> Looks good!
          </p>}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: `${navigationHeight + 16}px` }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Create Game</h1>
                <p className="text-sm text-muted-foreground">
                  {steps[currentStep - 1].title}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="px-4 pt-6" style={{ paddingBottom: `${navigationHeight + 16}px` }}>
        {/* Selected Sport Preview */}
        {selectedSport && (
          <div className="mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                    {selectedSport.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{formData.title || 'New Game'}</h3>
                    <p className="text-sm text-muted-foreground">{selectedSport.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form Steps */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                    1
                  </div>
                  What & When
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sport Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Sport
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {sportOptions.map((sport) => (
                      <button
                        key={sport.value}
                        type="button"
                        onClick={() => handleInputChange('sport', sport.value)}
                        className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                          formData.sport === sport.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input hover:border-ring text-foreground bg-background'
                        }`}
                      >
                        <div className="text-lg mb-1">{sport.icon}</div>
                        <div className="text-xs font-medium">{sport.label}</div>
                      </button>
                    ))}
                  </div>
                  {errors.sport && (
                    <p className="text-sm text-destructive">{errors.sport}</p>
                  )}
                </div>

                {renderField('date', 'Date', 'date')}
                
                {/* Quick Time Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    Time
                  </label>
                  
                  {/* Quick Time Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {quickTimes.map((timeOption) => (
                      <button
                        key={timeOption}
                        type="button"
                        onClick={() => handleInputChange('time', timeOption)}
                        className={`px-2 py-2 text-xs rounded-md border transition-colors ${
                          formData.time === timeOption
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-input hover:bg-muted hover:border-ring'
                        }`}
                      >
                        {/* Convert 24-hour to 12-hour for display */}
                        {new Date(`2000-01-01T${timeOption}:00`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Time Input */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Or enter custom time:</label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className={errors.time ? 'border-destructive' : ''}
                      placeholder="Select time"
                    />
                  </div>
                  
                  {errors.time && (
                    <p className="text-sm text-destructive">{errors.time}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                    2
                  </div>
                  Where & Who
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location Input Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Location
                  </label>
                  <div className="relative">
                    <Input
                      value={formData.location}
                      onChange={(e) => {
                        handleInputChange('location', e.target.value);
                        if (e.target.value.length > 2) {
                          searchLocations(e.target.value, userLat || undefined, userLng || undefined);
                          setShowLocationSuggestions(true);
                        } else {
                          setShowLocationSuggestions(false);
                        }
                      }}
                      placeholder="Enter location or address"
                      className={errors.location ? 'border-destructive' : ''}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                      {isLocationLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={async () => {
                          if (userLat && userLng) {
                            try {
                              const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`
                              );
                              const data = await response.json();
                              const address = data.display_name || `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;
                              setFormData(prev => ({
                                ...prev,
                                location: address,
                                latitude: userLat,
                                longitude: userLng
                              }));
                            } catch (error) {
                              console.error('Reverse geocoding failed:', error);
                              setFormData(prev => ({
                                ...prev,
                                location: `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`,
                                latitude: userLat,
                                longitude: userLng
                              }));
                            }
                          }
                        }}
                        disabled={!userLat || !userLng}
                        title={userLat && userLng ? "Use my current location" : geoError || "Location not available"}
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Location Suggestions */}
                  {showLocationSuggestions && suggestions.length > 0 && (
                    <div className="border border-border rounded-md bg-background shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted border-b border-border last:border-b-0 flex items-center gap-2"
                          onClick={async () => {
                            setFormData(prev => ({ ...prev, location: suggestion.description }));
                            setShowLocationSuggestions(false);
                            
                            const coords = await geocodeLocation(suggestion.description);
                            if (coords) {
                              setFormData(prev => ({
                                ...prev,
                                latitude: coords.lat,
                                longitude: coords.lng
                              }));
                            }
                          }}
                        >
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                            <div className="text-sm text-muted-foreground">{suggestion.structured_formatting.secondary_text}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location}</p>
                  )}
                </div>

                {renderField('maxPlayers', 'Max Players', 'number')}
                {renderField('cost', 'Cost', 'select', [
                  { value: 'FREE', label: 'Free' },
                  { value: '$5', label: '$5 per person' },
                  { value: '$10', label: '$10 per person' },
                  { value: '$15', label: '$15 per person' },
                  { value: '$20', label: '$20 per person' },
                  { value: 'custom', label: 'Custom amount' },
                ])}
              </CardContent>
            </Card>
          </div>
        )}


        {/* Form Summary (Step 3) */}
        {submitError && (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          </div>
        )}

        {currentStep === 3 && formData.sport && (
          <div className="mt-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Ready to create "{formData.title}" for {formData.maxPlayers} players 
                on {formData.date} at {formData.time}?
              </AlertDescription>
            </Alert>
            {errors.duplicate && (
              <div className="mt-2">
                <p className="text-sm text-yellow-700 mt-1">{errors.duplicate}</p>
                <p className="text-xs text-yellow-600 mt-2">You can still create this game if it's intentional.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <div ref={navigationRef} className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border safe-area-inset-bottom z-50">
        <div className="px-4 py-3 pb-safe">
          {/* Step Indicator for Mobile */}
          <div className="flex justify-center mb-3 sm:hidden">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    currentStep === step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : currentStep > step.id 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-3">
            {currentStep > 1 ? (
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="min-h-[48px] px-4 sm:px-6 flex-1 max-w-[120px] touch-manipulation text-sm sm:text-base"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="min-h-[48px] px-4 touch-manipulation text-sm sm:text-base"
                size="lg"
              >
                Cancel
              </Button>
            )}
            
            {/* Progress indicator for larger screens */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
            
            {currentStep < steps.length ? (
              <Button 
                onClick={handleNext}
                disabled={!isStepComplete(currentStep) || Object.keys(errors).some(key => key !== 'duplicate')}
                className="min-h-[48px] px-4 sm:px-6 flex-1 max-w-[120px] touch-manipulation text-sm sm:text-base"
                size="lg"
              >
                <span className="hidden sm:inline">Continue</span>
                <span className="sm:hidden">Next</span>
                <ArrowLeft className="w-4 h-4 ml-1 sm:ml-2 rotate-180" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!isStepComplete(currentStep) || Object.keys(errors).some(key => key !== 'duplicate') || isSubmitting}
                className="min-h-[48px] px-4 sm:px-6 flex-1 max-w-[140px] touch-manipulation text-sm sm:text-base"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Creating...</span>
                    <span className="sm:hidden">Wait...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Create Game</span>
                    <span className="sm:hidden">Create</span>
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Validation Status for Mobile */}
          {!isStepComplete(currentStep) && (
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Complete required fields to continue
              </p>
            </div>
          )}
          
          {/* Debug Info - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Debug: Step {currentStep} complete: {isStepComplete(currentStep) ? 'Yes' : 'No'} | 
              Errors: {Object.keys(errors).filter(key => key !== 'duplicate').length} | 
              Submitting: {isSubmitting ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}