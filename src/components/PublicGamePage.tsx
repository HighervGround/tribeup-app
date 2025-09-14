import React, { useState, useEffect } from 'react';
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
import { SupabaseService } from '../lib/supabaseService';
import { usePublicGame, usePublicRSVPs, useCreatePublicRSVP, useQuickRSVP } from '../hooks/usePublicGame';

export default function PublicGamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  // Use React Query hooks for data fetching
  const { data: game, isLoading: gameLoading, error: gameError } = usePublicGame(gameId || '');
  const { data: publicRsvps = [], isLoading: rsvpsLoading } = usePublicRSVPs(gameId || '');
  const createRsvpMutation = useCreatePublicRSVP();
  const quickRsvpMutation = useQuickRSVP();
  
  const loading = gameLoading || rsvpsLoading;
  const submitting = createRsvpMutation.isPending || quickRsvpMutation.isPending;
  
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
    
    createRsvpMutation.mutate({ gameId, rsvpData: rsvpForm }, {
      onSuccess: () => {
        setRsvpSuccess(true);
        // Reset form
        setRsvpForm({ 
          name: '', 
          email: '', 
          phone: '',
          message: '',
          attending: true
        });
      }
    });
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rsvpForm.name.trim() || !rsvpForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setSubmitting(true);
      
      await SupabaseService.createPublicRSVP(gameId!, {
        name: rsvpForm.name.trim(),
        email: rsvpForm.email.trim(),
        phone: rsvpForm.phone.trim() || undefined
      });
      
      setHasRsvped(true);
      setRsvpForm({ name: '', email: '', phone: '' });
      toast.success('RSVP confirmed! You\'ll receive updates via email.');
      
      // Reload RSVPs
      if (gameId) {
        const updatedRsvps = await SupabaseService.getPublicRSVPs(gameId);
        setPublicRsvps(updatedRsvps);
      }
      
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      toast.error('Failed to submit RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
                    {publicRsvps.length + (game.currentPlayers || 0)}/{game.maxPlayers} players
                  </p>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                </div>
              </div>
            </div>
            
            {game.description && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">About this game</h3>
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
                RSVP for this Game
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        {rsvp.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{rsvp.name}</p>
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
