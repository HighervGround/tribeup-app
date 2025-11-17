import { useParams, useNavigate } from 'react-router-dom';
import { useTribe } from '../hooks/useTribes';
import { useTribeRealtime } from '../hooks/useTribeRealtime';
import { useTribeMembership, useTribeRole, useTribeJoinToggle } from '../hooks/useTribeMembers';
import { useTribeChannels } from '../hooks/useTribeChannels';
import { useTribeStatistics } from '../hooks/useTribeStatistics';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ArrowLeft, Users, Calendar, MessageCircle, Settings, MapPin } from 'lucide-react';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { TribeChat } from './TribeChat';
import { TribeMembers } from './TribeMembers';
import { TribeGames } from './TribeGames';
import { TribeStatistics } from './TribeStatistics';

export function TribeDetail() {
  const { tribeId } = useParams<{ tribeId: string }>();
  const navigate = useNavigate();
  const { user } = useAppStore();

  const { data: tribe, isLoading } = useTribe(tribeId || '');
  const { data: isMember = false } = useTribeMembership(tribeId || '', user?.id);
  const { data: userRole } = useTribeRole(tribeId || '', user?.id);
  const { data: channels } = useTribeChannels(tribeId || '');
  const { data: statistics } = useTribeStatistics(tribeId || '');
  const { toggle, isLoading: isToggling } = useTribeJoinToggle();

  useTribeRealtime(tribeId || '');

  const handleJoinLeave = async () => {
    if (!user?.id || !tribeId) return;
    await toggle(tribeId, user.id, isMember);
  };

  const canManage = userRole === 'admin' || userRole === 'moderator';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tribe) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate('/tribes')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tribes
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Tribe not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultChannel = channels?.find((c) => c.type === 'general') || channels?.[0];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tribes')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{tribe.name}</h1>
          <p className="text-muted-foreground">{tribe.description || 'No description'}</p>
        </div>
        {user && (
          <Button
            variant={isMember ? 'outline' : 'default'}
            onClick={handleJoinLeave}
            disabled={isToggling}
          >
            {isMember ? 'Leave Tribe' : 'Join Tribe'}
          </Button>
        )}
        {canManage && (
          <Button variant="outline" onClick={() => navigate(`/tribe/${tribeId}/edit`)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      {/* Cover Image */}
      {tribe.cover_image_url && (
        <div className="relative h-48 w-full rounded-lg overflow-hidden">
          <img
            src={tribe.cover_image_url}
            alt={tribe.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Tribe Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={tribe.avatar_url || undefined} alt={tribe.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {tribe.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>{tribe.activity}</Badge>
                {!tribe.is_public && <Badge variant="secondary">Private</Badge>}
                {tribe.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{tribe.location}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{tribe.member_count} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{tribe.game_count} games</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-2" />
            Members ({tribe.member_count})
          </TabsTrigger>
          <TabsTrigger value="games">
            <Calendar className="w-4 h-4 mr-2" />
            Games ({tribe.game_count})
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Settings className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          {defaultChannel ? (
            <TribeChat channelId={defaultChannel.id} tribeId={tribeId || ''} canManage={canManage} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No channels available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members">
          <TribeMembers tribeId={tribeId || ''} canManage={canManage} />
        </TabsContent>

        <TabsContent value="games">
          <TribeGames tribeId={tribeId || ''} />
        </TabsContent>

        <TabsContent value="stats">
          <TribeStatistics tribeId={tribeId || ''} statistics={statistics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TribeDetail;

