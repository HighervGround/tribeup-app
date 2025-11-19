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

  const canManage = userRole === 'admin' || userRole === 'moderator' || tribe?.created_by === user?.id;

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
        <Button variant="ghost" onClick={() => navigate('/app/tribes')} className="mb-4">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/tribes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{tribe.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">{tribe.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          {user && (
            <Button
              variant={isMember ? 'outline' : 'default'}
              onClick={handleJoinLeave}
              disabled={isToggling}
              className="flex-1 sm:flex-initial text-sm"
            >
              <span className="hidden sm:inline">{isMember ? 'Leave Tribe' : 'Join Tribe'}</span>
              <span className="sm:hidden">{isMember ? 'Leave' : 'Join'}</span>
            </Button>
          )}
          {canManage && (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/tribe/${tribeId}/edit`)}
              size="icon"
              className="sm:size-auto sm:px-3"
            >
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          )}
        </div>
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
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsList className="w-full sm:w-fit min-w-full sm:min-w-0 inline-flex">
            <TabsTrigger value="chat" className="!flex-shrink-0 sm:!flex-1 whitespace-nowrap min-w-[60px]">
              <MessageCircle className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="!flex-shrink-0 sm:!flex-1 whitespace-nowrap min-w-[80px]">
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Members</span>
              <span className="sm:ml-1">({tribe.member_count})</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="!flex-shrink-0 sm:!flex-1 whitespace-nowrap min-w-[80px]">
              <Calendar className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Games</span>
              <span className="sm:ml-1">({tribe.game_count})</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="!flex-shrink-0 sm:!flex-1 whitespace-nowrap min-w-[60px]">
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat">
          <TribeChat 
            channelId={defaultChannel?.id || ''} 
            tribeId={tribeId || ''} 
            canManage={canManage} 
          />
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

