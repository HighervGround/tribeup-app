import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { ClickableAvatar } from '@/shared/components/ui/clickable-avatar';
import { Separator } from '@/shared/components/ui/separator';
import { GameChat } from './GameChat';
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
  Route,
  Mountain,
  Trash2,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import { useAppStore } from '@/store/appStore';
import { useGame, useGameParticipants } from '@/domains/games/hooks/useGames';
import { useGameParticipantsRealtime } from '@/domains/games/hooks/useGameParticipants';
import { useGameJoinToggle } from '@/domains/games/hooks/useGameJoinToggle';
import { useDeepLinks } from '@/shared/hooks/useDeepLinks';
import { QuickJoinModal } from './QuickJoinModal';
import { ShareGameModal } from './ShareGameModal';
import { PostGameRatingModal } from './PostGameRatingModal';
import { RouteDisplayMap } from '@/domains/locations/components/RouteDisplayMap';
import { RSVPSection, AttendeeList, type Attendee, type RSVPStatus } from '@/domains/games/components';
import { Facepile } from '@/shared/components/ui';
import { toast } from 'sonner';
import { SupabaseService } from '@/core/database/supabaseService';
import { supabase } from '@/core/database/supabase';
import { formatEventHeader, formatCalendarInfo, formatTimeString, formatCost } from '@/shared/utils/dateUtils';

function GameDetails() {
  console.log(' GAMEDETAILS COMPONENT LOADED - CACHE REFRESH WORKED!');
  console.log('🔥 GAMEDETAILS COMPONENT LOADED - CACHE REFRESH WORKED!');
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user } = useAppStore();
  
  // Helper function for difficulty color coding
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Use React Query for game data and mutations
  const { data: game, isLoading, error: gameError } = useGame(gameId || '');
  const { data: participants = [], isLoading: loadingPlayers, error: participantsError, refetch: refetchParticipants } = useGameParticipants(gameId || '');
  const { toggleJoin, isLoading: actionLoading, getButtonText } = useGameJoinToggle();
  
  // Set up realtime subscription for participants updates
  useGameParticipantsRealtime(gameId || null);
  
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
      // Force refetch participants when gameId changes
      refetchParticipants();
    }
  }, [gameId, refetchParticipants]);

  const { shareGame, navigateToChat, navigateToUser } = useDeepLinks();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [editActionLoading, setEditActionLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    location: string;
    date: string;
    time: string;
    duration: number | string;
    maxPlayers: number;
    cost: string;
  }>({
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
  const [capacity, setCapacity] = useState<any | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  
  // Load initial capacity stats
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!gameId) return;
      try {
        const { data, error } = await supabase
          .from('game_rsvp_stats')
          .select('*')
          .eq('game_id', gameId)
          .single();
        if (!cancelled && !error && data) {
          setCapacity(data);
        }
      } catch (err) {
        // Ignore errors, capacity is optional
      }
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  // Refresh capacity when participants change
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('game_rsvp_stats')
          .select('*')
          .eq('game_id', gameId)
          .single();
        if (!cancelled && !error && data) {
          setCapacity(data);
        }
      } catch (err) {
        // Ignore errors
      }
    })();
    return () => { cancelled = true; };
  }, [gameId, participants.length]);
  
  // Process participants data to mark the host correctly
  const players = useMemo(() => {
    if (!participants || !game) return [];
    return participants.map(player => ({
      ...player,
      isHost: player.id === game?.creator_id
    }));
  }, [participants, game?.creator_id]);

  // Convert players to Attendee format for RSVPSection
  const attendees: Attendee[] = useMemo(() => {
    if (!players || !game) return [];
    return players.map(player => ({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      email: player.email,
      status: 'going' as RSVPStatus, // All current participants are "going"
      isHost: player.isHost || player.id === game?.creator_id,
      isOrganizer: player.isHost || player.id === game?.creator_id,
      isGuest: player.isGuest || false,
      joinedAt: player.joinedAt,
    }));
  }, [players, game?.creator_id]);

  // Get current user's RSVP status
  const userRSVPStatus: RSVPStatus | undefined = useMemo(() => {
    if (!user?.id || !game?.isJoined) return undefined;
    return 'going';
  }, [user?.id, game?.isJoined]);

  // Debug logging (moved after players and attendees are defined)
  useEffect(() => {
    console.log('📊 GameDetails participants data:', {
      participants,
      participantsLength: participants?.length,
      loadingPlayers,
      participantsError,
      gameId,
      playersLength: players?.length,
      attendeesLength: attendees?.length
    });
  }, [participants, loadingPlayers, participantsError, gameId, players, attendees]);
  
  // Force refetch participants on mount if empty and not loading
  useEffect(() => {
    if (gameId && !loadingPlayers && participants.length === 0 && !participantsError) {
      console.log('🔄 GameDetails: Participants empty, forcing refetch');
      refetchParticipants();
    }
  }, [gameId, loadingPlayers, participants.length, participantsError, refetchParticipants]);

  // Handle RSVP status change
  const handleRSVPChange = async (status: RSVPStatus) => {
    if (!gameId || !user?.id || !game) return;
    
    try {
      setRsvpError(null);
      
      if (status === 'going' && !game.isJoined) {
        // Join the game
        await toggleJoin(game);
        toast.success('Successfully joined the activity!');
      } else if (status !== 'going' && game.isJoined) {
        // Leave the game
        await toggleJoin(game);
        toast.success('Left the activity');
      }
      
      // Refresh capacity stats after RSVP change
      try {
        const { data, error } = await supabase
          .from('game_rsvp_stats')
          .select('*')
          .eq('game_id', gameId)
          .single();
        if (!error && data) {
          setCapacity(data);
        }
      } catch (err) {
        // Ignore capacity refresh errors
      }
      
      // Refetch participants to ensure UI is in sync
      refetchParticipants();
    } catch (error: any) {
      console.error('Failed to update RSVP:', error);
      const errorMessage = error?.message || 'Failed to update RSVP status';
      setRsvpError(errorMessage);
      toast.error(errorMessage);
    }
  };

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

  // Capacity data from stats view
  const capacityData = useMemo(() => {
    if (capacity) {
      return {
        totalPlayers: capacity.total_rsvps ?? 0,
        maxPlayers: capacity.capacity ?? game?.maxPlayers ?? 0,
        availableSpots: capacity.capacity_remaining ?? 0
      };
    }
    // Fallback to game data
    return {
      totalPlayers: game?.totalPlayers ?? 0,
      maxPlayers: game?.maxPlayers ?? 0,
      availableSpots: Math.max(0, (game?.maxPlayers ?? 0) - (game?.totalPlayers ?? 0))
    };
  }, [capacity, game?.maxPlayers, game?.totalPlayers]);

  const isFull = capacityData.availableSpots === 0;
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
      isGameCreator: isGameCreator,
      showDropdown: isGameCreator,
      canEdit: user?.id === game?.creatorId
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
    if (actionLoading || !game) return;
    
    try {
      setRsvpError(null);
      
      // Check authentication status
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // If user is not authenticated, show quick join modal
      if (!authUser) {
        console.log('👤 User not authenticated, showing login modal');
        setShowQuickJoin(true);
        return;
      }
      
      // User is authenticated, proceed with join/leave
      console.log('✅ User authenticated, proceeding with join/leave');
      await toggleJoin(game);
      
      // Refresh capacity stats after join/leave
      try {
        const { data, error } = await supabase
          .from('game_rsvp_stats')
          .select('*')
          .eq('game_id', gameId)
          .single();
        if (!error && data) {
          setCapacity(data);
        }
      } catch (err) {
        // Ignore capacity refresh errors
      }
      
      // Refetch participants to ensure UI is in sync
      refetchParticipants();
    } catch (error: any) {
      console.error('Failed to join/leave game:', error);
      const errorMessage = error?.message || 'Failed to update game status';
      setRsvpError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleQuickJoinSuccess = async () => {
    console.log('🎉 Quick join success, attempting to join game');
    setShowQuickJoin(false);
    
    // Wait a moment for auth state to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify user is now authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser && gameId && game) {
      console.log('✅ User authenticated after signup, joining game:', gameId);
      
      // IMPORTANT: Use 'joined' not 'going' - 'going' is UI-only RSVP status
      const participantStatus = 'joined' as const;
      console.log(`📝 Quick join: inserting with status "${participantStatus}"`);
      
      // Join the game - use upsert to handle duplicates gracefully
      const { error } = await supabase
        .from('game_participants')
        .upsert(
          {
            game_id: gameId,
            user_id: authUser.id, // Explicitly include user_id
            status: participantStatus // Database expects: 'joined' | 'left' | 'completed' | 'no_show'
          },
          {
            onConflict: 'game_id,user_id'
          }
        );
      
      if (error) {
        // Check if it's a duplicate error (which is actually fine)
        if (error.code === '23505') {
          console.log('✅ User already in game (duplicate), proceeding anyway');
          toast.success('Welcome! You\'re joining the game.');
          window.location.reload();
        } else {
          console.error('❌ Failed to join game after signup:', error);
          toast.error('Failed to join game. Please try clicking Join again.');
        }
      } else {
        console.log('✅ Successfully joined game after signup');
        toast.success('Welcome! You\'ve successfully joined the game.');
        
        // Refresh the page to update all game data
        window.location.reload();
      }
    } else {
      console.warn('⚠️ User not authenticated after quick join success');
      toast.error('Please log in and try joining again');
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

  const handleAddToCalendar = () => {
    if (!game) return;
    
    // Create event details
    const gameDateTime = new Date(`${game.date}T${game.time}`);
    const endDateTime = new Date(gameDateTime);
    
    // Use game duration if available, otherwise default to 2 hours
    const durationMinutes = typeof game.duration === 'number' 
      ? game.duration 
      : parseInt(String(game.duration)) || 120; // Default to 2 hours if not available
    endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);
    
    const title = `${game.sport}: ${game.title}`;
    const description = `Join us for ${game.sport}!\n\n${game.description || ''}\n\nMax Players: ${game.maxPlayers || (game as any).max_players}\nCost: ${game.cost || 'Free'}`;
    const location = game.location;
    
    // Format dates (YYYYMMDDTHHMMSSZ)
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    // Detect device and use appropriate calendar
    const userAgent = navigator.userAgent;
    
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      // iOS - Create .ics file and try to open with Calendar app
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TribeUp//TribeUp Social Sports//EN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tribeup.app`,
        `DTSTART:${formatDate(gameDateTime)}`,
        `DTEND:${formatDate(endDateTime)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        `DTSTAMP:${formatDate(new Date())}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      
      // Try to open with Calendar app
      window.location.href = url;
      
      // Cleanup after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } else if (/Android/.test(userAgent)) {
      // Android - Use Google Calendar
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(gameDateTime)}/${formatDate(endDateTime)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      window.open(googleUrl, '_blank');
      
    } else if (/Mac/.test(userAgent)) {
      // macOS - Create .ics file for Calendar app
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TribeUp//TribeUp Social Sports//EN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tribeup.app`,
        `DTSTART:${formatDate(gameDateTime)}`,
        `DTEND:${formatDate(endDateTime)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        `DTSTAMP:${formatDate(new Date())}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } else {
      // Default - Google Calendar for all other devices
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(gameDateTime)}/${formatDate(endDateTime)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      window.open(googleUrl, '_blank');
    }
  };

  const handleEditGame = () => {
    console.log('🚨 [EDIT] Edit button clicked!');
    console.log('🚨 [EDIT] Game object:', game);
    console.log('🚨 [EDIT] Game duration:', game.duration, typeof game.duration);
    
    const formData = {
      title: game.title || '',
      description: game.description || '',
      location: game.location || '',
      date: game.date || '',
      time: game.time || '',
      duration: Number(game.duration) || 60,
      maxPlayers: game.maxPlayers || 0,
      cost: game.cost || ''
    };
    
    console.log('🚨 [EDIT] Setting form data:', formData);
    setEditFormData(formData);
    setShowEditDialog(true);
    console.log('🚨 [EDIT] Dialog should be open now');
  };

  const handleSaveEdit = async () => {
    if (!gameId) return;
    
    console.log('🚨 [SAVE] Save button clicked!');
    console.log('🚨 [SAVE] Current form data:', editFormData);
    console.log('🚨 [SAVE] Duration specifically:', {
      value: editFormData.duration,
      type: typeof editFormData.duration,
      isNumber: typeof editFormData.duration === 'number',
      isValid: !isNaN(Number(editFormData.duration))
    });
    
    // Harden parsing and validation - no silent fallbacks
    const rawDuration = String(editFormData.duration ?? '').trim();
    const parsedDuration = Number.parseInt(rawDuration, 10);
    
    if (!rawDuration || Number.isNaN(parsedDuration) || parsedDuration <= 0) {
      toast.error('Please enter a valid duration in minutes (minimum 1 minute)');
      return;
    }
    
    console.log('[Edit] Parsed duration:', {
      raw: rawDuration,
      parsed: parsedDuration,
      isValid: !Number.isNaN(parsedDuration) && parsedDuration > 0
    });
    
    setEditActionLoading(true);
    try {
      const updatePayload = {
        ...editFormData,
        duration: parsedDuration // Ensure we use the parsed number
      };
      
      console.log('[Edit] Update payload:', updatePayload);
      
      await SupabaseService.updateGame(gameId, updatePayload);
      
      // Verify the update worked by fetching the updated row
      const { data: updatedGame } = await supabase
        .from('games')
        .select('id, duration_minutes, duration')
        .eq('id', gameId)
        .single();
      
      console.log('[Edit] Updated row from DB:', updatedGame);
      
      toast.success('Game updated successfully');
      setShowEditDialog(false);
      
      // Use React Query invalidation instead of hard refresh
      // This will refetch the data and update the UI
      window.location.reload(); // TODO: Replace with proper React Query invalidation
    } catch (error: any) {
      console.error('[Edit] Update failed:', error);
      console.error('[Edit] Full error details:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
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
    <div className="min-h-screen bg-background" style={{ overflowAnchor: 'none' } as React.CSSProperties}>
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
                  console.log('🚨 DROPDOWN EDIT CLICKED!');
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
            {/* Game Info Grid - even grid layout matching PublicGamePage */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Players */}
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium mb-1">
                    {capacity ? (
                      <>
                        {(capacity.total_rsvps ?? 0)}/{(capacity.capacity || game.maxPlayers) ?? 0} players
                      </>
                    ) : (
                      <>
                        {(game.totalPlayers ?? 0)}/{(game.maxPlayers ?? 0)} players
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {capacityData && capacityData.availableSpots > 0 ? (
                      <span className="text-green-600 dark:text-green-400">
                        {capacityData.availableSpots} spot{capacityData.availableSpots !== 1 ? 's' : ''} available
                      </span>
                    ) : (
                      'Capacity'
                    )}
                  </div>
                </div>
              </div>
              
              {/* Cost */}
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium mb-1">{formatCost(game.cost)}</div>
                  <div className="text-sm text-muted-foreground">Cost</div>
                </div>
              </div>
              
              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <button
                    onClick={handleDirections}
                    className="text-left hover:opacity-80 transition-opacity cursor-pointer group w-full"
                  >
                    <div className="font-medium mb-1 group-hover:text-primary">
                      {(() => {
                        if (!game.location) return 'Location TBD';
                        // Parse address and show only street address + neighborhood
                        const parts = game.location.split(',').map((s: string) => s.trim());
                        // Skip first part if it's a single word/sport name (like "NBA")
                        // Show street number + street name (usually parts 1-2 or 2-3)
                        const startIdx = parts[0] && parts[0].length < 5 && !parts[0].match(/\d/) ? 1 : 0;
                        // Take street address (usually 2 parts: number + street name)
                        // Plus one more part for neighborhood if available
                        return parts.slice(startIdx, startIdx + 3).join(', ');
                      })()}
                    </div>
                    <div className="text-sm text-muted-foreground">Location</div>
                  </button>
                </div>
              </div>
              
              {/* Date and Time */}
              <button
                onClick={handleAddToCalendar}
                className="flex items-start gap-3 text-left hover:opacity-80 transition-opacity cursor-pointer group w-full"
              >
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 group-hover:text-primary" />
                <div className="flex-1">
                  <div className="font-medium mb-1 group-hover:text-primary">{calendarInfo.date}</div>
                  <div className="text-sm text-muted-foreground">{formatTimeString(game.time)}</div>
                </div>
              </button>
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
                `Game is Full (${capacityData.totalPlayers}/${capacityData.maxPlayers})`
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
                <div>
                  {(() => {
                    if (!game.location) return 'Location TBD';
                    // Parse address and show street address + neighborhood + city + state (but not county/zip/country)
                    const parts = game.location.split(',').map((s: string) => s.trim());
                    // Skip first part if it's a single word/sport name (like "NBA")
                    const startIdx = parts[0] && parts[0].length < 5 && !parts[0].match(/\d/) ? 1 : 0;
                    
                    // Find where to stop - exclude county, zip, country
                    // Look for patterns like "County", zip codes (5 digits), "United States"
                    let endIdx = parts.length;
                    for (let i = startIdx; i < parts.length; i++) {
                      const part = parts[i].toLowerCase();
                      if (
                        part.includes('county') ||
                        part.includes('community board') ||
                        /^\d{5}$/.test(part) || // Zip code
                        part.includes('united states') ||
                        part === 'usa'
                      ) {
                        endIdx = i;
                        break;
                      }
                    }
                    
                    // Take up to 5 parts (street + neighborhood + city + state)
                    const maxParts = Math.min(5, endIdx - startIdx);
                    return parts.slice(startIdx, startIdx + maxParts).join(', ');
                  })()}
                </div>
              </div>
              
              <div 
                className="aspect-video bg-muted rounded-lg flex items-center justify-center"
                style={{ 
                  contain: 'layout',
                  overflowAnchor: 'none',
                } as React.CSSProperties}
              >
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
            duration={game.duration || 60}
            sport={game.sport}
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
                
                {/* Enhanced Route Analysis Display */}
                {game.plannedRoute.analysis ? (
                  <div className="space-y-4">
                    {/* Route Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Route className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-muted-foreground">Distance</p>
                        <p className="font-semibold">{game.plannedRoute.analysis.distance}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Clock className="w-5 h-5 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-muted-foreground">Est. Time</p>
                        <p className="font-semibold">{game.plannedRoute.analysis.duration}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Mountain className="w-5 h-5 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm text-muted-foreground">Elevation Gain</p>
                        <p className="font-semibold">{game.plannedRoute.analysis.elevationGain}m</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Badge className={getDifficultyColor(game.plannedRoute.analysis.difficulty)}>
                          {game.plannedRoute.analysis.difficulty}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">Difficulty</p>
                      </div>
                    </div>

                    {/* Additional Route Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Max Elevation:</span>
                        <span className="ml-2 font-medium">{game.plannedRoute.analysis.maxElevation}m</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Gradient:</span>
                        <span className="ml-2 font-medium">{game.plannedRoute.analysis.avgGradient}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Elevation Loss:</span>
                        <span className="ml-2 font-medium">{game.plannedRoute.analysis.elevationLoss}m</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Waypoints:</span>
                        <span className="ml-2 font-medium">{game.plannedRoute.path?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Fallback to basic distance display */
                  (game.plannedRoute.distance || game.plannedRoute.distance_meters || game.plannedRoute.distance_km) && (
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
                    </div>
                  )
                )}
                
                {/* Interactive Route Map */}
                {game.plannedRoute.path && game.plannedRoute.path.length > 0 ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Route Map</h4>
                    <RouteDisplayMap 
                      waypoints={game.plannedRoute.path}
                      sport={game.sport}
                      analysis={game.plannedRoute.analysis || undefined}
                    />
                  </div>
                ) : (
                  /* Fallback: Show route path/coordinates using Google Maps Static API only if no interactive map */
                  (() => {
                    // Try different path structures
                    const path = game.plannedRoute.coordinates || game.plannedRoute.waypoints;
                  
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
                })()
                )}
                
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

        {/* RSVP Error Alert */}
        {rsvpError && (
          <Alert variant="destructive">
            <AlertDescription>{rsvpError}</AlertDescription>
          </Alert>
        )}

        {/* RSVP Section */}
        <RSVPSection
          attendees={attendees}
          currentUserId={user?.id}
          userRSVPStatus={userRSVPStatus}
          maxPlayers={capacityData.maxPlayers}
          currentPlayers={capacityData.totalPlayers}
          onRSVPChange={handleRSVPChange}
          onInvite={() => setShowInvite(true)}
          onAttendeeClick={(attendee) => {
            // Navigate to user profile if attendee has a valid user ID
            if (attendee?.id && typeof attendee.id === 'string' && !attendee.id.startsWith('guest-') && !attendee.id.startsWith('temp-')) {
              try {
                navigateToUser(attendee.id);
              } catch (error) {
                console.error('Failed to navigate to user profile:', error);
              }
            }
          }}
          showFullList={true}
        />

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
                min="1"
                max="480"
                step="1"
                value={editFormData.duration}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  console.log('[Edit] Duration input changed:', {
                    rawValue,
                    currentState: editFormData.duration
                  });
                  
                  // Store as number for consistency with form state
                  const numValue = parseInt(rawValue, 10);
                  setEditFormData(prev => ({ 
                    ...prev, 
                    duration: isNaN(numValue) ? '' : numValue // Use empty string for invalid, not fallback
                  }));
                }}
                placeholder="Enter duration in minutes"
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
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="border-border bg-background hover:bg-muted"
            >
              Keep Activity
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteGame} 
              disabled={editActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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