import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  MapPin,
  Users,
  Loader2
} from 'lucide-react';
import { supabase } from '@/core/database/supabase';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/core/auth/SimpleAuthProvider';
import { format } from 'date-fns';

interface OnboardingGameBrowseProps {
  selectedSports: string[];
  onGameJoined: () => void;
  onBack: () => void;
}

interface Game {
  id: string;
  title: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  maxPlayers: number;
  currentPlayers: number;
  cost: string;
  description: string;
}

export const OnboardingGameBrowse: React.FC<OnboardingGameBrowseProps> = ({
  selectedSports,
  onGameJoined,
  onBack
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);
  const { user } = useSimpleAuth();

  useEffect(() => {
    fetchGames();
  }, [selectedSports]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('games_with_counts')
        .select(`
          id, title, sport, date, time, location,
          max_players, current_players, cost, description
        `)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(10);

      // Filter by selected sports if any
      if (selectedSports.length > 0) {
        query = query.in('sport', selectedSports.map(s => s.toLowerCase()));
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data
      const transformedGames = (data || []).map((game: any) => ({
        id: game.id,
        title: game.title,
        sport: game.sport,
        date: game.date,
        time: game.time,
        location: game.location,
        maxPlayers: game.max_players,
        currentPlayers: game.current_players || 0,
        cost: game.cost,
        description: game.description
      }));

      setGames(transformedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (!user) {
      toast.error('Please sign in to join games');
      return;
    }

    try {
      setJoiningGameId(gameId);

      // Check if already joined
      const { data: existingParticipant } = await supabase
        .from('game_participants')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .single();

      if (existingParticipant) {
        toast.info('You have already joined this game!');
        onGameJoined();
        return;
      }

      // Join the game
      const { error } = await supabase
        .from('game_participants')
        .insert({
          game_id: gameId,
          user_id: user.id,
          status: 'joined'
        });

      if (error) throw error;

      toast.success('Successfully joined the game!');
      onGameJoined();
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game');
    } finally {
      setJoiningGameId(null);
    }
  };

  const getSportEmoji = (sport: string) => {
    const sportEmojis: Record<string, string> = {
      basketball: '🏀',
      soccer: '⚽',
      tennis: '🎾',
      pickleball: '🥒',
      volleyball: '🏐',
      football: '🏈',
      baseball: '⚾',
      running: '🏃',
      cycling: '🚴',
      swimming: '🏊',
      hiking: '🥾',
      'rock climbing': '🧗'
    };
    return sportEmojis[sport.toLowerCase()] || '🏃';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      // Parse time string (HH:mm format)
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return format(date, 'h:mm a'); // 12-hour format with AM/PM
    } catch {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              No games found for your selected sports. Try creating your own game instead!
            </p>
            <Button onClick={onBack}>
              Back to Options
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {games.map((game) => (
          <Card key={game.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getSportEmoji(game.sport)}</span>
                    <div>
                      <h3 className="font-semibold">{game.title}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{game.sport}</p>
                    </div>
                  </div>
                  <Badge variant={game.cost === 'FREE' ? 'secondary' : 'default'}>
                    {game.cost}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(game.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(game.time)}
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{game.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>
                      {game.currentPlayers}/{game.maxPlayers} players
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoinGame(game.id)}
                    disabled={joiningGameId === game.id || game.currentPlayers >= game.maxPlayers}
                  >
                    {joiningGameId === game.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Joining...
                      </>
                    ) : game.currentPlayers >= game.maxPlayers ? (
                      'Full'
                    ) : (
                      'Join Game'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
