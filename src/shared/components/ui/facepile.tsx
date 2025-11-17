import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { ClickableAvatar } from '@/shared/components/ui/clickable-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Users } from 'lucide-react';

const facepileVariants = cva('flex items-center', {
  variants: {
    size: {
      sm: 'gap-1',
      md: 'gap-1.5',
      lg: 'gap-2',
    },
    maxVisible: {
      3: '',
      4: '',
      5: '',
    },
  },
  defaultVariants: {
    size: 'md',
    maxVisible: 5,
  },
});

const avatarSizeVariants = cva('border-2 border-background', {
  variants: {
    size: {
      sm: 'size-6',
      md: 'size-8',
      lg: 'size-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const overflowBadgeVariants = cva(
  'flex items-center justify-center border-2 border-background rounded-full font-medium text-xs bg-muted text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'size-6 text-[10px]',
        md: 'size-8 text-xs',
        lg: 'size-10 text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface FacepileUser {
  id?: string;
  name: string;
  image?: string | null;
  email?: string;
}

export interface FacepileProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof facepileVariants> {
  users: FacepileUser[];
  maxVisible?: 3 | 4 | 5;
  showCount?: boolean;
  onUserClick?: (user: FacepileUser) => void;
  enablePopover?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Facepile Component - Strava-inspired overlapping avatar display
 * 
 * Displays a group of user avatars in an overlapping pattern with overflow indicator.
 * Supports click-to-expand functionality via popover.
 * 
 * @example
 * ```tsx
 * <Facepile
 *   users={[
 *     { id: '1', name: 'John Doe', image: '/avatar1.jpg' },
 *     { id: '2', name: 'Jane Smith', image: '/avatar2.jpg' },
 *   ]}
 *   maxVisible={5}
 *   onUserClick={(user) => navigate(`/users/${user.id}`)}
 * />
 * ```
 */
export const Facepile = React.forwardRef<HTMLDivElement, FacepileProps>(
  (
    {
      users,
      maxVisible = 5,
      size = 'md',
      showCount = true,
      onUserClick,
      enablePopover = true,
      emptyMessage = 'No users',
      className,
      ...props
    },
    ref
  ) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    // Handle empty state
    if (!users || users.length === 0) {
      return (
        <div
          ref={ref}
          className={cn('flex items-center gap-2 text-muted-foreground text-sm', className)}
          {...props}
        >
          <Users className={cn(avatarSizeVariants({ size }))} />
          <span>{emptyMessage}</span>
        </div>
      );
    }

    const visibleUsers = users.slice(0, maxVisible);
    const overflowCount = users.length - maxVisible;
    const hasOverflow = overflowCount > 0;

    const handleAvatarClick = (user: FacepileUser) => {
      if (onUserClick) {
        onUserClick(user);
      }
    };

    const renderAvatar = (user: FacepileUser, index: number) => {
      const avatarElement = user.id ? (
        <ClickableAvatar
          userId={user.id}
          src={user.image || undefined}
          alt={user.name}
          size={size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md'}
          className={cn(
            avatarSizeVariants({ size }),
            'hover:z-10 transition-all duration-200 hover:scale-110',
            index > 0 && '-ml-2'
          )}
          onClick={onUserClick ? () => handleAvatarClick(user) : undefined}
        />
      ) : (
        <Avatar
          className={cn(
            avatarSizeVariants({ size }),
            'hover:z-10 transition-all duration-200 hover:scale-110',
            index > 0 && '-ml-2'
          )}
        >
          <AvatarImage src={user.image || undefined} alt={user.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {user.name
              ?.split(' ')
              ?.map((word) => word[0])
              ?.join('')
              ?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      );

      return (
        <div
          key={user.id || user.email || index}
          className="relative"
          title={user.name}
        >
          {avatarElement}
        </div>
      );
    };

    const content = (
      <div
        ref={ref}
        className={cn(facepileVariants({ size, maxVisible }), className)}
        {...props}
      >
        {visibleUsers.map((user, index) => renderAvatar(user, index))}

        {hasOverflow && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  overflowBadgeVariants({ size }),
                  'hover:bg-muted-foreground/20 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  visibleUsers.length > 0 && '-ml-2'
                )}
                aria-label={`${overflowCount} more users`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!enablePopover) {
                    // If popover disabled, just show count
                    return;
                  }
                }}
              >
                +{overflowCount}
              </button>
            </PopoverTrigger>
            {enablePopover && (
              <PopoverContent
                className="w-64 p-0"
                align="start"
                side="bottom"
                sideOffset={8}
              >
                <div className="p-2">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                    All Participants ({users.length})
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1 p-2">
                      {users.map((user, index) => (
                        <div
                          key={user.id || user.email || index}
                          className={cn(
                            'flex items-center gap-3 rounded-md p-2 hover:bg-muted transition-colors cursor-pointer',
                            onUserClick && 'cursor-pointer'
                          )}
                          onClick={() => {
                            if (onUserClick) {
                              onUserClick(user);
                            }
                            setIsPopoverOpen(false);
                          }}
                        >
                          {user.id ? (
                            <ClickableAvatar
                              userId={user.id}
                              src={user.image || undefined}
                              alt={user.name}
                              size="sm"
                            />
                          ) : (
                            <Avatar className="size-8">
                              <AvatarImage src={user.image || undefined} alt={user.name} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {user.name
                                  ?.split(' ')
                                  ?.map((word) => word[0])
                                  ?.join('')
                                  ?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{user.name}</div>
                            {user.email && (
                              <div className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            )}
          </Popover>
        )}
      </div>
    );

    // If showCount is true and there's overflow, show count text
    if (showCount && hasOverflow && !enablePopover) {
      return (
        <div className={cn('flex items-center gap-2', className)} {...props}>
          {content}
          <span className="text-sm text-muted-foreground">
            {overflowCount} more
          </span>
        </div>
      );
    }

    return content;
  }
);

Facepile.displayName = 'Facepile';

/**
 * Simple Facepile variant - just shows avatars without popover
 */
export const SimpleFacepile = React.forwardRef<
  HTMLDivElement,
  Omit<FacepileProps, 'enablePopover' | 'showCount'>
>((props, ref) => {
  return <Facepile {...props} enablePopover={false} showCount={false} ref={ref} />;
});

SimpleFacepile.displayName = 'SimpleFacepile';

