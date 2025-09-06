import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
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
  Keyboard
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useGames, useAppLoading, useAppStore } from '../store/appStore';
import { useGameActions } from '../hooks/useGameActions';
import { useDeepLinks } from '../hooks/useDeepLinks';
import { useCustomShortcuts } from '../hooks/useKeyboardShortcuts';
import { QuickJoinModal } from './QuickJoinModal';
import { InviteModal } from './InviteModal';
import { toast } from 'sonner';
import { SupabaseService } from '../lib/supabaseService';
import { formatEventHeader, formatCalendarInfo } from '../lib/dateUtils';



export function GameDetails() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const games = useGames();
  const isLoading = useAppLoading();
  const { user } = useAppStore();
  const { toggleGameParticipation } = useGameActions();
  const { shareGame, navigateToChat, navigateToUser } = useDeepLinks();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [players, setPlayers] = useState([] as any[]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  
  // Find the game by ID
  const game = games.find(g => g.id === gameId);

  // Load players for this game
  useEffect(() => {
    if (gameId) {
      const loadPlayers = async () => {
        setLoadingPlayers(true);
        try {
          const gamePlayers = await SupabaseService.getGameParticipants(gameId);
          setPlayers(gamePlayers);
        } catch (error) {
          console.error('Error loading players:', error);
          setPlayers([]);
        } finally {
          setLoadingPlayers(false);
        }
      };
      
      loadPlayers();
    }
  }, [gameId]);
  
  // Set up custom keyboard shortcuts for this component
  useCustomShortcuts([
    {
      key: 'j',
      description: 'Join/Leave game',
      action: () => {
        if (game && !isLoading) {
          handleJoinLeave();
        }
      },
      disabled: !game || isLoading
    },
    {
      key: 'm',
      description: 'Open group chat',
      action: () => {
        if (game) {
          handleChat();
        }
      },
      disabled: !game
    },
    {
      key: 'u',
      description: 'Share game',
      action: () => {
        if (game) {
          handleShare();
        }
      },
      disabled: !game
    },
    {
      key: 'l',
      description: 'Get directions',
      action: () => {
        if (game) {
          handleDirections();
        }
      },
      disabled: !game
    }
  ]);
  
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
    // If user is not authenticated, show quick join modal
    if (!user) {
      setShowQuickJoin(true);
      return;
    }
    
    await toggleGameParticipation(game.id);
  };

  const handleQuickJoinSuccess = async () => {
    setShowQuickJoin(false);
    // After successful signup, join the game
    if (gameId) {
      await toggleGameParticipation(gameId);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleChat = () => {
    navigateToChat('game', gameId!);
  };

  const handleDirectMessage = (playerId: string, playerName: string) => {
    navigateToChat('direct', playerId);
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
            <Button 
              variant="ghost" 
              size="icon"
              aria-label="Report game"
            >
              <Flag className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Keyboard shortcuts hint for desktop */}
        <div className="hidden lg:block px-4 pb-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3 h-3" />
              Shortcuts:
            </span>
            <span>J = Join/Leave</span>
            <span>M = Chat</span>
            <span>U = Share</span>
            <span>L = Directions</span>
            <span>? = All shortcuts</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6" id="main-content">
        {/* Hero Image & Basic Info */}
        <Card>
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
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div>{game.currentPlayers}/{game.maxPlayers}</div>
                  <div className="text-sm text-muted-foreground">Players</div>
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
              disabled={(!game.isJoined && isFull) || isLoading}
              className="w-full h-12"
              variant={game.isJoined ? 'outline' : 'default'}
              data-action="join-game"
              title={`${game.isJoined ? 'Leave' : 'Join'} game (J)`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {game.isJoined ? 'Leaving...' : 'Joining...'}
                </>
              ) : isFull && !game.isJoined ? (
                'Game is Full'
              ) : game.isJoined ? (
                'Leave Game'
              ) : !user ? (
                'Join Game - Sign Up'
              ) : (
                'Join Game'
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
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1694928850410-b209896782a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwbWFwfGVufDF8fHx8MTc1NjIyMjUxOXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Location map"
                  className="w-full h-full object-cover rounded-lg"
                />
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
                <button 
                  onClick={() => navigateToUser('host1')}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  data-action="view-profile"
                >
                  <Avatar>
                    <AvatarFallback>{game.createdBy?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{game.createdBy || 'Unknown'}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-3 h-3 fill-current text-warning" />
                      No rating yet
                    </div>
                  </div>
                </button>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDirectMessage('host1', game.createdBy || 'Host')}
              >
                Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                              <CardTitle>Players ({players.length}/{game.maxPlayers})</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleChat}
                data-action="group-chat"
                title="Open group chat (M)"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Group Chat
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                              {players.map((player, index) => (
                <div key={player.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{player.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => navigateToUser(player.id)}
                            className="hover:text-primary transition-colors cursor-pointer"
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
                    {!player.isHost && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDirectMessage(player.id, player.name)}
                      >
                        Message
                      </Button>
                    )}
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
              You're joined! Check the group chat for updates and coordinate with other players.
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

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        gameTitle={game.title}
        gameId={game.id}
        gameDate={calendarInfo.date}
        gameTime={calendarInfo.time}
        gameLocation={game.location}
        sport={game.sport}
      />
    </div>
  );
}

export default GameDetails;