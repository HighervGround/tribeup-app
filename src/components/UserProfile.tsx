import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Settings, Trophy, Calendar, MapPin, Star } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { SupabaseService } from '../lib/supabaseService';
import { formatTimeString } from '../lib/dateUtils';

export function UserProfile() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [userStats, setUserStats] = useState([
    { label: 'Games Played', value: '0', icon: Calendar },
    { label: 'Games Hosted', value: '0', icon: MapPin },
    { label: 'Achievements', value: '0', icon: Trophy },
  ]);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user stats and recent games
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Load real user stats (with fallback if tables don't exist yet)
        const [stats, recentGamesData, achievements] = await Promise.all([
          SupabaseService.getUserStats(user.id).catch(() => ({
            user_id: user.id,
            games_played: 0,
            games_hosted: 0,
            total_play_time_minutes: 0,
            favorite_sport: null,
            last_activity: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })),
          SupabaseService.getUserRecentGames(user.id, 5).catch(() => []),
          SupabaseService.getUserAchievements(user.id).catch(() => [])
        ]);

        // Update stats with real data
        setUserStats([
          { label: 'Games Played', value: stats.games_played.toString(), icon: Calendar },
          { label: 'Games Hosted', value: stats.games_hosted.toString(), icon: MapPin },
          { label: 'Achievements', value: achievements.length.toString(), icon: Trophy },
        ]);

        // Transform recent games data
        const transformedRecentGames = recentGamesData.map((participation: any) => ({
          id: participation.games.id,
          title: participation.games.title,
          sport: participation.games.sport,
          date: participation.games.date,
          time: participation.games.time,
          location: participation.games.location,
          isHost: participation.games.created_by === user.id
        }));

        setRecentGames(transformedRecentGames);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to placeholder data on error
        setUserStats([
          { label: 'Games Played', value: '0', icon: Calendar },
          { label: 'Games Hosted', value: '0', icon: MapPin },
          { label: 'Achievements', value: '0', icon: Trophy },
        ]);
        setRecentGames([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user?.id]);

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
      </div>
    </div>
  );
}

export default UserProfile;