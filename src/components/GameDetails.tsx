import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ClickableAvatar } from './ui/clickable-avatar';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  MessageCircle, 
  Share, 
  Flag, 
  Clock,
  DollarSign,
  Star,
  Navigation,
  Loader2,
  Edit3,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAppStore } from '../store/appStore';
import { useGame, useGameParticipants } from '../hooks/useGames';
import { useGameJoinToggle } from '../hooks/useGameJoinToggle';
import { useDeepLinks } from '../hooks/useDeepLinks';
import { QuickJoinModal } from './QuickJoinModal';
import { ShareGameModal } from './ShareGameModal';
import { toast } from 'sonner';
import { WeatherService, WeatherData } from '../lib/weatherService';
import { SupabaseService } from '../lib/supabaseService';
import { formatEventHeader, formatCalendarInfo } from '../lib/dateUtils';



// Weather Info Component
function WeatherInfo({ game }: { game: any }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getWeatherData = async () => {
      console.log('🌤️ Getting weather data for game:', game.id);
      console.log('📍 Coordinates:', game.latitude, game.longitude);
      console.log('📍 Location:', game.location);
      
      try {
        let weatherData: WeatherData | null = null;
        const gameDateTime = new Date(`${game.date} ${game.time}`);
        
        if (game.latitude && game.longitude) {
          // Use exact coordinates
          console.log('🎯 Using exact coordinates for weather');
          weatherData = await WeatherService.getGameWeather(game.latitude, game.longitude, gameDateTime);
        } else if (game.location) {
          // Use Google Maps Geocoding API (same as the map uses)
          console.log('🗺️ Using Google Maps geocoding for weather (same as map)');
          const googleApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
          
          try {
            const geocodeResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(game.location)}&key=${googleApiKey}`
            );
            
            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json();
              console.log('🗺️ Google geocoding results:', geocodeData);
              
              if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
                const { lat, lng } = geocodeData.results[0].geometry.location;
                console.log('🎯 Using Google Maps coordinates for weather:', lat, lng);
                weatherData = await WeatherService.getGameWeather(lat, lng, gameDateTime);
                console.log('✅ Weather from Google Maps coordinates:', weatherData);
              } else {
                console.warn('🗺️ Google geocoding failed:', geocodeData.status, geocodeData.error_message);
              }
            } else {
              console.error('🗺️ Google geocoding HTTP error:', geocodeResponse.status, geocodeResponse.statusText);
            }
          } catch (error) {
            console.error('❌ Google Maps geocoding failed:', error);
          }
          
          // Fallback to zipcode if Google Maps geocoding fails
          if (!weatherData) {
            const zipcode = WeatherService.extractZipcode(game.location);
            if (zipcode) {
              console.log('📮 Fallback: Using zipcode for weather:', zipcode);
              weatherData = await WeatherService.getWeatherByZipcode(zipcode, gameDateTime);
            }
          }
          
          // Final fallback to simple location search
          if (!weatherData) {
            console.log('🌤️ Final fallback: Simple weather search');
            const simpleResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(game.location)}&appid=${(import.meta as any).env?.VITE_OPENWEATHER_API_KEY}&units=imperial`
            );
            
            if (simpleResponse.ok) {
              const simpleData = await simpleResponse.json();
              weatherData = {
                temperature: Math.round(simpleData.main.temp),
                condition: simpleData.weather[0].main,
                description: simpleData.weather[0].description,
                humidity: simpleData.main.humidity,
                windSpeed: Math.round(simpleData.wind.speed),
                precipitation: simpleData.rain?.['1h'] || simpleData.snow?.['1h'] || 0,
                icon: simpleData.weather[0].main === 'Clear' ? '☀️' : simpleData.weather[0].main === 'Clouds' ? '☁️' : simpleData.weather[0].main === 'Rain' ? '🌧️' : '🌤️',
                isOutdoorFriendly: true,
                alerts: []
              };
            }
          }
        }
        
        if (weatherData) {
          console.log('✅ Weather data received:', weatherData);
          setWeather(weatherData);
        } else {
          throw new Error('No weather data available');
        }
      } catch (error) {
        console.error('❌ Weather error:', error);
        // Try one more fallback with current weather for a default US location
        try {
          console.log('🔄 Final attempt: Using current weather API');
          const fallbackResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?zip=10001,US&appid=${(import.meta as any).env?.VITE_OPENWEATHER_API_KEY}&units=imperial`
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const temp = Math.round(fallbackData.main.temp);
            const condition = fallbackData.weather[0].main;
            const description = fallbackData.weather[0].description;
            
            setWeather({
              temperature: temp,
              condition,
              description: `${description.charAt(0).toUpperCase() + description.slice(1)} (nearby area)`,
              humidity: fallbackData.main.humidity,
              windSpeed: Math.round(fallbackData.wind.speed),
              precipitation: fallbackData.rain?.['1h'] || fallbackData.snow?.['1h'] || 0,
              icon: condition === 'Clear' ? '☀️' : condition === 'Clouds' ? '☁️' : condition === 'Rain' ? '🌧️' : '🌤️',
              isOutdoorFriendly: temp > 40 && temp < 95,
              alerts: [`📍 Showing weather for nearby area - actual conditions at ${game.location || 'game location'} may vary`]
            });
          } else {
            throw new Error('Fallback weather failed');
          }
        } catch (fallbackError) {
          console.error('❌ All weather sources failed:', fallbackError);
          // Final mock data
          setWeather({
            temperature: 72,
            condition: 'Clear',
            description: 'Weather data temporarily unavailable',
            humidity: 65,
            windSpeed: 8,
            precipitation: 0,
            icon: '🌤️',
            isOutdoorFriendly: true,
            alerts: [`🔄 Weather service temporarily unavailable for ${game.location || 'this location'}`]
          });
        }
      }
      
      setLoading(false);
    };

    getWeatherData();
  }, [game.latitude, game.longitude, game.location, game.date, game.time]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading weather...</div>;
  }

  if (!weather) {
    return <div className="text-sm text-muted-foreground">Weather unavailable</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{weather.icon}</span>
          <div>
            <div className="font-medium">{weather.temperature}°F</div>
            <div className="text-sm text-muted-foreground">{weather.description}</div>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>Humidity: {weather.humidity}%</div>
          <div>Wind: {weather.windSpeed} mph</div>
        </div>
      </div>
      
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="space-y-1">
          {weather.alerts.map((alert, index) => (
            <div key={index} className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded">
              {alert}
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        {WeatherService.getWeatherRecommendation(weather)}
      </div>
    </div>
  );
}

function GameDetails() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user } = useAppStore();
  
  // Use React Query for game data and mutations
  const { data: game, isLoading } = useGame(gameId || '');
  const { data: participants = [], isLoading: loadingPlayers } = useGameParticipants(gameId || '');
  const { toggleJoin, isLoading: actionLoading, getButtonText } = useGameJoinToggle();
  const { shareGame, navigateToChat, navigateToUser } = useDeepLinks();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    location: '',
    duration: 60,
    maxPlayers: 0,
    cost: ''
  });
  const [deleteReason, setDeleteReason] = useState('');
  
  // Process participants data to mark the host correctly
  const players = useMemo(() => {
    return participants.map(player => ({
      ...player,
      isHost: player.id === game?.creator_id
    }));
  }, [participants, game?.creator_id]);
  
  // Handle loading and error states - AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game details...</p>
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Game not found</h1>
          <p className="text-muted-foreground mb-4">The game you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Precompute formatted date/time labels for header and calendar
  const headerInfo = formatEventHeader(game.date, game.time);
  const calendarInfo = formatCalendarInfo(game.date, game.time);

  const isFull = game.currentPlayers >= game.maxPlayers;
  const tags: string[] | undefined = (game as any).tags;

  const handleJoinLeave = async () => {
    // Prevent multiple rapid clicks
    if (actionLoading) return;
    
    // If user is not authenticated, show quick join modal
    if (!user) {
      setShowQuickJoin(true);
      return;
    }
    
    // Use the centralized toggle logic
    toggleJoin(game);
  };

  const handleQuickJoinSuccess = async () => {
    setShowQuickJoin(false);
    // After successful signup, join the game
    if (gameId && game) {
      toggleJoin(game);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleChat = () => {
    navigateToChat('game', gameId!);
  };


  const handleShare = async () => {
    setShowInvite(true);
  };

  const handleDirections = () => {
    const address = game.location || "Location not specified";
    const encodedAddress = encodeURIComponent(address);
    
    // Try to open in native maps app first, fallback to Google Maps
    const mapsUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=m&z=16`;
    
    try {
      // For mobile devices, try to open native maps
      if (navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/)) {
        const nativeUrl = `maps://maps.google.com/maps?q=${encodedAddress}`;
        window.location.href = nativeUrl;
        
        // Fallback to web maps if native doesn't open
        setTimeout(() => {
          window.open(mapsUrl, '_blank');
        }, 1000);
      } else {
        window.open(mapsUrl, '_blank');
      }
      
      toast.success('Opening directions...');
    } catch (error) {
      toast.error('Failed to open directions');
    }
  };

  const handleEditGame = () => {
    setEditFormData({
      title: game.title,
      description: game.description,
      location: game.location,
      duration: game.duration || 60,
      maxPlayers: game.maxPlayers,
      cost: game.cost
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!gameId) return;
    
    setActionLoading(true);
    try {
      await SupabaseService.updateGame(gameId, editFormData);
      toast.success('Game updated successfully');
      setShowEditDialog(false);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      toast.error('Failed to update game', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!gameId) return;
    
    setActionLoading(true);
    try {
      await SupabaseService.deleteGame(gameId, deleteReason);
      toast.success('Game cancelled successfully');
      setShowDeleteDialog(false);
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to cancel game', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Check if current user is the game creator
  const isGameCreator = user && game && game.createdBy === user.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div role="text" aria-label={`Event: ${game.title}. ${headerInfo.aria}`}>
              <h1 className="text-xl font-semibold line-clamp-2">{game.title}</h1>
              <p className="text-sm text-muted-foreground">{headerInfo.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleShare}
              data-action="share"
              aria-label="Share game"
              title="Share game (U)"
            >
              <Share className="w-5 h-5" />
            </Button>
            {isGameCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    aria-label="Game options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditGame}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Game
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancel Game
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              aria-label="Report game"
            >
              <Flag className="w-5 h-5" />
            </Button>
          </div>
        </div>

      </div>

      <div className="px-4 py-6 space-y-6" id="main-content">
        {/* Hero Image & Basic Info */}
        <Card>
          {game.imageUrl && (
            <div className="relative">
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <ImageWithFallback
                  src={game.imageUrl}
                  alt={`${game.sport} game`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-4 right-4">
                <Badge className={`${game.sportColor} text-white border-none`}>
                  {game.sport}
                </Badge>
              </div>
            </div>
          )}
          {!game.imageUrl && (
            <div className="p-4 border-b">
              <Badge className={`${game.sportColor} text-white border-none`}>
                {game.sport}
              </Badge>
            </div>
          )}
          
          <CardContent className="p-6">
            {/* Game Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div>{calendarInfo.date}</div>
                  <div className="text-sm text-muted-foreground">{calendarInfo.time}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div>2 hours</div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </div>
              </div>
              
              
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div>{game.cost}</div>
                  <div className="text-sm text-muted-foreground">Cost</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Array.isArray(tags) && tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>

            {/* Join Button */}
            <Button
              onClick={handleJoinLeave}
              disabled={(!game.isJoined && isFull) || actionLoading}
              className="w-full h-12"
              variant={game.isJoined ? 'outline' : 'default'}
              data-action="join-game"
              title={`${game.isJoined ? 'Leave' : 'Join'} game (J)`}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {game.isJoined ? 'Leaving...' : 'Joining...'}
                </>
              ) : isFull && !game.isJoined ? (
                'Game is Full'
              ) : !user ? (
                'Join Game - Sign Up'
              ) : (
                getButtonText(game)
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div>{game.location}</div>
              </div>
              
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {(game.latitude && game.longitude) || game.location ? (
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=${(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${
                      game.latitude && game.longitude 
                        ? `${game.latitude},${game.longitude}` 
                        : encodeURIComponent(game.location)
                    }&zoom=15`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                    title="Game location map"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p>Map not available</p>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDirections}
                data-action="directions"
                title="Get directions (L)"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weather */}
        {((game.latitude && game.longitude) || game.location) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ☀️ Weather Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherInfo game={game} />
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>About This Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className={`text-sm leading-relaxed ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                {game.description}
              </p>
              {game.description.length > 150 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="p-0 h-auto"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </Button>
              )}
              
              <div>
                <h4 className="mb-2">Requirements</h4>
                <ul className="space-y-1">
                  {['Athletic shoes required', 'Bring water bottle', 'No experience necessary'].map((req, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Host Information */}
        <Card>
          <CardHeader>
            <CardTitle>Game Host</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <ClickableAvatar
                    userId={game.creatorId || game.creatorData?.id}
                    src={game.creatorData?.avatar}
                    alt={game.creatorData?.name || game.createdBy || 'Unknown'}
                    size="md"
                  />
                  <div>
                    <button 
                      onClick={() => navigateToUser(game.creatorId || game.creatorData?.id)}
                      className="hover:text-primary transition-colors cursor-pointer font-medium"
                      data-action="view-profile"
                    >
                      {game.creatorData?.name || game.createdBy || 'Unknown'}
                    </button>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-3 h-3 fill-current text-warning" />
                      No rating yet
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                              <CardTitle>Players ({players.length}/{game.maxPlayers})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                              {players.map((player, index) => (
                <div key={player.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClickableAvatar
                        userId={player.id}
                        src={player.avatar}
                        alt={player.name}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              console.log('🔍 Clicking on player:', player);
                              navigateToUser(player.id);
                            }}
                            className="hover:text-primary transition-colors cursor-pointer font-medium"
                            data-action="view-profile"
                          >
                            {player.name}
                          </button>
                          {player.isHost && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">Host</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-3 h-3 fill-current text-warning" />
                          {player.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < players.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Join Status Alert */}
        {game.isJoined && (
          <Alert className="border-success text-success-foreground">
            <AlertDescription>
              You're joined! See you on the field!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Quick Join Modal */}
      <QuickJoinModal
        isOpen={showQuickJoin}
        onClose={() => setShowQuickJoin(false)}
        gameTitle={game.title}
        gameId={game.id}
        onJoinSuccess={handleQuickJoinSuccess}
      />

      {/* Share Game Modal */}
      <ShareGameModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        game={game}
      />

      {/* Edit Game Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>
              Make changes to your game. Participants will be notified of any updates.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Game title"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Game description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="edit-location"
                value={editFormData.location}
                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Game location"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-duration" className="text-sm font-medium">
                Duration (minutes)
              </label>
              <Input
                id="edit-duration"
                type="number"
                min="15"
                max="480"
                value={editFormData.duration}
                onChange={(e) => setEditFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                placeholder="60"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-maxPlayers" className="text-sm font-medium">
                  Max Players
                </label>
                <Input
                  id="edit-maxPlayers"
                  type="number"
                  min="2"
                  max="50"
                  value={editFormData.maxPlayers}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-cost" className="text-sm font-medium">
                  Cost
                </label>
                <Input
                  id="edit-cost"
                  value={editFormData.cost}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="FREE or $10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Game Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Game</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All participants will be notified of the cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="delete-reason" className="text-sm font-medium">
                Reason for cancellation (optional)
              </label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Let participants know why the game is cancelled..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Keep Game
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteGame} 
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Game'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GameDetails;