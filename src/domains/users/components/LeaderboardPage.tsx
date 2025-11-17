import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Leaderboard, type LeaderboardPlayer } from '@/shared/components/ui';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

/**
 * Leaderboard Page
 * 
 * Displays rankings of players based on various metrics.
 */
export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [sortKey, setSortKey] = useState<string>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Mock leaderboard data - Replace with actual data fetching
  const mockPlayers: LeaderboardPlayer[] = [
    {
      id: '1',
      name: 'John Doe',
      rank: 1,
      stats: { gamesPlayed: 50, wins: 35, rating: 4.8 },
    },
    {
      id: '2',
      name: 'Jane Smith',
      rank: 2,
      stats: { gamesPlayed: 45, wins: 30, rating: 4.7 },
    },
    {
      id: '3',
      name: 'Mike Johnson',
      rank: 3,
      stats: { gamesPlayed: 40, wins: 28, rating: 4.6 },
    },
    {
      id: '4',
      name: 'Sarah Williams',
      rank: 4,
      stats: { gamesPlayed: 35, wins: 25, rating: 4.5 },
    },
    {
      id: '5',
      name: 'Tom Brown',
      rank: 5,
      stats: { gamesPlayed: 30, wins: 20, rating: 4.4 },
    },
  ];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const handlePlayerClick = (player: LeaderboardPlayer) => {
    if (player.id) {
      navigate(`/user/${player.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="size-6 text-primary" />
            <h1 className="text-xl font-bold">Leaderboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            <Leaderboard
              players={mockPlayers}
              columns={[
                { key: 'name', label: 'Player', sortable: false },
                { key: 'gamesPlayed', label: 'Games', sortable: true },
                { key: 'wins', label: 'Wins', sortable: true },
                { key: 'rating', label: 'Rating', sortable: true },
              ]}
              onSort={handleSort}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onPlayerClick={handlePlayerClick}
              currentUserId={user?.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

