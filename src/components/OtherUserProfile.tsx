import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
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
import { useGames } from '../hooks/useGames';
import { toast } from 'sonner';
import { SupabaseService } from '../lib/supabaseService';
import { useUserProfile } from '../hooks/useUserProfile';



function OtherUserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  
  // Use React Query hook for data fetching
  const { data: user, isLoading: loading, error } = useUserProfile(userId || '');

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">User not found</h1>
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
                  <AvatarFallback className="text-2xl">{user.avatar}</AvatarFallback>
                </Avatar>
                {user.isVerified && (
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
                <div className="text-center">
                  <div className="text-xl">{user.rating}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-warning" />
                    Rating
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-xl">{user.gamesHosted}</div>
                  <div className="text-sm text-muted-foreground">Hosted</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-xl">{user.gamesJoined}</div>
                  <div className="text-sm text-muted-foreground">Joined</div>
                </div>
              </div>

              <Button
                onClick={handleMessage}
                className="w-full max-w-xs"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        {user.achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {user.achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <div>{achievement.name}</div>
                      <div className="text-sm text-muted-foreground">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Favorite Sports */}
        <Card>
          <CardHeader>
            <CardTitle>Favorite Sports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.favoriteSports.map((sport: string) => (
                <Badge key={sport} variant="secondary">{sport}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Favorite Spots */}
        <Card>
          <CardHeader>
            <CardTitle>Favorite Spots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.favoriteSpots.map((spot: string) => (
                <div key={spot} className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{spot}</span>
                </div>
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
              {user.recentGames.map((game: any, index: number) => (
                <div key={game.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div>{game.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {game.sport} • {game.date}
                        </div>
                      </div>
                    </div>
                    <Badge variant={game.role === 'host' ? 'default' : 'secondary'}>
                      {game.role === 'host' ? 'Host' : 'Player'}
                    </Badge>
                  </div>
                  {index < user.recentGames.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Member Since */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Member since {formatJoinDate(user.joinedDate)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    // </motion.div>
  );
}

export default OtherUserProfile;