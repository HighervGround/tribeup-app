import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Settings, Trophy, Calendar, MapPin, Star, Target } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { SupabaseService } from '../lib/supabaseService';
import { useUserStats, useUserRecentGames, useUserAchievements } from '../hooks/useUserProfile';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementGrid } from './AchievementBadge';
import { AchievementProgressIndicator, GameProgressWidget } from './AchievementProgressIndicator';
import { formatTimeString } from '../lib/dateUtils';

function UserProfile() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use React Query hooks for data fetching
  const { data: stats, isLoading: statsLoading } = useUserStats(user?.id || '');
  const { data: recentGamesData = [], isLoading: recentGamesLoading } = useUserRecentGames(user?.id || '', 5);
  const { data: achievements = [], isLoading: achievementsLoading } = useUserAchievements(user?.id || '');
  
  // Use achievements hook for progress tracking
  const { userStats: achievementStats, getNextAchievements } = useAchievements();
  const [nextAchievements, setNextAchievements] = useState<any[]>([]);
  
  const loading = statsLoading || recentGamesLoading || achievementsLoading;

  // Load next achievements
  useEffect(() => {
    const loadNextAchievements = async () => {
      if (stats) {
        const next = await getNextAchievements();
        setNextAchievements(next);
      }
    };
    loadNextAchievements();
  }, [stats, getNextAchievements]);
  
  // Transform stats data for display
  const userStats = useMemo(() => [
    { label: 'Games Played', value: stats?.totalGamesPlayed?.toString() || '0', icon: Calendar },
    { label: 'Games Hosted', value: stats?.totalGamesHosted?.toString() || '0', icon: MapPin },
    { label: 'Achievements', value: achievements.length.toString(), icon: Trophy },
  ], [stats, achievements]);
  
  // Transform recent games data
  const recentGames = useMemo(() => {
    return recentGamesData.map((participation: any) => ({
      id: participation.games?.id || participation.id,
      title: participation.games?.title || participation.title,
      sport: participation.games?.sport || participation.sport,
      date: participation.games?.date || participation.date,
      time: participation.games?.time || participation.time,
      location: participation.games?.location || participation.location,
      isHost: (participation.games?.creator_id || participation.creator_id) === user?.id
    }));
  }, [recentGamesData, user?.id]);

  // React Query handles all data loading automatically

  // Get user data with fallbacks
  const displayName = user?.name || 'User Profile';
  const displayUsername = user?.username ? `@${user.username}` : '@user';
  const displayBio = user?.bio || 'Sports enthusiast • Always up for a game!';
  const displayAvatar = user?.avatar || '';
  const displaySports = user?.preferences?.sports || ['Basketball', 'Soccer', 'Tennis', 'Volleyball'];
  const needsCompletion = !(user?.name && user?.email);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-6">
        <h1 className="text-xl font-semibold">Profile</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      <div className="px-4 space-y-6">
        {/* Profile Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback className="text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <p className="text-muted-foreground">{displayUsername}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {displayBio}
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => navigate('/profile/edit')}>
              Edit Profile
            </Button>
            {needsCompletion && (
              <Button variant="outline" className="w-full mt-2" onClick={() => navigate('/onboarding')}>
                Complete Profile
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {userStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sports Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Sports I Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {displaySports.map((sport) => (
                <Badge key={sport} variant="secondary">
                  {sport}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Games */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Games</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading recent games...</p>
                    </div>
                  ) : recentGames.length > 0 ? (
                    recentGames.map((game, index) => (
                      <div key={game.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{game.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(game.date).toLocaleDateString()} at {formatTimeString(game.time)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {game.location}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {game.isHost && (
                            <Badge variant="secondary" className="text-xs">
                              Host
                            </Badge>
                          )}
                          <Badge variant="outline">{game.sport}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent games</p>
                      <p className="text-sm">Join your first game to see it here!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            {/* Achievement Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  My Achievements ({achievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <AchievementGrid 
                    achievements={achievements.map(ua => ({
                      ...ua.achievements,
                      earned_at: ua.earned_at
                    }))} 
                    maxDisplay={12}
                    size="md"
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No achievements yet</p>
                    <p className="text-sm">Play games to unlock your first achievement!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {/* Progress Indicators */}
            {stats && (
              <GameProgressWidget
                gamesPlayed={stats.totalGamesPlayed}
                gamesHosted={stats.totalGamesHosted}
                nextAchievements={nextAchievements}
              />
            )}
            
            {/* Next Achievements */}
            {nextAchievements.length > 0 && (
              <AchievementProgressIndicator
                achievements={nextAchievements}
                title="Next Achievements"
                showAll={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default UserProfile;