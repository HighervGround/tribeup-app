import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  DollarSign,
  Share2,
  Copy,
  Mail,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { usePublicGame, usePublicRSVPs, publicGameKeys } from '../hooks/usePublicGame';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { GameCapacityLine } from './ui/GameCapacity';

export default function PublicGamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Use React Query hooks for data fetching
  const { data: game, isLoading: gameLoading, error: gameError } = usePublicGame(gameId || '');
  const { data: publicRsvps = [], isLoading: rsvpsLoading } = usePublicRSVPs(gameId || '');
  const loading = gameLoading || rsvpsLoading;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<any | null>(null);
  const [lastResult, setLastResult] = useState<any | null>(null);
  
  const [rsvpForm, setRsvpForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    attending: true
  });
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [showQuickRsvp, setShowQuickRsvp] = useState(false);
  const [hasRsvped, setHasRsvped] = useState(false);
  const [userRsvp, setUserRsvp] = useState<any>(null);

  // React Query handles all data loading automatically

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId) return;

    await handleRSVP(e);
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId) return;
    if (!rsvpForm.name.trim() || !rsvpForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setSubmitError(null);
      setSubmitting(true);

      const { data, error } = await supabase.functions.invoke('rsvp_public', {
        body: {
          game_id: gameId,
          name: rsvpForm.name.trim(),
          email: rsvpForm.email.trim(),
          phone: rsvpForm.phone?.trim() || undefined,
          message: rsvpForm.message || undefined,
        },
      });

      if (error) {
        setSubmitError(error.message || 'Request failed');
        toast.error('Failed to submit RSVP');
        return;
      }

      if (data?.error) {
        setSubmitError(data.message || data.error);
        toast.error(data.message || data.error);
        return;
      }

      if (data?.ok) {
        setLastResult(data);
        if (data.stats) setCapacity(data.stats);

        // Invalidate RSVPs list to refresh
        if (gameId) {
          queryClient.invalidateQueries({ queryKey: publicGameKeys.rsvps(gameId) });
        }

        if (data.duplicate) {
          toast.info("You're already on the list!");
          setHasRsvped(true);
          setUserRsvp({ name: rsvpForm.name.trim(), email: rsvpForm.email.trim() });
        } else {
          setHasRsvped(true);
          setUserRsvp({ name: rsvpForm.name.trim(), email: rsvpForm.email.trim() });
          setRsvpForm({ name: '', email: '', phone: '', message: '', attending: true });
          toast.success('RSVP confirmed!');
        }
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Unexpected error');
      toast.error('Failed to submit RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Use live capacity from game_rsvp_stats view
  const capacityData = useMemo(() => {
    if (!capacity) return null;
    return {
      totalPlayers: capacity.total_rsvps ?? 0,
      maxPlayers: capacity.capacity ?? game?.maxPlayers ?? 0,
      availableSpots: capacity.capacity_remaining ?? 0
    };
  }, [capacity, game?.maxPlayers]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${game.title}`,
          text: `${game.sport} game at ${game.location}`,
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

  // Initial stats load from read-only view
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
                        {(capacity.private_rsvp_count || 0) + (capacity.public_rsvp_count || 0)}/{capacity.capacity || Number((game as any).max_players ?? game.maxPlayers ?? 0)} players
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

        {/* RSVP Section */}
        {!hasRsvped ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                RSVP for this Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {capacityData && (
                <div className="mb-3">
                  <GameCapacityLine
                    totalPlayers={capacityData.totalPlayers}
                    maxPlayers={capacityData.maxPlayers}
                    availableSpots={capacityData.availableSpots}
                  />
                </div>
              )}
              <form onSubmit={handleRSVP} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={rsvpForm.name}
                    onChange={(e) => setRsvpForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={rsvpForm.email}
                    onChange={(e) => setRsvpForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Phone Number (Optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={rsvpForm.phone}
                    onChange={(e) => setRsvpForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Confirming...' : 'Confirm RSVP'}
                </Button>
              </form>
              {submitError && (
                <div className="mt-2 text-sm text-destructive">{submitError}</div>
              )}
              
              <p className="text-xs text-muted-foreground mt-4">
                By RSVPing, you'll receive email updates about this game. 
                Your information is only shared with the game organizer.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Alert className="mb-8">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>You're all set!</strong> Your RSVP has been confirmed. 
              You'll receive email updates about this game.
              {lastResult?.stats && (
                <div className="mt-1 text-sm text-muted-foreground">
                  Updated: {(lastResult.stats.private_rsvp_count || 0) + (lastResult.stats.public_rsvp_count || 0)}/{lastResult.stats.capacity} total, {lastResult.stats.capacity_remaining} available
                </div>
              )}
              {userRsvp && (
                <div className="mt-2 text-sm">
                  Registered as: <strong>{userRsvp.name}</strong> ({userRsvp.email})
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* RSVPs List */}
        {publicRsvps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Who's Coming ({publicRsvps.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {publicRsvps.map((rsvp) => (
                  <div key={rsvp.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {(rsvp.name_initial || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">Guest</p>
                      <p className="text-sm text-muted-foreground">
                        RSVPed {new Date(rsvp.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
