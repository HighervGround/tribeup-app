import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Plus, 
  Search,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
  Clock,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/core/database/supabase';

interface Game {
  id: string;
  title: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  currentPlayers: number;
  maxPlayers: number;
}

interface FirstGameGuideProps {
  selectedSports: string[];
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
  onSkip: () => void;
}

/**
 * First Game Guide - helps new users create or join their first game
 * Shown as final step in onboarding to ensure successful first experience
 */
export function FirstGameGuide({ 
  selectedSports, 
  onCreateGame, 
  onJoinGame,
  onSkip
}: FirstGameGuideProps) {
  const [nearbyGames, setNearbyGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNearbyGames = async () => {
      try {
        setLoading(true);
        
        // Get upcoming games, filtered by selected sports if any
        let query = supabase
          .from('games_with_counts')
          .select('id, title, sport, date, time, location, current_players, max_players')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(3);
        
        // Filter by selected sports if user has preferences
        if (selectedSports.length > 0) {
          query = query.in('sport', selectedSports.map(s => s.toLowerCase()));
        }
        
        const { data, error } = await query;
        
        if (!error && data) {
          setNearbyGames(data.map(game => ({
            id: game.id,
            title: game.title,
            sport: game.sport,
            date: game.date,
            time: game.time,
            location: game.location,
            currentPlayers: game.current_players || 0,
            maxPlayers: game.max_players || 10
          })));
        }
      } catch (error) {
        console.error('Error fetching nearby games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyGames();
  }, [selectedSports]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get sport emoji
  const getSportEmoji = (sport: string) => {
    const emojis: Record<string, string> = {
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
      'rock climbing': '🧗',
      hiking: '🥾',
    };
    return emojis[sport.toLowerCase()] || '🎯';
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-16 h-16 bg-gradient-to-br from-success to-primary rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold">Ready to Play?</h2>
        <p className="text-muted-foreground max-w-sm">
          Jump right in! Create your own game or join one happening near you.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="w-full max-w-sm space-y-3">
        {/* Create Game Option */}
        <button
          onClick={onCreateGame}
          className="w-full p-4 rounded-xl border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-semibold">Create a Game</h3>
            <p className="text-sm text-muted-foreground">Organize your own pickup game</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">or join a game</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Nearby Games */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="w-full p-4 rounded-xl border bg-muted/30 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : nearbyGames.length > 0 ? (
          <div className="space-y-3">
            {nearbyGames.map((game) => (
              <button
                key={game.id}
                onClick={() => onJoinGame(game.id)}
                className="w-full p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0 text-2xl">
                  {getSportEmoji(game.sport)}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{game.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(game.date)}</span>
                    <Clock className="w-3 h-3 ml-1" />
                    <span>{formatTime(game.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{game.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {game.currentPlayers}/{game.maxPlayers}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-6">
              <div className="text-center space-y-2">
                <Search className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No upcoming games found for your sports preferences.
                </p>
                <p className="text-sm font-medium text-primary">
                  Be the first to create one!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Skip Option */}
      <Button 
        variant="ghost" 
        onClick={onSkip}
        className="text-muted-foreground"
      >
        I'll explore on my own
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

export default FirstGameGuide;
