import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  Star, 
  Shield,
  Flag,
  Share
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserProfile, useUserStats, useUserRecentGames, useUserAchievements } from '../hooks/useUserProfile';
import { AchievementGrid } from './AchievementBadge';
import { initialsFrom } from '@/lib/initials';
import { supabase } from '../lib/supabase';



function OtherUserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const queryClient = useQueryClient();
  
  // Force refresh when userId changes to ensure fresh data
  useEffect(() => {
    if (userId) {
      console.log('🔄 User profile changed, invalidating cache for userId:', userId);
      queryClient.invalidateQueries({ queryKey: ['users', 'profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'recentGames', userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'achievements', userId] });
    }
  }, [userId, queryClient]);
  
  // Debug: Verify session and client on component mount
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 [OtherUserProfile] Component mount check:', {
        userId,
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        hasClient: !!supabase,
        hasAuth: !!supabase.auth
      });
    })();
  }, [userId]);

  // Use React Query hooks for data fetching
  const { data: user, isLoading: loading, error } = useUserProfile(userId || '');
  const { data: userStats, isLoading: statsLoading } = useUserStats(userId || '');
  const { data: recentGames = [], isLoading: recentGamesLoading } = useUserRecentGames(userId || '', 5);
  const { data: achievements = [], isLoading: achievementsLoading } = useUserAchievements(userId || '');

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error or user not found
  if (error || !user) {
    console.error('❌ [OtherUserProfile] Error or user not found:', { 
      error, 
      errorCode: error instanceof Error ? 'unknown' : (error as any)?.code,
      errorMessage: error instanceof Error ? error.message : (error as any)?.message,
      user, 
      userId 
    });
    
    // Distinguish between auth errors and not found
    const isAuthError = error && (
      (error as any)?.code === 'PGRST301' || // Permission denied
      (error as any)?.code === '42501' ||    // Insufficient privilege
      (error as any)?.message?.includes('permission') ||
      (error as any)?.message?.includes('RLS') ||
      (error as any)?.message?.includes('JWT')
    );
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">{isAuthError ? 'Authentication Error' : 'User not found'}</h1>
          <p className="text-muted-foreground mb-4">
            {isAuthError 
              ? 'There was an authentication issue loading this profile. Please try logging in again.'
              : 'The user you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">UserId: {userId}</p>
          {isAuthError && (
            <p className="text-xs text-red-500 mb-4">
              Error code: {(error as any)?.code || 'unknown'}
            </p>
          )}
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  const handleMessage = () => {
    navigate(`/chat/direct/${user.id}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user.name} on TribeUp`,
        text: `Check out ${user.name}'s profile on TribeUp`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied!', {
        description: 'Share with your friends',
      });
    }
  };

  const handleReport = () => {
    toast.success('Report submitted', {
      description: 'Thank you for helping keep TribeUp safe',
    });
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleReport}>
              <Flag className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {user.avatar ? (
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    {initialsFrom(user.name)}
                  </AvatarFallback>
                </Avatar>
                {(user as any).isVerified && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              <div>
                <h1 className="text-2xl mb-1">{user.name}</h1>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
              </div>

              {user.bio && (
                <p className="text-muted-foreground max-w-md">{user.bio}</p>
              )}

              <div className="flex items-center gap-4 pt-2">
                {/* Rating temporarily hidden during early testing phase */}
                {/* <div className="text-center">
                  <div className="text-xl">
                    {statsLoading ? '...' : (userStats?.averageRating?.toFixed(1) || '0.0')}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-warning" />
                    Rating
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8" /> */}
                <div className="text-center">
                  <div className="text-xl">
                    {statsLoading ? '...' : (userStats?.totalGamesHosted || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Hosted</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-xl">
                    {statsLoading ? '...' : (userStats?.totalGamesPlayed || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Joined</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">
                    {achievementsLoading ? '...' : achievements.reduce((total: number, ua: any) => total + ((ua.achievements || ua).points || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                </div>
              </div>

              <Button
                disabled
                variant="outline"
                size="lg"
                className="w-full max-w-xs opacity-50 cursor-not-allowed"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Messaging Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievements ({achievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievementsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading achievements...</p>
              </div>
            ) : achievements.length > 0 ? (
              <AchievementGrid 
                achievements={achievements.map((ua: any) => ({
                  ...ua.achievements || ua,
                  earned_at: ua.earned_at
                }))} 
                maxDisplay={12}
                size="md"
                layout="card"
                showScore={true}
              />
            ) : (
              <p className="text-muted-foreground text-center py-4">No achievements yet</p>
            )}
          </CardContent>
        </Card>

        {/* Favorite Sports */}
        <Card>
          <CardHeader>
            <CardTitle>Favorite Sports</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading sports...</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userStats?.favoritesSports && userStats.favoritesSports.length > 0 ? (
                  userStats.favoritesSports.map((sport: string) => (
                    <Badge key={sport} variant="secondary">{sport}</Badge>
                  ))
                ) : user?.preferences?.sports && user.preferences.sports.length > 0 ? (
                  user.preferences.sports.map((sport: string) => (
                    <Badge key={sport} variant="secondary">{sport}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">No favorite sports listed</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading stats...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{userStats?.totalPlayTime || 0}</div>
                  <div className="text-sm text-muted-foreground">Minutes Played</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{userStats?.completionRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Games */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Games ({recentGames.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {recentGamesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading recent games...</p>
              </div>
            ) : recentGames.length > 0 ? (
              <div className="space-y-3">
                {recentGames.map((game: any, index: number) => (
                  <div key={game.id || index}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{game.title || game.games?.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {game.sport || game.games?.sport} • {new Date(game.date || game.games?.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={game.isHost ? 'default' : 'secondary'}>
                        {game.isHost ? 'Host' : 'Player'}
                      </Badge>
                    </div>
                    {index < recentGames.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent games</p>
            )}
          </CardContent>
        </Card>

        {/* Member Since */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Member since {formatJoinDate((user as any).joinedDate || (user as any).created_at || new Date().toISOString())}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

export default OtherUserProfile;