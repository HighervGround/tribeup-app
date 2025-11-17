import { useTribeGames } from '../hooks/useTribeGames';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { formatEventHeader } from '@/shared/utils/dateUtils';

interface TribeGamesProps {
  tribeId: string;
}

export function TribeGames({ tribeId }: TribeGamesProps) {
  const navigate = useNavigate();
  const { data: games, isLoading } = useTribeGames(tribeId);

  const handleCreateGame = () => {
    // Navigate to create game with tribeId in state
    navigate('/create-game', { state: { tribeId } });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No games organized by this tribe yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreateGame} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Game for Tribe
        </Button>
      </div>

      {games.map((game: any) => (
        <Card
          key={game.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/game/${game.id}`)}
        >
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{game.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatEventHeader(game.date, game.time).label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{game.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {game.current_players || 0}/{game.max_players}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default TribeGames;

