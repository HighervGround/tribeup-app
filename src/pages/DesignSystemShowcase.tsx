import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import {
  Facepile,
  EmptyStateEnhanced,
  NoGamesFound,
  Leaderboard,
  StatGroup,
  ProgressCard,
  Wizard,
  FeedItem,
  type LeaderboardPlayer,
  type WizardStepType,
} from '@/shared/components/ui';
import { SportPicker, DEFAULT_SPORTS } from '@/domains/games/components/SportPicker';
import { RSVPSection } from '@/domains/games/components/RSVPSection';
import type { Attendee, RSVPStatus } from '@/domains/games/components/AttendeeList';
import { PlayerCard } from '@/domains/users/components/PlayerCard';
import { LocationPicker } from '@/domains/locations/components/LocationPicker';
import type { Location } from '@/domains/locations/components/LocationPicker';
import { Activity, Trophy, Star, Users, MapPin, Plus } from 'lucide-react';

/**
 * Design System Showcase Page
 * 
 * Interactive demo of all new design system components.
 * Accessible at /design-system route.
 */
export default function DesignSystemShowcase() {
  const navigate = useNavigate();
  const [currentWizardStep, setCurrentWizardStep] = React.useState(0);
  const [selectedSport, setSelectedSport] = React.useState<string>('');
  const [selectedLocation, setSelectedLocation] = React.useState<Location | undefined>();
  const [sortKey, setSortKey] = React.useState<string>('rating');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  // Mock data for demos
  const mockUsers = [
    { id: '1', name: 'John Doe', image: null, email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', image: null, email: 'jane@example.com' },
    { id: '3', name: 'Mike Johnson', image: null, email: 'mike@example.com' },
    { id: '4', name: 'Sarah Williams', image: null, email: 'sarah@example.com' },
    { id: '5', name: 'Tom Brown', image: null, email: 'tom@example.com' },
    { id: '6', name: 'Emily Davis', image: null, email: 'emily@example.com' },
  ];

  const mockLeaderboardPlayers: LeaderboardPlayer[] = [
    {
      id: '1',
      name: 'John Doe',
      rank: 1,
      stats: { gamesPlayed: 50, wins: 35, rating: 4.8 },
    },
    {
      id: '2',
      name: 'Jane Smith',
      rank: 2,
      stats: { gamesPlayed: 45, wins: 30, rating: 4.7 },
    },
    {
      id: '3',
      name: 'Mike Johnson',
      rank: 3,
      stats: { gamesPlayed: 40, wins: 28, rating: 4.6 },
    },
  ];

  const mockAttendees: Attendee[] = [
    { id: '1', name: 'John Doe', avatar: null, status: 'going', isHost: true },
    { id: '2', name: 'Jane Smith', avatar: null, status: 'going' },
    { id: '3', name: 'Mike Johnson', avatar: null, status: 'maybe' },
    { id: '4', name: 'Sarah Williams', avatar: null, status: 'going' },
  ];

  const wizardSteps: WizardStepType[] = [
    {
      id: 'step1',
      title: 'Step 1',
      component: <div>Step 1 Content</div>,
      isValid: true,
    },
    {
      id: 'step2',
      title: 'Step 2',
      component: <div>Step 2 Content</div>,
      isValid: true,
    },
    {
      id: 'step3',
      title: 'Step 3',
      component: <div>Step 3 Content</div>,
      isValid: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Design System Showcase</h1>
              <p className="text-sm text-muted-foreground">
                Interactive demos of all design system components
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Facepile */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Facepile Component</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Default (5 visible)</h3>
                <Facepile users={mockUsers} maxVisible={5} size="md" />
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Small (3 visible)</h3>
                <Facepile users={mockUsers} maxVisible={3} size="sm" />
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Large (5 visible)</h3>
                <Facepile users={mockUsers} maxVisible={5} size="lg" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sport Picker */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Sport Picker Component</CardTitle>
            </CardHeader>
            <CardContent>
              <SportPicker
                selectedSport={selectedSport}
                onSportSelect={(sport) => setSelectedSport(sport.value)}
                showSearch
                showRecent
                recentSports={['basketball', 'soccer']}
                gridCols={3}
                size="md"
              />
            </CardContent>
          </Card>
        </section>

        {/* Leaderboard */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard Component</CardTitle>
            </CardHeader>
            <CardContent>
              <Leaderboard
                players={mockLeaderboardPlayers}
                columns={[
                  { key: 'name', label: 'Player', sortable: false },
                  { key: 'gamesPlayed', label: 'Games', sortable: true },
                  { key: 'wins', label: 'Wins', sortable: true },
                  { key: 'rating', label: 'Rating', sortable: true },
                ]}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={(key) => {
                  setSortKey(key);
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}
              />
            </CardContent>
          </Card>
        </section>

        {/* Player Card */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Player Card Component</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Card Variant</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PlayerCard
                    player={{
                      id: '1',
                      name: 'John Doe',
                      avatar: null,
                      stats: { gamesPlayed: 50, wins: 35, rating: 4.8 },
                    }}
                    variant="card"
                    showStats
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">List Variant</h3>
                <div className="space-y-2">
                  <PlayerCard
                    player={{
                      id: '1',
                      name: 'John Doe',
                      avatar: null,
                      stats: { gamesPlayed: 50, wins: 35, rating: 4.8 },
                    }}
                    variant="list"
                    showStats
                  />
                  <PlayerCard
                    player={{
                      id: '2',
                      name: 'Jane Smith',
                      avatar: null,
                      stats: { gamesPlayed: 45, wins: 30, rating: 4.7 },
                    }}
                    variant="list"
                    showStats
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Compact Variant</h3>
                <div className="space-y-2">
                  <PlayerCard
                    player={{
                      id: '1',
                      name: 'John Doe',
                      avatar: null,
                      stats: { rating: 4.8 },
                    }}
                    variant="compact"
                  />
                  <PlayerCard
                    player={{
                      id: '2',
                      name: 'Jane Smith',
                      avatar: null,
                      stats: { rating: 4.7 },
                    }}
                    variant="compact"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* RSVP Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>RSVP Section Component</CardTitle>
            </CardHeader>
            <CardContent>
              <RSVPSection
                attendees={mockAttendees}
                userRSVPStatus="going"
                maxPlayers={20}
                currentPlayers={3}
                onRSVPChange={(status) => console.log('RSVP changed:', status)}
                onInvite={() => console.log('Invite clicked')}
                showFullList={true}
              />
            </CardContent>
          </Card>
        </section>

        {/* Stats Display */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Stats Display Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Stat Group</h3>
                <StatGroup
                  stats={[
                    { label: 'Games', value: 50, icon: <Activity className="size-4" /> },
                    { label: 'Wins', value: 35, icon: <Trophy className="size-4" /> },
                    { label: 'Rating', value: 4.8, icon: <Star className="size-4" /> },
                  ]}
                  columns={3}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Progress Card</h3>
                <ProgressCard
                  label="Win Rate"
                  value={35}
                  max={50}
                  showPercentage
                  color="success"
                  icon={<Trophy className="size-4" />}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Wizard */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Wizard Component</CardTitle>
            </CardHeader>
            <CardContent>
              <Wizard
                steps={wizardSteps}
                currentStep={currentWizardStep}
                onStepChange={setCurrentWizardStep}
                onComplete={() => {
                  alert('Wizard completed!');
                  setCurrentWizardStep(0);
                }}
                showProgress
                showNavigation
              />
            </CardContent>
          </Card>
        </section>

        {/* Activity Feed */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FeedItem
                user={{ id: '1', name: 'John Doe', avatar: null }}
                action="joined_game"
                timestamp={new Date()}
                content={{ title: 'Basketball Game', gameId: '123' }}
                likes={5}
                comments={2}
                onLike={() => console.log('Liked')}
                onComment={() => console.log('Comment')}
              />
              <FeedItem
                user={{ id: '2', name: 'Jane Smith', avatar: null }}
                action="created_game"
                timestamp={new Date(Date.now() - 3600000)}
                content={{ title: 'Soccer Match', gameId: '456' }}
                likes={10}
                comments={5}
              />
            </CardContent>
          </Card>
        </section>

        {/* Location Picker */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Location Picker Component</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationPicker
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                showMap={false}
                showSearch
                showRecent
                recentLocations={[
                  {
                    name: 'UF Student Recreation Center',
                    address: 'Gainesville, FL',
                    latitude: 29.6436,
                    longitude: -82.3549,
                    isRecent: true,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </section>

        {/* Empty States */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Empty State Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold mb-3">No Results</h3>
                <EmptyStateEnhanced
                  variant="no-results"
                  title="No games found"
                  description="Try adjusting your filters"
                  primaryAction={{
                    label: "Clear Filters",
                    onClick: () => console.log('Clear filters'),
                  }}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">No Data</h3>
                <EmptyStateEnhanced
                  variant="no-data"
                  title="No activities yet"
                  description="Create your first activity to get started"
                  primaryAction={{
                    label: "Create Activity",
                    onClick: () => console.log('Create activity'),
                    icon: <Plus className="size-4" />,
                  }}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Error State</h3>
                <EmptyStateEnhanced
                  variant="error"
                  title="Something went wrong"
                  description="We encountered an error. Please try again."
                  primaryAction={{
                    label: "Try Again",
                    onClick: () => console.log('Retry'),
                  }}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">No Games Found (Preset)</h3>
                <NoGamesFound onCreateGame={() => console.log('Create game')} />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
