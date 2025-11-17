import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Facepile } from '@/shared/components/ui/facepile';
import { AttendeeList, Attendee, RSVPStatus } from './AttendeeList';
import { UserPlus, CheckCircle, HelpCircle, XCircle } from 'lucide-react';

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

const RSVP_OPTIONS: Array<{
  status: RSVPStatus;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'secondary' | 'outline';
}> = [
  {
    status: 'going',
    label: 'Going',
    icon: <CheckCircle className="size-4" />,
    variant: 'default',
  },
  {
    status: 'maybe',
    label: 'Maybe',
    icon: <HelpCircle className="size-4" />,
    variant: 'secondary',
  },
  {
    status: 'not_going',
    label: "Can't Go",
    icon: <XCircle className="size-4" />,
    variant: 'outline',
  },
];

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
  const maybe = attendees.filter((a) => a.status === 'maybe');
  const notGoing = attendees.filter((a) => a.status === 'not_going');

  const handleRSVPChange = (status: RSVPStatus) => {
    if (onRSVPChange) {
      onRSVPChange(status);
    }
  };

  return (
    <Card className={cn(className)} {...props}>
      <CardContent className="p-4 space-y-4">
        {/* RSVP Buttons */}
        {onRSVPChange && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold mb-2">Your RSVP</h3>
            <div className="flex gap-2">
              {RSVP_OPTIONS.map((option) => {
                const isSelected = userRSVPStatus === option.status;
                return (
                  <Button
                    key={option.status}
                    type="button"
                    variant={isSelected ? option.variant : 'outline'}
                    size="sm"
                    className={cn(
                      'flex-1',
                      isSelected && 'ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => handleRSVPChange(option.status)}
                  >
                    {option.icon}
                    <span className="ml-1">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

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

        {/* Maybe Attendees */}
        {maybe.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-warning" />
              <span className="text-sm font-medium">
                {maybe.length} {maybe.length === 1 ? 'person' : 'people'} maybe
              </span>
            </div>
            <Facepile
              users={maybe.map((a) => ({
                id: a.id,
                name: a.name,
                image: a.avatar || undefined,
                email: a.email,
              }))}
              maxVisible={3}
              size="sm"
              onUserClick={(user) => {
                const attendee = maybe.find((a) => a.id === user.id);
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

