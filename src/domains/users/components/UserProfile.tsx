import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Settings, Trophy, Calendar, MapPin, Users, UserPlus, Users2, BadgeCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/shared/components/ui/dialog';
import { AmbassadorApplication } from '@/domains/users/components/AmbassadorApplication';
import { AmbassadorDashboard } from '@/domains/users/components/AmbassadorDashboard';
import { useAmbassador } from '@/domains/users/hooks/useAmbassador';
import { useAppStore } from '@/store/appStore';
import { useUserStats, useUserRecentGames, useUserAchievements } from '@/domains/users/hooks/useUserProfile';
import { useUserFriends, useUserFollowers, useFriendSuggestions, useFollowUser } from '@/domains/users/hooks/useFriends';
import { useUserTribes } from '@/domains/tribes/hooks/useTribes';
import { AchievementGrid } from './AchievementBadge';
import { StatGroup } from '@/shared/components/ui';
import { formatTimeString } from '@/shared/utils/dateUtils';
import { useDeepLinks } from '@/shared/hooks/useDeepLinks';
import { 
  EmptyState,
  NoSportsSelectedEmptyState,
  NoTribesEmptyState,
  NoRecentGamesEmptyState,
  NoAchievementsEmptyState,
  NoFriendsEmptyState
} from '@/shared/components/common/EmptyState';

function UserProfile() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { navigateToUser } = useDeepLinks();
  
  // Support deep linking to specific tab via URL hash
  const urlHash = window.location.hash.replace('#', '');
  const initialTab = ['overview', 'following', 'achievements'].includes(urlHash) ? urlHash : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAllFollowing, setShowAllFollowing] = useState(false);
  const [showAllFollowers, setShowAllFollowers] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const pendingScrollRef = useRef<string | null>(null);

  // Smooth scroll utility that accounts for fixed headers on mobile
  const smoothScrollTo = (elementId: string) => {
    try {
      const el = document.getElementById(elementId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Compute dynamic offset: sticky tabs height + any top padding
      const tabsEl = document.getElementById('profile-tabs');
      const tabsH = tabsEl ? tabsEl.offsetHeight : 48;
      const offset = Math.max(tabsH + 16, 64);
      const y = window.scrollY + rect.top - offset;
      window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
    } catch {}
  };

  // Perform deferred scroll after tab content renders
  useEffect(() => {
    if (pendingScrollRef.current) {
      const targetId = pendingScrollRef.current;
      pendingScrollRef.current = null;
      const t = setTimeout(() => smoothScrollTo(targetId), 120);
      return () => clearTimeout(t);
    }
  }, [activeTab]);
  
  // Fetch users you're following and followers
  const { data: userFriends = [], isLoading: friendsLoading } = useUserFriends(user?.id);
  const { data: userFollowers = [], isLoading: followersLoading } = useUserFollowers(user?.id);
  const { data: friendSuggestions = [], isLoading: suggestionsLoading } = useFriendSuggestions(10);
  const friendMutation = useFollowUser();
  
  // Use React Query hooks for data fetching
  const { data: stats, isLoading: statsLoading } = useUserStats(user?.id || '');
  const { data: recentGamesData = [], isLoading: recentGamesLoading } = useUserRecentGames(user?.id || '', 5);
  const { data: achievements = [], isLoading: achievementsLoading } = useUserAchievements(user?.id || '');
  const { data: userTribes = [], isLoading: tribesLoading } = useUserTribes(user?.id);
  const { profile: ambassadorProfile, stats: ambassadorStats } = useAmbassador(user?.id);
  
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
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{displayName}</h2>
                  {ambassadorProfile?.application_status === 'approved' && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> Ambassador
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{displayUsername}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {displayBio}
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => navigate('/app/profile/edit')}>
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Ambassador Section */}
        <Card>
          <CardHeader>
            <CardTitle>Campus Ambassador</CardTitle>
          </CardHeader>
          <CardContent>
            {ambassadorProfile?.application_status === 'approved' ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <p className="text-sm font-medium">You are an official Campus Ambassador</p>
                  <p className="text-xs text-muted-foreground">
                    Referrals: {ambassadorStats?.signups ?? 0} signups, {ambassadorStats?.conversions ?? 0} conversions
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">Open Dashboard</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ambassador Dashboard</DialogTitle>
                      <DialogDescription>Manage referrals and view stats.</DialogDescription>
                    </DialogHeader>
                    <AmbassadorDashboard />
                  </DialogContent>
                </Dialog>
              </div>
            ) : ambassadorProfile && ambassadorProfile.application_status === 'pending' ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <p className="text-sm">Your application is under review.</p>
                <Badge variant="secondary">Pending</Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <p className="text-sm font-medium">Apply to be a Campus Ambassador</p>
                  <p className="text-xs text-muted-foreground">Verified badge, exclusive events, and leadership experience.</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">Apply</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Campus Ambassador Application</DialogTitle>
                      <DialogDescription>Tell us about your campus and motivation.</DialogDescription>
                    </DialogHeader>
                    <AmbassadorApplication />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats - now clickable */}
        <Card>
          <CardHeader>
            <CardTitle id="profile-stats">Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {userStats.map((stat) => {
                const handleClick = () => {
                  if (stat.label === 'Following') {
                    setActiveTab('following');
                    pendingScrollRef.current = 'following-top';
                  } else if (stat.label === 'Achievements') {
                    setActiveTab('achievements');
                    pendingScrollRef.current = 'achievements-top';
                  } else if (stat.label === 'Activities Hosted' || stat.label === 'Activities Joined') {
                    // Navigate to recent games section by switching to overview and scrolling
                    setActiveTab('overview');
                    pendingScrollRef.current = 'overview-top';
                  }
                };
                return (
                  <button
                    key={stat.label}
                    onClick={handleClick}
                    className="w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="flex items-center gap-3">
                      <stat.icon className="w-5 h-5" />
                      <div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                        <div className="text-lg font-semibold">{stat.value}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Social: Segmented control with inline content to avoid long scrolls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Social
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="following">Following</TabsTrigger>
                <TabsTrigger value="followers">Followers</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>
              <div className="mt-4" />
              <TabsContent value="following" className="space-y-4">
                {userFriends.length > 0 ? (
                  <div className="space-y-2">
                    {(showAllFollowing ? userFriends : userFriends.slice(0, 6)).map((friend) => (
                      <div 
                        key={friend.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigateToUser(friend.id)}
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
                    {userFriends.length > 6 && (
                      <div className="flex justify-end gap-4">
                        {showAllFollowing ? (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowAllFollowing(false)}
                            aria-label="Show less following"
                          >
                            Show less
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setShowAllFollowing(true)}
                              aria-label="Show more following"
                            >
                              Show more
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => navigate('/app/profile/following')}
                              aria-label="See all following"
                            >
                              See all
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <NoFriendsEmptyState onExploreGames={() => navigate('/app')} />
                )}
              </TabsContent>
              <TabsContent value="followers" className="space-y-4">
                {followersLoading ? (
                  <div className="py-4 text-center text-muted-foreground">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading followers...
                  </div>
                ) : userFollowers.length > 0 ? (
                  <div className="space-y-2">
                    {(showAllFollowers ? userFollowers : userFollowers.slice(0, 6)).map((follower) => (
                      <div 
                        key={follower.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigateToUser(follower.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={follower.avatar_url || undefined} />
                            <AvatarFallback>
                              {(follower.display_name || follower.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{follower.display_name || follower.username || 'User'}</p>
                            {follower.bio && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">{follower.bio}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            friendMutation.mutate(follower.id);
                          }}
                          disabled={friendMutation.isPending}
                          className="ml-2"
                        >
                          Follow back
                        </Button>
                      </div>
                    ))}
                    {userFollowers.length > 6 && (
                      <div className="flex justify-end gap-4">
                        {showAllFollowers ? (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowAllFollowers(false)}
                            aria-label="Show less followers"
                          >
                            Show less
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setShowAllFollowers(true)}
                              aria-label="Show more followers"
                            >
                              Show more
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => navigate('/app/profile/followers')}
                              aria-label="See all followers"
                            >
                              See all
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No followers yet.</div>
                )}
              </TabsContent>
              <TabsContent value="achievements" className="space-y-4">
                {achievements.length > 0 ? (
                  <AchievementGrid 
                    achievements={achievements.map((ua: any) => ({
                      ...ua.achievements,
                      earned_at: ua.earned_at
                    }))} 
                    maxDisplay={showAllAchievements ? achievements.length : 8}
                    size="sm"
                    layout="card"
                    showScore={true}
                  />
                ) : (
                  <NoAchievementsEmptyState onFindGames={() => navigate('/app')} />
                )}
                {achievements.length > 8 && (
                  <div className="flex justify-end gap-4">
                    {showAllAchievements ? (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowAllAchievements(false)}
                        aria-label="Show fewer achievements"
                      >
                        Show less
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setShowAllAchievements(true)}
                          aria-label="Show more achievements"
                        >
                          Show more
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => navigate('/app/profile/achievements')}
                          aria-label="See all achievements"
                        >
                          See all
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
              <NoSportsSelectedEmptyState 
                onEditProfile={() => navigate('/app/profile/edit')} 
              />
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
              <NoTribesEmptyState 
                onExplore={() => navigate('/app/tribes')}
              />
            )}
          </CardContent>
        </Card>

        {/* Sections below: keep Overview only to avoid duplicate content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList id="profile-tabs" className="grid w-full grid-cols-1 sticky top-0 z-10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsTrigger value="overview" onClick={() => { pendingScrollRef.current = 'overview-top'; }}>Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div id="overview-top" />
            {/* Recent Games */}
            <Card>
              <CardHeader>
                <CardTitle id="recent-games">Recent Games</CardTitle>
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
                    <NoRecentGamesEmptyState 
                      onFindGames={() => navigate('/app')}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements shown inline in Social above */}

          {/* Following/Friends shown inline in Social above */}

          {/* Followers shown inline in Social above */}

        </Tabs>
      </div>
    </div>
  );
}

export default UserProfile;