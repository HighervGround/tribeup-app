import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Share2,
  ExternalLink,
  CheckCircle,
  LogIn,
  Mail,
  Chrome,
  Navigation,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { usePublicGame } from '@/domains/games/hooks/usePublicGame';
import { supabase } from '@/core/database/supabase';
import { SupabaseService } from '@/core/database/supabaseService';
import { GameCapacityLine } from '@/shared/components/ui/GameCapacity';
import { env } from '@/core/config/envUtils';
import { brandColors } from '@/shared/config/theme';
import { SimpleCalendarButton } from '@/shared/components/common/SimpleCalendarButton';
import { formatCalendarInfo, formatTimeString, formatCost } from '@/shared/utils/dateUtils';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';

export default function PublicGamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { data: game, isLoading: gameLoading } = usePublicGame(gameId || '');
  const loading = gameLoading;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [joiningError, setJoiningError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<any | null>(null);

  // Check authentication status (but don't auto-redirect - let user choose to join)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, [gameId, navigate]);

  // Check if user has already joined
  useEffect(() => {
    const checkJoined = async () => {
      if (!isAuthenticated || !gameId) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('game_participants')
          .select('*')
          .eq('game_id', gameId)
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setHasJoined(true);
        }
      } catch (err) {
        // User not joined yet
      }
    };

    if (isAuthenticated) {
      checkJoined();
    }
  }, [isAuthenticated, gameId]);

  // Initial stats load
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
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  const handleJoinGame = async () => {
    if (!gameId) return;

    // If user is authenticated, redirect them to the full app page to join
    if (isAuthenticated) {
      console.log('Authenticated user joining - redirecting to app page');
      localStorage.setItem('autoJoinGame', gameId);
      navigate(`/app/game/${gameId}`);
      return;
    }

    // Unauthenticated users should not reach this point, but handle gracefully
    toast.info('Please sign in to join this game');
  };

  const handleSignInWithGoogle = async () => {
    if (!gameId) return;

    try {
      // Store the intended destination for post-auth redirect and auto-join intent
      localStorage.setItem('authRedirect', `/app/game/${gameId}`);
      localStorage.setItem('autoJoinGame', gameId);

      const redirectUrl = `${env.APP_URL}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      // OAuth will redirect automatically
    } catch (error: any) {
      console.error('OAuth error:', error);
      localStorage.removeItem('authRedirect');
      localStorage.removeItem('autoJoinGame');
      toast.error('Failed to initiate sign in. Please try again.');
    }
  };

  const handleSignInWithEmail = () => {
    if (!gameId) return;
    // Store the intended destination and auto-join intent
    localStorage.setItem('authRedirect', `/app/game/${gameId}`);
    localStorage.setItem('autoJoinGame', gameId);
    // Add method=email to auto-show email form on auth page
    navigate('/auth?redirect=' + encodeURIComponent(`/app/game/${gameId}`) + '&method=email');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${game?.title}`,
          text: `${game?.sport} game at ${game?.location}`,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Game link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleJoinApp = () => {
    navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
  };

  const handleAddToCalendar = () => {
    if (!game) return;
    
    // Create event details
    const gameDateTime = new Date(`${game.date}T${game.time}`);
    const endDateTime = new Date(gameDateTime);
    endDateTime.setHours(endDateTime.getHours() + 2); // Default 2 hours
    
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
        
        // Fallback after a delay if native app doesn't open
        setTimeout(() => {
          window.open(mapsUrl, '_blank');
        }, 500);
      } else {
        // Desktop - open in new tab
        window.open(mapsUrl, '_blank');
      }
    } catch (error) {
      // Final fallback
      window.open(mapsUrl, '_blank');
    }
  };

  // Capacity data - prioritize game data from games_with_counts view
  // This ensures we use the correct total_players from the view
  const capacityData = useMemo(() => {
    // Primary: Use game data from games_with_counts view (most accurate)
    if (game?.totalPlayers !== undefined && game?.totalPlayers !== null) {
      return {
        totalPlayers: game.totalPlayers,
        maxPlayers: game.maxPlayers ?? 0,
        availableSpots: game.availableSpots ?? Math.max(0, (game.maxPlayers ?? 0) - (game.totalPlayers ?? 0))
      };
    }
    // Fallback: Use capacity stats if game data not available
    if (capacity) {
      return {
        totalPlayers: capacity.total_rsvps ?? 0,
        maxPlayers: capacity.capacity ?? game?.maxPlayers ?? 0,
        availableSpots: capacity.capacity_remaining ?? 0
      };
    }
    // Final fallback
    return {
      totalPlayers: 0,
      maxPlayers: game?.maxPlayers ?? 0,
      availableSpots: game?.maxPlayers ?? 0
    };
  }, [game?.totalPlayers, game?.maxPlayers, game?.availableSpots, capacity]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Game Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This game may have been cancelled or the link is invalid.
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Other Games
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">T</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">TribeUp</h1>
                <p className="text-sm text-muted-foreground">Social Sports</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleJoinApp}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Join App
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Game Details */}
        <Card className="mb-8">
          {game.imageUrl && (
            <div className="aspect-video overflow-hidden">
              <ImageWithFallback
                src={game.imageUrl}
                alt={game.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!game.imageUrl && (
            <div className="p-4 border-b flex items-center gap-2 flex-wrap">
              <Badge className={`${(game as any).sportColor || 'bg-primary'} text-white border-none`}>
                {game.sport}
              </Badge>
              {(game as any).skillLevel && (
                <Badge variant="outline" className="capitalize">
                  {(game as any).skillLevel}
                </Badge>
              )}
            </div>
          )}
          
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{game.title}</CardTitle>
                {game.imageUrl && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${(game as any).sportColor || 'bg-primary'} text-white border-none`}>
                      {game.sport}
                    </Badge>
                    {(game as any).skillLevel && (
                      <Badge variant="outline" className="capitalize">
                        {(game as any).skillLevel}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Game Info Grid - even grid layout */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Players */}
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium mb-1">
                    {capacityData ? (
                      <>
                        {capacityData.totalPlayers}/{capacityData.maxPlayers} players
                      </>
                    ) : (
                      <>
                        {game?.totalPlayers ?? 0}/{game?.maxPlayers ?? 0} players
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
                  <div className="font-medium mb-1 group-hover:text-primary">{formatCalendarInfo(game.date, game.time)?.date || game.date}</div>
                  <div className="text-sm text-muted-foreground">{formatTimeString(game.time)}</div>
                </div>
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={handleDirections}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
              <SimpleCalendarButton 
                game={game} 
                variant="outline" 
                size="sm"
                className="flex-1"
              />
            </div>
            
            {game.description && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-medium mb-2">About this activity</h3>
                  <p className="text-muted-foreground">{game.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Join Section */}
        {hasJoined ? (
          <Alert className="mb-8">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>You're all set!</strong> You've successfully joined this activity. 
              You'll receive updates about this game.
              {capacityData && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {capacityData.totalPlayers}/{capacityData.maxPlayers} players, {capacityData.availableSpots} spots available
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Card 
            className="mb-8 border"
            style={{
              background: `linear-gradient(to bottom, rgba(232, 90, 43, 0.03), rgba(232, 90, 43, 0.01))`,
              borderColor: `${brandColors.primary}30`
            }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5" style={{ color: brandColors.primary }} />
                Join this Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {capacityData && (
                <div className="mb-4">
                  <GameCapacityLine
                    totalPlayers={capacityData.totalPlayers}
                    maxPlayers={capacityData.maxPlayers}
                    availableSpots={capacityData.availableSpots}
                  />
                </div>
              )}
              
              {isAuthenticated ? (
                <div className="space-y-4">
                  <Button 
                    onClick={handleJoinGame}
                    disabled={isJoining}
                    className="w-full"
                    style={{
                      backgroundColor: brandColors.primary || '#FA4616',
                      borderColor: brandColors.primary || '#FA4616'
                    }}>
                    {isJoining ? 'Joining...' : 'Join Activity'}
                  </Button>
                  
                  <SimpleCalendarButton 
                    game={game} 
                    variant="outline" 
                    size="default"
                    className="w-full"
                  />
                  
                  {joiningError && (
                    <Alert variant="destructive">
                      <AlertDescription>{joiningError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to join this activity and connect with other players.
                  </p>
                  
                  <Button
                    onClick={handleSignInWithGoogle}
                    variant="outline"
                    className="w-full"
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Continue with Google
                  </Button>
                  
                  <Button
                    onClick={handleSignInWithEmail}
                    variant="outline"
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Continue with Email
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    By joining, you'll receive updates about this activity.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
