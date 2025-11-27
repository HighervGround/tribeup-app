import React, { useState, useEffect, useMemo } from 'react';
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
  Clock,
  Share2,
  ExternalLink,
  CheckCircle,
  LogIn,
  Mail,
  Chrome
} from 'lucide-react';
import { toast } from 'sonner';
import { usePublicGame } from '@/domains/games/hooks/usePublicGame';
import { supabase } from '@/core/database/supabase';
import { SupabaseService } from '@/core/database/supabaseService';
import { GameCapacityLine } from '@/shared/components/ui/GameCapacity';
import { env } from '@/core/config/envUtils';
import { brandColors } from '@/shared/config/theme';

export default function PublicGamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { data: game, isLoading: gameLoading, error: gameError } = usePublicGame(gameId || '');
  const loading = gameLoading;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [joiningError, setJoiningError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<any | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      // If user just authenticated and we have a pending join, auto-join
      if (session && gameId) {
        const pendingJoin = localStorage.getItem('pendingGameJoin');
        if (pendingJoin === gameId) {
          handleJoinGame();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [gameId]);

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

    try {
      setIsJoining(true);
      setJoiningError(null);

      // Store game ID for post-auth join if needed
      localStorage.setItem('pendingGameJoin', gameId);

      // Join the game using authenticated RPC
      await SupabaseService.joinGame(gameId);
      
      setHasJoined(true);
      localStorage.removeItem('pendingGameJoin');
      toast.success('Successfully joined the activity!');
      
      // Refresh capacity
      const { data } = await supabase
        .from('game_rsvp_stats')
        .select('*')
        .eq('game_id', gameId)
        .single();
      if (data) setCapacity(data);
    } catch (error: any) {
      console.error('Join game error:', error);
      setJoiningError(error.message || 'Failed to join activity');
      toast.error('Failed to join activity. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    if (!gameId) return;

    try {
      // Store game ID for post-auth join
      localStorage.setItem('pendingGameJoin', gameId);

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
      localStorage.removeItem('pendingGameJoin');
      toast.error('Failed to initiate sign in. Please try again.');
    }
  };

  const handleSignInWithEmail = () => {
    if (!gameId) return;
    // Store game ID for post-auth join
    localStorage.setItem('pendingGameJoin', gameId);
    navigate('/auth?redirect=' + encodeURIComponent(`/public/game/${gameId}`));
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

  // Capacity data
  const capacityData = useMemo(() => {
    if (!capacity) return null;
    return {
      totalPlayers: capacity.total_rsvps ?? 0,
      maxPlayers: capacity.capacity ?? game?.maxPlayers ?? 0,
      availableSpots: capacity.capacity_remaining ?? 0
    };
  }, [capacity, game?.maxPlayers]);

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
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{game.title}</CardTitle>
                <Badge className="mb-4">{game.sport}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{game.location}</p>
                  <p className="text-sm text-muted-foreground">Location</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{game.date}</p>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{game.time}</p>
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {capacity ? (
                      <>
                        {capacity.total_rsvps ?? 0}/{capacity.capacity || Number((game as any).max_players ?? game.maxPlayers ?? 0)} players
                      </>
                    ) : (
                      <>
                        {game.totalPlayers ?? 0}/{game.maxPlayers ?? 0} players
                      </>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                </div>
              </div>
            </div>
            
            {game.description && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">About this activity</h3>
                  <p className="text-muted-foreground">{game.description}</p>
                </div>
              </>
            )}
            
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm">
                <strong>Cost:</strong> {game.cost || 'Free'}
              </p>
            </div>
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
              borderColor: `${brandColors.primaryMuted || brandColors.primary}30`
            }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5" style={{ color: brandColors.primaryMuted || brandColors.primary }} />
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
