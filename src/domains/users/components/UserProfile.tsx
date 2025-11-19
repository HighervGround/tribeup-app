import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Settings, Trophy, Calendar, MapPin, Users, UserPlus, Users2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useUserStats, useUserRecentGames, useUserAchievements } from '@/domains/users/hooks/useUserProfile';
import { useUserFriends, useFriendSuggestions, useFollowUser } from '@/domains/users/hooks/useFriends';
import { useUserTribes } from '@/domains/tribes/hooks/useTribes';
import { AchievementGrid } from './AchievementBadge';
import { StatGroup } from '@/shared/components/ui';
import { formatTimeString } from '@/shared/utils/dateUtils';

function UserProfile() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  
  // Support deep linking to specific tab via URL hash
  const urlHash = window.location.hash.replace('#', '');
  const initialTab = ['overview', 'following', 'achievements'].includes(urlHash) ? urlHash : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Fetch users you're following
  const { data: userFriends = [], isLoading: friendsLoading } = useUserFriends(user?.id);
  const { data: friendSuggestions = [], isLoading: suggestionsLoading } = useFriendSuggestions(10);
  const friendMutation = useFollowUser();
  
  // Use React Query hooks for data fetching
  const { data: stats, isLoading: statsLoading } = useUserStats(user?.id || '');
  const { data: recentGamesData = [], isLoading: recentGamesLoading } = useUserRecentGames(user?.id || '', 5);
  const { data: achievements = [], isLoading: achievementsLoading } = useUserAchievements(user?.id || '');
  const { data: userTribes = [], isLoading: tribesLoading } = useUserTribes(user?.id);
  
  const loading = statsLoading || recentGamesLoading || achievementsLoading;
  
  // Transform stats data for display
  const userStats = useMemo(() => [
    { label: 'Activities Joined', value: stats?.totalGamesPlayed?.toString() || '0', icon: Calendar },
    { label: 'Activities Hosted', value: stats?.totalGamesHosted?.toString() || '0', icon: MapPin },
    { label: 'Following', value: userFriends.length.toString(), icon: Users },
    { label: 'Achievements', value: achievements.length.toString(), icon: Trophy },
  ], [stats, achievements, userFriends.length]);
  
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
  const displayBio = user?.bio || 'Sports enthusiast • Always up for an activity!';
  const displayAvatar = user?.avatar || '';
  const displaySports = (user?.preferred_sports && Array.isArray(user.preferred_sports) && user.preferred_sports.length > 0) 
    ? user.preferred_sports 
    : [];

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
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <StatGroup
              stats={userStats.map((stat) => ({
                label: stat.label,
                value: stat.value,
                icon: <stat.icon className="w-5 h-5" />,
              }))}
              columns={2}
            />
          </CardContent>
        </Card>

        {/* Sports Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Sports I Play</CardTitle>
          </CardHeader>
          <CardContent>
            {displaySports.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {displaySports.map((sport) => (
                  <Badge key={sport} variant="secondary">
                    {sport}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No sports selected yet</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => navigate('/profile/edit')}
                  className="mt-2"
                >
                  Add your sports
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Tribes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="w-5 h-5" />
              My Tribes ({userTribes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tribesLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading tribes...</p>
              </div>
            ) : userTribes.length > 0 ? (
              <div className="space-y-2">
                {userTribes.map((tribe: any) => (
                  <div
                    key={tribe.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/tribe/${tribe.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {tribe.avatar_url ? (
                          <img src={tribe.avatar_url} alt={tribe.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-primary font-semibold">
                            {tribe.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{tribe.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{tribe.member_count} members</span>
                          <span>•</span>
                          <span>{tribe.activity}</span>
                        </div>
                      </div>
                    </div>
                    {!tribe.is_public && (
                      <Badge variant="secondary" className="ml-2">Private</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Users2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">You haven't joined any tribes yet</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => navigate('/app/tribes')}
                  className="mt-2"
                >
                  Discover Tribes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
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
                    recentGames.map((game: any, index: number) => (
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
                    achievements={achievements.map((ua: any) => ({
                      ...ua.achievements,
                      earned_at: ua.earned_at
                    }))} 
                    maxDisplay={12}
                    size="md"
                    layout="card"
                    showScore={true}
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

          <TabsContent value="following" className="space-y-6">
            {/* People You Follow */}
            {userFriends.length > 0 ? (
              <Card key="following-card">
                <CardHeader>
                  <CardTitle>Following ({userFriends.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userFriends.map((friend) => (
                      <div 
                        key={friend.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/user/${friend.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={friend.avatar_url || undefined} />
                            <AvatarFallback>
                              {(friend.display_name || friend.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friend.display_name || friend.username || 'User'}</p>
                            {friend.bio && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">{friend.bio}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Following</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card key="no-following-card">
                <CardContent className="py-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium mb-2">Not Following Anyone Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Follow players to see them here
                  </p>
                </CardContent>
              </Card>
            )}

            {/* People to Follow */}
            {friendSuggestions.length > 0 && (
              <Card key="suggestions-card">
                <CardHeader>
                  <CardTitle>People to Follow</CardTitle>
                  <p className="text-sm text-muted-foreground">Based on activities you've joined together</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {friendSuggestions.slice(0, 10).map((suggestion) => (
                      <div 
                        key={suggestion.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => navigate(`/user/${suggestion.id}`)}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={suggestion.avatar_url || undefined} />
                            <AvatarFallback>
                              {(suggestion.display_name || suggestion.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{suggestion.display_name || suggestion.username || 'User'}</p>
                              {suggestion.common_games_count > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {suggestion.common_games_count} {suggestion.common_games_count !== 1 ? 'activities' : 'activity'} together
                                </Badge>
                              )}
                            </div>
                            {suggestion.bio && (
                              <p className="text-sm text-muted-foreground truncate">{suggestion.bio}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={suggestion.is_following ? "outline" : "default"}
                          onClick={(e) => {
                            e.stopPropagation();
                            friendMutation.mutate(suggestion.id);
                          }}
                          disabled={friendMutation.isPending}
                          className="ml-2"
                        >
                          {suggestion.is_following ? (
                            <>Following</>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

export default UserProfile;