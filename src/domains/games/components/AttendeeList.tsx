import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Facepile, FacepileUser } from '@/shared/components/ui/facepile';
import { PlayerCard } from '@/domains/users/components/PlayerCard';
import { Users, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';

export type RSVPStatus = 'going' | 'maybe' | 'not_going';

export interface Attendee {
  id?: string;
  name: string;
  avatar?: string | null;
  email?: string;
  status: RSVPStatus;
  isHost?: boolean;
  isOrganizer?: boolean;
  joinedAt?: string;
}

export interface AttendeeListProps extends React.HTMLAttributes<HTMLDivElement> {
  attendees: Attendee[];
  maxPlayers?: number;
  currentPlayers?: number;
  showFacepile?: boolean;
  showFullList?: boolean;
  onInvite?: () => void;
  onAttendeeClick?: (attendee: Attendee) => void;
  currentUserId?: string;
  className?: string;
}

/**
 * Attendee List Component
 * 
 * Displays game attendees with facepile, RSVP status, and full list view.
 * 
 * @example
 * ```tsx
 * <AttendeeList
 *   attendees={attendees}
 *   maxPlayers={20}
 *   currentPlayers={15}
 *   showFacepile
 *   onInvite={() => openInviteModal()}
 * />
 * ```
 */
export function AttendeeList({
  attendees,
  maxPlayers,
  currentPlayers,
  showFacepile = true,
  showFullList = true,
  onInvite,
  onAttendeeClick,
  currentUserId,
  className,
  ...props
}: AttendeeListProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Group attendees by status
  const going = attendees.filter((a) => a.status === 'going');
  const maybe = attendees.filter((a) => a.status === 'maybe');
  const notGoing = attendees.filter((a) => a.status === 'not_going');

  // Convert to FacepileUser format
  const facepileUsers: FacepileUser[] = going.map((attendee) => ({
    id: attendee.id,
    name: attendee.name,
    image: attendee.avatar || undefined,
    email: attendee.email,
  }));

  const handleAttendeeClick = (attendee: Attendee) => {
    if (onAttendeeClick) {
      onAttendeeClick(attendee);
    }
  };

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Facepile Section */}
      {showFacepile && going.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {going.length} {going.length === 1 ? 'player' : 'players'} going
                {maxPlayers && ` (${currentPlayers || going.length}/${maxPlayers})`}
              </span>
            </div>
            {onInvite && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onInvite}
              >
                <UserPlus className="size-3 mr-1" />
                Invite
              </Button>
            )}
          </div>
          <Facepile
            users={facepileUsers}
            maxVisible={5}
            size="md"
            onUserClick={(user) => {
              const attendee = going.find((a) => a.id === user.id);
              if (attendee) {
                handleAttendeeClick(attendee);
              }
            }}
          />
        </div>
      )}

      {/* Full List Section */}
      {showFullList && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between"
            >
              <span className="text-sm font-medium">
                {isExpanded ? 'Hide' : 'Show'} full list ({attendees.length})
              </span>
              {isExpanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Attendees</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="divide-y divide-border">
                    {/* Going */}
                    {going.length > 0 && (
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" className="text-xs">
                            Going ({going.length})
                          </Badge>
                        </div>
                        {going.map((attendee) => (
                          <div
                            key={attendee.id || attendee.name}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handleAttendeeClick(attendee)}
                          >
                            <PlayerCard
                              player={{
                                id: attendee.id,
                                name: attendee.name,
                                avatar: attendee.avatar,
                                isCurrentUser: attendee.id === currentUserId,
                              }}
                              variant="compact"
                              showStats={false}
                              showActions={false}
                            />
                            {attendee.isHost && (
                              <Badge variant="secondary" className="text-xs">
                                Host
                              </Badge>
                            )}
                            {attendee.isOrganizer && (
                              <Badge variant="outline" className="text-xs">
                                Organizer
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Maybe */}
                    {maybe.length > 0 && (
                      <div className="p-3 space-y-2 border-t border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            Maybe ({maybe.length})
                          </Badge>
                        </div>
                        {maybe.map((attendee) => (
                          <div
                            key={attendee.id || attendee.name}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handleAttendeeClick(attendee)}
                          >
                            <PlayerCard
                              player={{
                                id: attendee.id,
                                name: attendee.name,
                                avatar: attendee.avatar,
                                isCurrentUser: attendee.id === currentUserId,
                              }}
                              variant="compact"
                              showStats={false}
                              showActions={false}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Not Going */}
                    {notGoing.length > 0 && (
                      <div className="p-3 space-y-2 border-t border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Not Going ({notGoing.length})
                          </Badge>
                        </div>
                        {notGoing.map((attendee) => (
                          <div
                            key={attendee.id || attendee.name}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer opacity-60"
                            onClick={() => handleAttendeeClick(attendee)}
                          >
                            <PlayerCard
                              player={{
                                id: attendee.id,
                                name: attendee.name,
                                avatar: attendee.avatar,
                                isCurrentUser: attendee.id === currentUserId,
                              }}
                              variant="compact"
                              showStats={false}
                              showActions={false}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

