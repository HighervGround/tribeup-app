import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Users, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useTribeJoinToggle, useTribeMembership } from '../hooks/useTribeMembers';
import { Tribe } from '../services/tribeService';
import { cn } from '@/shared/utils/utils';

interface TribeCardProps {
  tribe: Tribe & {
    creator?: {
      id: string;
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
    };
  };
  showJoinButton?: boolean;
  onSelect?: (tribeId: string) => void;
}

export function TribeCard({ tribe, showJoinButton = true, onSelect }: TribeCardProps) {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { data: isMember = false } = useTribeMembership(tribe.id, user?.id);
  const { toggle, isLoading } = useTribeJoinToggle();

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(tribe.id);
    } else {
      navigate(`/tribe/${tribe.id}`);
    }
  };

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) {
      navigate('/login');
      return;
    }
    await toggle(tribe.id, user.id, isMember);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={tribe.avatar_url || undefined} alt={tribe.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {tribe.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{tribe.name}</h3>
                {!tribe.is_public && (
                  <Badge variant="secondary" className="text-xs">
                    Private
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {tribe.activity}
                </Badge>
                {tribe.location && (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{tribe.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {tribe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{tribe.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{tribe.member_count} members</span>
            </div>
            {tribe.game_count > 0 && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{tribe.game_count} games</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showJoinButton && user && (
            <Button
              size="sm"
              variant={isMember ? 'outline' : 'default'}
              onClick={handleJoinClick}
              disabled={isLoading}
              className="w-full"
            >
              {isMember ? 'Leave Tribe' : 'Join Tribe'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TribeCard;

