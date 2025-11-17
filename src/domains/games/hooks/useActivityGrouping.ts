import { useMemo } from 'react';
import { GameWithCreator } from './useGamesWithCreators';

interface GameWithGrouping extends GameWithCreator {
  category: 'today' | 'tomorrow' | 'thisWeek' | 'upcoming';
  sortOrder: number;
  gameDate: Date;
  followerCount: number;
  isHot: boolean;
  isAlmostFull: boolean;
  isFull: boolean;
  isHappeningSoon: boolean;
}

interface GamesBySection {
  today: GameWithGrouping[];
  tomorrow: GameWithGrouping[];
  thisWeek: GameWithGrouping[];
  upcoming: GameWithGrouping[];
}

interface UseActivityGroupingProps {
  games: GameWithCreator[];
  gamesFriendCounts?: Record<string, number>;
}

export function useActivityGrouping({
  games,
  gamesFriendCounts,
}: UseActivityGroupingProps) {
  // Sort games chronologically with smart grouping and add social signals
  const sortedGames = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return games
      .map(game => {
        // Parse game date properly - game.date is like "2025-10-15"
        const [year, month, day] = game.date.split('-').map(Number);
        const gameDate = new Date(year, month - 1, day); // month is 0-indexed

        // Determine game category for sorting and display
        let category: 'today' | 'tomorrow' | 'thisWeek' | 'upcoming' = 'upcoming';
        let sortOrder = gameDate.getTime();

        if (gameDate.getTime() === today.getTime()) {
          category = 'today';
          sortOrder = 0;
        } else if (gameDate.getTime() === tomorrow.getTime()) {
          category = 'tomorrow';
          sortOrder = 1;
        } else if (gameDate.getTime() < nextWeek.getTime()) {
          category = 'thisWeek';
          sortOrder = 2;
        }

        // Calculate social signals
        const followerCount = gamesFriendCounts?.[game.id] || 0;
        const capacityRatio = game.totalPlayers / game.maxPlayers;
        const spotsLeft = game.availableSpots;

        // Determine badges
        const isHot = capacityRatio >= 0.7 && spotsLeft > 0;
        const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
        const isFull = spotsLeft === 0;

        // Check if game is happening soon (within 2 hours)
        const gameDateTime = new Date(`${game.date}T${game.time}`);
        const hoursUntilGame = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isHappeningSoon = hoursUntilGame > 0 && hoursUntilGame <= 2;

        return {
          ...game,
          category,
          sortOrder,
          gameDate,
          // Social signals
          followerCount,
          isHot,
          isAlmostFull,
          isFull,
          isHappeningSoon,
        } as GameWithGrouping;
      })
      .sort((a, b) => {
        // First sort by sortOrder (today = 0, tomorrow = 1, thisWeek = 2, upcoming = timestamp)
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        // Then sort by time chronologically
        return a.gameDate.getTime() - b.gameDate.getTime();
      });
  }, [games, gamesFriendCounts]);

  // Group games by section
  const gamesBySection = useMemo<GamesBySection>(() => {
    const sections: GamesBySection = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      upcoming: [],
    };

    sortedGames.forEach(game => {
      sections[game.category].push(game);
    });

    return sections;
  }, [sortedGames]);

  return {
    sortedGames,
    gamesBySection,
  };
}

