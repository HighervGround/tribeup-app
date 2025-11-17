import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ClickableAvatar } from '@/shared/components/ui/clickable-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
// Simple time ago function
function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return then.toLocaleDateString();
}

export type FeedActionType =
  | 'joined_game'
  | 'created_game'
  | 'achieved_milestone'
  | 'completed_game'
  | 'invited_friend'
  | 'rated_game';

export interface FeedItemProps extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    id?: string;
    name: string;
    avatar?: string | null;
    username?: string;
  };
  action: FeedActionType;
  timestamp: Date | string;
  content?: {
    title?: string;
    description?: string;
    image?: string;
    gameId?: string;
    gameTitle?: string;
  };
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  isExpanded?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onExpand?: () => void;
  onGameClick?: (gameId: string) => void;
  onUserClick?: (userId: string) => void;
}

const actionConfig: Record<
  FeedActionType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  joined_game: {
    label: 'joined',
    icon: '👋',
    color: 'text-primary',
  },
  created_game: {
    label: 'created',
    icon: '✨',
    color: 'text-primary',
  },
  achieved_milestone: {
    label: 'achieved',
    icon: '🏆',
    color: 'text-warning',
  },
  completed_game: {
    label: 'completed',
    icon: '✅',
    color: 'text-success',
  },
  invited_friend: {
    label: 'invited',
    icon: '👥',
    color: 'text-primary',
  },
  rated_game: {
    label: 'rated',
    icon: '⭐',
    color: 'text-warning',
  },
};

/**
 * Feed Item Component
 * 
 * Displays a single activity feed item with user info, action, content, and interactions.
 * 
 * @example
 * ```tsx
 * <FeedItem
 *   user={{ id: '1', name: 'John Doe', avatar: '/avatar.jpg' }}
 *   action="joined_game"
 *   timestamp={new Date()}
 *   content={{ gameTitle: 'Basketball Game', gameId: '123' }}
 *   likes={5}
 *   onLike={() => handleLike()}
 * />
 * ```
 */
export function FeedItem({
  user,
  action,
  timestamp,
  content,
  likes = 0,
  comments = 0,
  isLiked = false,
  isExpanded = false,
  onLike,
  onComment,
  onShare,
  onExpand,
  onGameClick,
  onUserClick,
  className,
  ...props
}: FeedItemProps) {
  const config = actionConfig[action];
  const timeAgo = formatTimeAgo(timestamp);

  const handleGameClick = () => {
    if (content?.gameId && onGameClick) {
      onGameClick(content.gameId);
    }
  };

  return (
    <Card
      className={cn(
        'hover:shadow-medium transition-all duration-200',
        className
      )}
      {...props}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.id ? (
                <ClickableAvatar
                  userId={user.id}
                  src={user.avatar || undefined}
                  alt={user.name}
                  size="md"
                  onClick={onUserClick ? () => onUserClick(user.id!) : undefined}
                />
              ) : (
                <Avatar className="size-10">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.name
                      ?.split(' ')
                      ?.map((word) => word[0])
                      ?.join('')
                      ?.toUpperCase() || '?'}
                </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{user.name}</span>
                <span className="text-muted-foreground">{config.label}</span>
                {content?.gameTitle && (
                  <button
                    type="button"
                    onClick={handleGameClick}
                    className="font-medium text-primary hover:underline"
                  >
                    {content.gameTitle}
                  </button>
                )}
                {content?.title && (
                  <span className="font-medium">{content.title}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>

              {/* Description */}
              {content?.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {content.description}
                </p>
              )}

              {/* Image */}
              {content?.image && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  <img
                    src={content.image}
                    alt={content.title || 'Feed image'}
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>

            {/* More Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onShare && (
                  <DropdownMenuItem onClick={onShare}>Share</DropdownMenuItem>
                )}
                <DropdownMenuItem>Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            {onLike && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onLike}
                className={cn(isLiked && 'text-destructive')}
              >
                <Heart
                  className={cn('size-4 mr-1', isLiked && 'fill-current')}
                />
                {likes > 0 && <span>{likes}</span>}
              </Button>
            )}
            {onComment && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onComment}
              >
                <MessageCircle className="size-4 mr-1" />
                {comments > 0 && <span>{comments}</span>}
              </Button>
            )}
            {onShare && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onShare}
              >
                <Share2 className="size-4 mr-1" />
                Share
              </Button>
            )}
            {onExpand && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onExpand}
                className="ml-auto"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-4 mr-1" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4 mr-1" />
                    More
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

