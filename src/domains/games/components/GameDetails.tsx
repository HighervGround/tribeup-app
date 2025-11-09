import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { ClickableAvatar } from '@/shared/components/ui/clickable-avatar';
import { Separator } from '@/shared/components/ui/separator';
import { GameChat } from '@/domains/games/components/GameChat';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { SimpleCalendarButton } from '@/shared/components/common/SimpleCalendarButton';
import { WeatherWidget } from '@/domains/weather/components/WeatherWidget';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
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
  RefreshCw,
} from 'lucide-react';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import { useAppStore } from '@/store/appStore';
import { useGame, useGameParticipants } from '@/domains/games/hooks/useGames';
import { useGameJoinToggle } from '@/domains/games/hooks/useGameJoinToggle';
import { useDeepLinks } from '@/shared/hooks/useDeepLinks';
import { QuickJoinModal } from '@/domains/games/components/QuickJoinModal';
import { ShareGameModal } from '@/domains/games/components/ShareGameModal';
import { PostGameRatingModal } from '@/domains/games/components/PostGameRatingModal';
import { toast } from 'sonner';
import { SupabaseService } from '@/core/database/supabaseService';
import { supabase } from '@/core/database/supabase';
import { formatEventHeader, formatCalendarInfo, formatTimeString, formatCost } from '@/shared/utils/dateUtils';

function GameDetails() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user } = useAppStore();
  
  // Use React Query for game data and mutations
  const { data: game, isLoading, error: gameError } = useGame(gameId || '');
  const { data: participants = [], isLoading: loadingPlayers, error: participantsError } = useGameParticipants(gameId || '');
  const { toggleJoin, isLoading: actionLoading, getButtonText } = useGameJoinToggle();
  
  // Add timeout for loading states to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (isLoading || loadingPlayers) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
        console.warn('⏰ Loading timeout reached for GameDetails');
      }, 15000); // 15 second timeout
      
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading, loadingPlayers]);

  // Ensure participants are refetched when gameId changes
  useEffect(() => {
    if (gameId) {
      console.log('🔄 GameDetails: gameId changed, participants should refetch:', gameId);
    }
  }, [gameId]);
  const { shareGame, navigateToChat, navigateToUser } = useDeepLinks();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [editActionLoading, setEditActionLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    duration: 60,
    maxPlayers: 0,
    cost: ''
  });
  const [deleteReason, setDeleteReason] = useState('');
  
  // Process participants data to mark the host correctly
  const players = useMemo(() => {
    if (!participants || !game) return [];
    return participants.map(player => ({
      ...player,
      isHost: player.id === game?.creator_id
    }));
  }, [participants, game?.creator_id]);

  // Debug: Log route data structure
  useEffect(() => {
    if (game?.plannedRoute) {
      console.log('🗺️ [GameDetails] Planned route data:', game.plannedRoute);
      console.log('🗺️ [GameDetails] Route keys:', Object.keys(game.plannedRoute));
    }
  }, [game?.plannedRoute]);

  // Debug: Log game data including duration
  useEffect(() => {
    if (game) {
      console.log('🎮 [GameDetails] Game data:', {
        id: game.id,
        duration: game.duration,
        durationType: typeof game.duration,
        durationValue: game.duration
      });
    }
  }, [game?.duration]);

  // Precompute formatted date/time labels for header and calendar
  const headerInfo = useMemo(() => {
    if (!game) return { label: '', aria: '' };
    return formatEventHeader(game.date, game.time);
  }, [game?.date, game?.time]);

  const calendarInfo = useMemo(() => {
    if (!game) return { date: '', time: '' };
    return formatCalendarInfo(game.date, game.time);
  }, [game?.date, game?.time]);

  const isFull = game ? game.totalPlayers >= game.maxPlayers : false;
  const tags: string[] | undefined = game ? (game as any).tags : undefined;

  // Check if current user is the game creator
  const isGameCreator = user && game && (game.creatorId === user.id || game.createdBy === user.id);
  
  // Debug logging for dropdown visibility (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Dropdown Debug:', {
      user: user?.id,
      game: game?.id,
      creatorId: game?.creatorId,
      createdBy: game?.createdBy,
      isGameCreator,
      shouldShowDropdown: isGameCreator
    });
  }

  // Check if game is completed and user participated
  const isGameCompleted = useMemo(() => {
    if (!game) return false;
    const gameDateTime = new Date(`${game.date} ${game.time}`);
    const now = new Date();
    return gameDateTime < now;
  }, [game?.date, game?.time]);

  const userParticipated = useMemo(() => {
    if (!user || !game) return false;
    return game.isJoined || isGameCreator;
  }, [user, game?.isJoined, isGameCreator]);

  // Show rating modal for completed games where user participated
  // DISABLED: Rating system tables/functions don't exist yet
  // useEffect(() => {
  //   if (isGameCompleted && userParticipated && user && !showRatingModal && gameId) {
  //     // Check if user has already rated this game
  //     const checkExistingRating = async () => {
  //       try {
  //         const reviews = await SupabaseService.getGameReviews(gameId);
  //         const userReview = reviews.find(review => review.reviewer_id === user.id);
  //         
  //         if (!userReview) {
  //           setShowRatingModal(true);
  //         }
  //       } catch (error) {
  //         // No existing review found, show modal
  //         setShowRatingModal(true);
  //       }
  //     };
  //     
  //     checkExistingRating();
  //   }
  // }, [isGameCompleted, userParticipated, user, gameId, showRatingModal]);
  
  // Handle loading and error states - AFTER all hooks
  if ((isLoading || loadingPlayers) && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game details...</p>
          <p className="text-xs text-muted-foreground mt-2">
            If this takes too long, try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  // Handle timeout or errors
  if (loadingTimeout || gameError || participantsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <h2 className="text-xl font-semibold mb-2">Loading Issues</h2>
            <p className="text-muted-foreground mb-4">
              {loadingTimeout 
                ? "The activity is taking too long to load. This might be due to database connection issues."
                : "There was an error loading the activity details."
              }
            </p>
            {(gameError || participantsError) && (
              <p className="text-xs text-red-500 mb-4">
                Error: {gameError?.message || participantsError?.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Activity not found</h1>
          <p className="text-muted-foreground mb-4">The activity you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }


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
      date: game.date,
      time: game.time,
      duration: game.duration || 60,
      maxPlayers: game.maxPlayers,
      cost: game.cost
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!gameId) return;
    
    setEditActionLoading(true);
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
      setEditActionLoading(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!gameId) return;
    
    setEditActionLoading(true);
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
      setEditActionLoading(false);
    }
  };

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
              aria-label="Share activity"
              title="Share activity (U)"
            >
              <Share className="w-5 h-5" />
            </Button>
            <DropdownMenu onOpenChange={(open) => console.log('Dropdown open state:', open)}>
              <DropdownMenuTrigger asChild>
                <div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    aria-label="Game options"
                    onClick={(e) => {
                      console.log('Dropdown trigger clicked', e);
                      e.stopPropagation();
                    }}
                    style={{ display: isGameCreator ? 'flex' : 'none' }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[99999] relative">
                <DropdownMenuItem onClick={(e) => {
                  console.log('Edit game clicked');
                  e.stopPropagation();
                  handleEditGame();
                }}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Activity
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    console.log('Delete activity clicked');
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel Activity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <div className="text-sm text-muted-foreground">{formatTimeString(game.time)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div>
                    {(() => {
                      // Ensure duration is a valid number
                      let minutes = typeof game.duration === 'number' ? game.duration : parseInt(game.duration as any) || 60;
                      if (isNaN(minutes) || minutes <= 0) {
                        minutes = 60; // Default fallback
                      }
                      
                      if (minutes < 60) {
                        return `${minutes} min`;
                      } else if (minutes === 60) {
                        return '1 hour';
                      } else {
                        const hours = Math.floor(minutes / 60);
                        const remainingMinutes = minutes % 60;
                        if (remainingMinutes === 0) {
                          return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
                        } else {
                          return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} min`;
                        }
                      }
                    })()}
                  </div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </div>
              </div>
              
              
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div>{formatCost(game.cost)}</div>
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

            {/* Calendar Integration */}
            <SimpleCalendarButton 
              game={game} 
              variant="outline" 
              size="default"
              className="w-full h-12"
            />
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
          <WeatherWidget
            latitude={game.latitude}
            longitude={game.longitude}
            location={game.location}
            gameDateTime={(() => {
              // Create proper datetime from game date and time
              const dateStr = game.date; // e.g., "2024-10-12"
              const timeStr = game.time; // e.g., "14:30" or "2:30 PM"
              
              console.log(`🎮 Raw game data: date="${dateStr}", time="${timeStr}"`);
              
              // Handle different time formats
              let hour, minute;
              if (timeStr && timeStr.includes(':')) {
                const timeParts = timeStr.split(':');
                hour = parseInt(timeParts[0]);
                minute = parseInt(timeParts[1].split(' ')[0]); // Remove AM/PM if present
                
                // Handle AM/PM format
                if (timeStr.toLowerCase().includes('pm') && hour !== 12) {
                  hour += 12;
                } else if (timeStr.toLowerCase().includes('am') && hour === 12) {
                  hour = 0;
                }
              } else {
                console.warn(`🎮 Invalid time format: "${timeStr}", using 12:00 PM`);
                hour = 12; // Default fallback
                minute = 0;
              }
              
              // Create date in local timezone to avoid UTC conversion issues
              const gameDateTime = new Date(dateStr + 'T00:00:00');
              gameDateTime.setHours(hour, minute, 0, 0);
              
              console.log(`🎮 Parsed DateTime: ${dateStr} ${timeStr} → ${gameDateTime.toISOString()}`);
              console.log(`🎮 Local time: ${gameDateTime.toLocaleString()}`);
              console.log(`🎮 Current time: ${new Date().toLocaleString()}`);
              
              const hoursDiff = (gameDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
              console.log(`🎮 Time difference: ${hoursDiff > 0 ? `${Math.round(hoursDiff)} hours in future` : `${Math.round(Math.abs(hoursDiff))} hours in past`}`);
              
              return gameDateTime;
            })()}
          />
        )}

        {/* Planned Route - for running, hiking, cycling */}
        {(() => {
          const isRouteSport = ['running', 'hiking', 'cycling'].includes(game.sport.toLowerCase());
          const hasRoute = !!game.plannedRoute;
          
          console.log('🗺️ [GameDetails] Route check:', {
            sport: game.sport,
            isRouteSport,
            hasRoute,
            plannedRoute: game.plannedRoute,
            routeType: typeof game.plannedRoute,
            routeKeys: game.plannedRoute ? Object.keys(game.plannedRoute) : []
          });
          
          if (!isRouteSport) return null;
          
          return hasRoute ? (
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Planned Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {game.plannedRoute.name && (
                  <div>
                    <h4 className="font-medium mb-1">{game.plannedRoute.name}</h4>
                    {game.plannedRoute.description && (
                      <p className="text-sm text-muted-foreground">{game.plannedRoute.description}</p>
                    )}
                  </div>
                )}
                
                {/* Show distance - handle multiple formats */}
                {(game.plannedRoute.distance || game.plannedRoute.distance_meters || game.plannedRoute.distance_km) && (
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="font-medium">
                        {(() => {
                          if (game.plannedRoute.distance) return game.plannedRoute.distance;
                          if (game.plannedRoute.distance_meters) return `${(game.plannedRoute.distance_meters / 1000).toFixed(2)} km`;
                          if (game.plannedRoute.distance_km) return `${game.plannedRoute.distance_km} km`;
                          return 'N/A';
                        })()}
                      </span>
                      <span className="text-muted-foreground ml-1">distance</span>
                    </div>
                    {(game.plannedRoute.elevation || game.plannedRoute.elevation_gain) && (
                      <div>
                        <span className="font-medium">
                          {(() => {
                            if (game.plannedRoute.elevation) return game.plannedRoute.elevation;
                            if (game.plannedRoute.elevation_gain) return `${game.plannedRoute.elevation_gain}m`;
                            return 'N/A';
                          })()}
                        </span>
                        <span className="text-muted-foreground ml-1">elevation</span>
                      </div>
                    )}
                    {(game.plannedRoute.duration || game.plannedRoute.estimated_duration) && (
                      <div>
                        <span className="font-medium">
                          {game.plannedRoute.duration || game.plannedRoute.estimated_duration}
                        </span>
                        <span className="text-muted-foreground ml-1">estimated time</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show route path/coordinates using Google Maps Static API */}
                {(() => {
                  // Try different path structures
                  const path = game.plannedRoute.path || game.plannedRoute.coordinates || game.plannedRoute.waypoints;
                  
                  if (path && Array.isArray(path) && path.length > 0) {
                    // Normalize coordinate format helper
                    const getLat = (p: any): number | null => {
                      if (!p) return null;
                      if (typeof p === 'number') return p;
                      if (p.lat !== undefined) return p.lat;
                      if (p.latitude !== undefined) return p.latitude;
                      if (Array.isArray(p)) return p[1];
                      return null;
                    };
                    
                    const getLng = (p: any): number | null => {
                      if (!p) return null;
                      if (typeof p === 'number') return p;
                      if (p.lng !== undefined) return p.lng;
                      if (p.lon !== undefined) return p.lon;
                      if (p.longitude !== undefined) return p.longitude;
                      if (Array.isArray(p)) return p[0];
                      return null;
                    };
                    
                    // Filter out invalid coordinates
                    const validPath = path
                      .map(p => ({ lat: getLat(p), lng: getLng(p) }))
                      .filter(p => p.lat !== null && p.lng !== null) as Array<{ lat: number; lng: number }>;
                    
                    if (validPath.length < 2) {
                      return (
                        <div className="text-sm text-muted-foreground">
                          Route path requires at least 2 valid coordinates.
                        </div>
                      );
                    }
                    
                    // Calculate total distance
                    const calculateDistance = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number => {
                      const R = 6371; // Earth's radius in km
                      const lat1 = p1.lat * Math.PI / 180;
                      const lat2 = p2.lat * Math.PI / 180;
                      const dLat = lat2 - lat1;
                      const dLon = (p2.lng - p1.lng) * Math.PI / 180;
                      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                      return R * c;
                    };
                    
                    let totalDistance = 0;
                    for (let i = 0; i < validPath.length - 1; i++) {
                      totalDistance += calculateDistance(validPath[i], validPath[i + 1]);
                    }
                    
                    // Build Google Maps Static API URL with path
                    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
                    const pathStr = validPath.map(p => `${p.lat},${p.lng}`).join('|');
                    
                    // Calculate center and zoom for the map
                    const lats = validPath.map(p => p.lat);
                    const lngs = validPath.map(p => p.lng);
                    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                    const latDiff = Math.max(...lats) - Math.min(...lats);
                    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
                    const maxDiff = Math.max(latDiff, lngDiff);
                    // Calculate zoom level (zoomed in more - higher zoom values)
                    let zoom = 16; // Default to higher zoom
                    if (maxDiff > 0.1) zoom = 12;
                    else if (maxDiff > 0.05) zoom = 13;
                    else if (maxDiff > 0.02) zoom = 14;
                    else if (maxDiff > 0.01) zoom = 15;
                    else if (maxDiff > 0.005) zoom = 16;
                    else zoom = 17; // Very zoomed in for small routes
                    
                    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&maptype=roadmap&zoom=${zoom}&path=weight:5|color:0x0000ff|${pathStr}&markers=color:green|label:S|${validPath[0].lat},${validPath[0].lng}&markers=color:red|label:E|${validPath[validPath.length - 1].lat},${validPath[validPath.length - 1].lng}&key=${apiKey}`;
                    
                    return (
                      <>
                        {/* Show calculated distance if not already shown */}
                        {totalDistance > 0 && !game.plannedRoute.distance && !game.plannedRoute.distance_meters && !game.plannedRoute.distance_km && (
                          <div className="flex items-center gap-4 text-sm mb-4">
                            <div>
                              <span className="font-medium">{totalDistance.toFixed(2)} km</span>
                              <span className="text-muted-foreground ml-1">distance</span>
                            </div>
                          </div>
                        )}
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                          <a 
                            href={(() => {
                              // Determine travel mode based on sport
                              const sportLower = game.sport.toLowerCase();
                              let mode = 'walking'; // default
                              if (sportLower === 'cycling') {
                                mode = 'bicycling';
                              } else if (sportLower === 'running' || sportLower === 'hiking' || sportLower === 'walking') {
                                mode = 'walking';
                              }
                              // Use Google Maps directions URL with correct travel mode
                              const first = validPath[0];
                              const last = validPath[validPath.length - 1];
                              const waypoints = validPath.slice(1, -1);
                              const waypointStr = waypoints.length > 0 
                                ? `/${waypoints.map(p => `${p.lat},${p.lng}`).join('/')}`
                                : '';
                              return `https://www.google.com/maps/dir/${first.lat},${first.lng}${waypointStr}/${last.lat},${last.lng}/data=!3m1!4b1!4m2!4m1!3e2?mode=${mode}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full h-full"
                          >
                            <img
                              src={staticMapUrl}
                              alt="Route map"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Failed to load static map, falling back to interactive map');
                                // Fallback to interactive iframe
                                const first = validPath[0];
                                const last = validPath[validPath.length - 1];
                                const waypoints = validPath.slice(1, -1);
                                const waypointStr = waypoints.length > 0 
                                  ? `&waypoints=${waypoints.map(p => `${p.lat},${p.lng}`).join('|')}`
                                  : '';
                                const iframeSrc = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${first.lat},${first.lng}&destination=${last.lat},${last.lng}${waypointStr}&zoom=${zoom}`;
                                (e.target as HTMLImageElement).style.display = 'none';
                                const container = (e.target as HTMLElement).parentElement;
                                if (container) {
                                  container.innerHTML = `<iframe src="${iframeSrc}" width="100%" height="100%" style="border:0" allowfullscreen loading="lazy"></iframe>`;
                                }
                              }}
                            />
                          </a>
                        </div>
                      </>
                    );
                  }
                  
                  // Fallback: Try polyline if available
                  if (game.plannedRoute.polyline) {
                    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
                    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&maptype=roadmap&path=weight:5|color:0x0000ff|enc:${encodeURIComponent(game.plannedRoute.polyline)}&key=${apiKey}`;
                    
                    return (
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={staticMapUrl}
                          alt="Route map"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
                {/* Fallback message if no route data available */}
                {!game.plannedRoute.path && !game.plannedRoute.polyline && !game.plannedRoute.coordinates && !game.plannedRoute.waypoints && (
                  <div className="text-sm text-muted-foreground">
                    No route path available for display.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Planned Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  No route has been planned for this {game.sport} activity.
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>About This Activity</CardTitle>
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
            <CardTitle>Activity Host</CardTitle>
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
                    {/* Rating temporarily hidden during early testing phase */}
                    {/* <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-3 h-3 fill-current text-warning" />
                      {game.creatorData?.rating || '4.5'}
                    </div> */}
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
              <div className="flex items-center gap-2">
                <CardTitle>Players ({game.totalPlayers ?? players.length}/{game.maxPlayers ?? 0})</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                              {players.map((player, index) => (
                <div key={player.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {player.isGuest ? (
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-muted">
                            {player.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <ClickableAvatar
                          userId={player.id}
                          src={player.avatar}
                          alt={player.name}
                          size="md"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          {player.isGuest ? (
                            <span className="font-medium">{player.name}</span>
                          ) : (
                            <button 
                              onClick={async () => {
                                console.log('🔍 [GameDetails] Clicking on player:', player);
                                
                                // Debug: Verify session and client before navigation
                                const { data: { session } } = await supabase.auth.getSession();
                                console.log('🔍 [GameDetails] Session check:', {
                                  hasSession: !!session,
                                  userId: session?.user?.id,
                                  targetPlayerId: player.id
                                });
                                console.log('🔍 [GameDetails] Client check:', {
                                  hasClient: !!supabase,
                                  hasAuth: !!supabase.auth
                                });
                                
                                navigateToUser(player.id);
                              }}
                              className="hover:text-primary transition-colors cursor-pointer font-medium"
                              data-action="view-profile"
                            >
                              {player.name}
                            </button>
                          )}
                          {player.isHost && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">Host</Badge>
                          )}
                          {player.isGuest && (
                            <Badge variant="outline" className="text-xs px-2 py-0 border-muted-foreground/30">Guest</Badge>
                          )}
                        </div>
                        {/* Player rating temporarily hidden during early testing phase */}
                        {/* <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-3 h-3 fill-current text-warning" />
                          {player.rating}
                        </div> */}
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

      {/* Activity Chat */}
      <div className="lg:col-span-4">
        <GameChat gameId={gameId!} />
      </div>

      {/* Quick Join Modal */}
      <QuickJoinModal
        isOpen={showQuickJoin}
        onClose={() => setShowQuickJoin(false)}
        gameTitle={game.title}
        gameId={game.id}
        onJoinSuccess={handleQuickJoinSuccess}
      />

      {/* Share Activity Modal */}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-date" className="text-sm font-medium">
                  Date
                </label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-time" className="text-sm font-medium">
                  Time
                </label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editFormData.time}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
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
            <Button onClick={handleSaveEdit} disabled={editActionLoading}>
              {editActionLoading ? (
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

      {/* Delete Activity Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Activity</DialogTitle>
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
                placeholder="Let participants know why the activity is cancelled..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Keep Activity
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteGame} 
              disabled={editActionLoading}
            >
              {editActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Activity'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Game Rating Modal */}
      <PostGameRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        gameId={gameId!}
        gameTitle={game?.title || ''}
        players={players}
      />
    </div>
  );
}

export default GameDetails;