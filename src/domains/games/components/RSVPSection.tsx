import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Facepile } from '@/shared/components/ui/facepile';
import { AttendeeList, Attendee, RSVPStatus } from './AttendeeList';
import { UserPlus, CheckCircle } from 'lucide-react';

export interface RSVPSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  attendees: Attendee[];
  currentUserId?: string;
  userRSVPStatus?: RSVPStatus;
  maxPlayers?: number;
  currentPlayers?: number;
  onRSVPChange?: (status: RSVPStatus) => void;
  onInvite?: () => void;
  onAttendeeClick?: (attendee: Attendee) => void;
  showFullList?: boolean;
  className?: string;
}

/**
 * RSVP Section Component
 * 
 * Displays RSVP options and attendee list with facepile integration.
 * Based on Strava's event RSVP patterns.
 * 
 * @example
 * ```tsx
 * <RSVPSection
 *   attendees={attendees}
 *   userRSVPStatus="going"
 *   onRSVPChange={(status) => updateRSVP(status)}
 *   onInvite={() => openInviteModal()}
 * />
 * ```
 */
export function RSVPSection({
  attendees,
  currentUserId,
  userRSVPStatus,
  maxPlayers,
  currentPlayers,
  onRSVPChange,
  onInvite,
  onAttendeeClick,
  showFullList = true,
  className,
  ...props
}: RSVPSectionProps) {
  const going = attendees.filter((a) => a.status === 'going');

  return (
    <Card className={cn(className)} {...props}>
      <CardContent className="p-4 space-y-4">
        {/* Facepile of Going Attendees */}
        {going.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-success" />
                <span className="text-sm font-medium">
                  {going.length} {going.length === 1 ? 'person' : 'people'} going
                </span>
                {maxPlayers && (
                  <Badge variant="secondary" className="text-xs">
                    {currentPlayers || going.length}/{maxPlayers}
                  </Badge>
                )}
              </div>
              {onInvite && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onInvite}
                >
                  <UserPlus className="size-3 mr-1" />
                  Invite
                </Button>
              )}
            </div>
            <Facepile
              users={going.map((a) => ({
                id: a.id,
                name: a.name,
                image: a.avatar || undefined,
                email: a.email,
              }))}
              maxVisible={5}
              size="md"
              onUserClick={(user) => {
                const attendee = going.find((a) => a.id === user.id);
                if (attendee && onAttendeeClick) {
                  onAttendeeClick(attendee);
                }
              }}
            />
          </div>
        )}

        {/* Full Attendee List */}
        {showFullList && (
          <AttendeeList
            attendees={attendees}
            maxPlayers={maxPlayers}
            currentPlayers={currentPlayers}
            showFacepile={false}
            onInvite={onInvite}
            onAttendeeClick={onAttendeeClick}
            currentUserId={currentUserId}
          />
        )}
      </CardContent>
    </Card>
  );
}

