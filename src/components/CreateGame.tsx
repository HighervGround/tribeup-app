import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  ArrowLeft, 
  CheckCircle,
  Loader2,
  MapPin,
  Navigation
} from 'lucide-react';
import { SupabaseService } from '../lib/supabaseService';
import { useAppStore } from '../store/appStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLocationSearch } from '../hooks/useLocationSearch';

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
  { id: 1, title: 'Game Details', fields: ['sport', 'title', 'description'] },
  { id: 2, title: 'Date & Time', fields: ['date', 'time', 'duration'] },
  { id: 3, title: 'Location & Players', fields: ['location', 'maxPlayers', 'cost', 'requirements'] },
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
  const { suggestions, loading: locationLoading, searchLocations, geocodeLocation } = useLocationSearch();
  
  const [formData, setFormData] = useState<FormData>({
    sport: '',
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    latitude: null,
    longitude: null,
    maxPlayers: '',
    cost: '',
    requirements: '',
  });

  // Auto-populate location when GPS is available and location field is empty
  useEffect(() => {
    if (userLat && userLng && !formData.location && !formData.latitude) {
      // Auto-fill with coordinates and try to get address
      const autoFillLocation = async () => {
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
          // Fallback to coordinates if reverse geocoding fails
          setFormData(prev => ({
            ...prev,
            location: `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`,
            latitude: userLat,
            longitude: userLng
          }));
        }
      };
      
      autoFillLocation();
    }
  }, [userLat, userLng, formData.location, formData.latitude]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const stepErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.sport) stepErrors.sport = 'Please select a sport.';
      if (!formData.title.trim()) stepErrors.title = 'Game title is required.';
      if (!formData.description.trim()) stepErrors.description = 'Description is required.';
    }
    if (currentStep === 2) {
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
    if (currentStep === 3) {
      if (!formData.location.trim()) stepErrors.location = 'Location is required.';
      const mp = parseInt(formData.maxPlayers, 10);
      if (!formData.maxPlayers) stepErrors.maxPlayers = 'Max players is required.';
      else if (Number.isNaN(mp) || mp <= 0) stepErrors.maxPlayers = 'Enter a valid number greater than 0.';
      if (!formData.cost) stepErrors.cost = 'Please select a cost option.';
    }
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
        location: formData.location,
        date: formData.date,
        time: formData.time,
        cost: formData.cost || 'Free',
        maxPlayers: parseInt(formData.maxPlayers),
        description: formData.description,
        creatorId: user.id,
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

  const renderField = (name: string, label: string, type: string = 'text', options?: any[]) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          {label}
          {steps[currentStep - 1].fields.includes(name) && (
            <span className="text-destructive">*</span>
          )}
        </label>
        
        {type === 'select' && options ? (
          <select 
            value={formData[name]} 
            onChange={(e) => handleInputChange(name, e.target.value)}
            className={`w-full p-2 border rounded-md ${errors[name] ? 'border-destructive' : ''}`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <Textarea
            value={formData[name]}
            onChange={(e) => handleInputChange(name, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className={`resize-none ${errors[name] ? 'border-destructive' : ''}`}
            rows={3}
          />
        ) : (
          <Input
            type={type}
            value={formData[name]}
            onChange={(e) => handleInputChange(name, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            min={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
            className={errors[name] ? 'border-destructive' : ''}
          />
        )}
        {errors[name] && (
          <p className="text-sm text-destructive">{errors[name]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
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

        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="px-4 pb-40 pt-6">
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
                  Game Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderField('sport', 'Sport', 'select', sportOptions)}
                {renderField('title', 'Game Title')}
                {renderField('description', 'Description', 'textarea')}
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
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderField('date', 'Date', 'date')}
                {renderField('time', 'Time', 'time')}
                {renderField('duration', 'Duration', 'select', [
                  { value: '30min', label: '30 minutes' },
                  { value: '1hr', label: '1 hour' },
                  { value: '1.5hr', label: '1.5 hours' },
                  { value: '2hr', label: '2 hours' },
                  { value: '3hr', label: '3 hours' },
                ])}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                    3
                  </div>
                  Location & Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Location Field with GPS */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
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
                      {locationLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={async () => {
                          if (userLat && userLng) {
                            // Use reverse geocoding to get address from coordinates
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
                        <Navigation className="w-4 h-4" />
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
                            
                            // Try to geocode the selected location
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
                  
                  {/* Location Status */}
                  {formData.latitude && formData.longitude && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <MapPin className="w-3 h-3" />
                      <span>📍 Location coordinates saved ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})</span>
                    </div>
                  )}
                  
                  {userLat && userLng && !formData.latitude && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Navigation className="w-3 h-3" />
                      <span>🎯 Your location detected - use GPS button to auto-fill</span>
                    </div>
                  )}
                  
                  {geoError && (
                    <div className="text-sm text-amber-600">
                      📍 {geoError}
                    </div>
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
                {renderField('requirements', 'Requirements (Optional)', 'textarea')}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sticky Actions */}
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border px-4 py-4 mt-8">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="w-auto px-4"
              disabled={isSubmitting}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            {currentStep < steps.length ? (
            <Button onClick={handleNext} className="flex-1" disabled={isSubmitting || Object.keys(errors).length > 0}>
              Next Step
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Game...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Game
                </>
              )}
            </Button>
          )}
          </div>
        </div>

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
          </div>
        )}
      </div>
    </div>
  );
}