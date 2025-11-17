# Component Library Documentation

Complete catalog of all UI components in the TribeUp design system, inspired by Strava's component architecture.

## Table of Contents

1. [Core UI Components](#core-ui-components)
2. [Sports-Specific Components](#sports-specific-components)
3. [Social & Community Components](#social--community-components)
4. [Data Visualization Components](#data-visualization-components)
5. [Form & Input Components](#form--input-components)
6. [Layout Components](#layout-components)

---

## Core UI Components

### Facepile

**Location**: `src/shared/components/ui/facepile.tsx`

**Description**: Displays overlapping avatars with overflow indicator, inspired by Strava's facepile pattern.

**Props**:
- `users: FacepileUser[]` - Array of users to display
- `maxVisible?: 3 | 4 | 5` - Maximum visible avatars (default: 5)
- `size?: 'sm' | 'md' | 'lg'` - Size variant
- `showCount?: boolean` - Show count text
- `enablePopover?: boolean` - Enable click-to-expand popover
- `onUserClick?: (user: FacepileUser) => void` - User click handler

**Example**:
```tsx
<Facepile
  users={attendees}
  maxVisible={5}
  size="md"
  onUserClick={(user) => navigate(`/user/${user.id}`)}
/>
```

**Variants**:
- `Facepile` - Full featured with popover
- `SimpleFacepile` - Minimal without popover

---

### Enhanced Empty States

**Location**: `src/shared/components/ui/empty-state-enhanced.tsx`

**Description**: Comprehensive empty state component with variants, illustrations, and CTAs.

**Props**:
- `variant?: 'no-results' | 'no-data' | 'error' | 'onboarding' | 'success' | 'loading'`
- `title: string` - Empty state title
- `description?: string` - Description text
- `icon?: React.ReactNode` - Custom icon
- `illustration?: React.ReactNode` - Custom illustration
- `primaryAction?: EmptyStateAction` - Primary CTA
- `secondaryAction?: EmptyStateAction` - Secondary CTA

**Example**:
```tsx
<EmptyStateEnhanced
  variant="no-results"
  title="No games found"
  description="Try adjusting your filters"
  primaryAction={{
    label: "Create Game",
    onClick: () => navigate('/create'),
    icon: <Plus />
  }}
/>
```

**Preset Components**:
- `NoGamesFound` - No games/activities found
- `NoPlayersFound` - No players in game
- `NoUpcomingGames` - No upcoming games
- `EmptyLeaderboard` - Empty leaderboard
- `ErrorState` - Error state with retry
- `OnboardingWelcome` - Welcome/onboarding state

---

## Sports-Specific Components

### Sport Picker

**Location**: `src/domains/games/components/SportPicker.tsx`

**Description**: Grid-based sport selection with search, recent selections, and favorites.

**Props**:
- `sports?: Sport[]` - Available sports (defaults to DEFAULT_SPORTS)
- `selectedSport?: string` - Currently selected sport
- `onSportSelect: (sport: Sport) => void` - Selection handler
- `showSearch?: boolean` - Enable search
- `showRecent?: boolean` - Show recent selections
- `showFavorites?: boolean` - Show favorites
- `gridCols?: 2 | 3 | 4` - Grid columns
- `size?: 'sm' | 'md' | 'lg'` - Size variant

**Example**:
```tsx
<SportPicker
  selectedSport="basketball"
  onSportSelect={(sport) => setSelectedSport(sport.value)}
  showSearch
  showRecent
  recentSports={['basketball', 'soccer']}
/>
```

---

### Leaderboard Components

**Location**: `src/shared/components/ui/leaderboard/`

**Components**:
- `Leaderboard` - Main container
- `LeaderboardRow` - Individual player row
- `LeaderboardHeader` - Column headers with sorting

**Example**:
```tsx
<Leaderboard
  players={leaderboardData}
  columns={[
    { key: 'name', label: 'Player', sortable: false },
    { key: 'gamesPlayed', label: 'Games', sortable: true },
    { key: 'wins', label: 'Wins', sortable: true },
  ]}
  sortKey="wins"
  sortDirection="desc"
  onSort={(key) => handleSort(key)}
  onPlayerClick={(player) => navigate(`/user/${player.id}`)}
/>
```

**Features**:
- Rank badges (1st, 2nd, 3rd with trophy icons)
- Sortable columns
- Current user highlighting
- Responsive design

---

### Player Card

**Location**: `src/domains/users/components/PlayerCard.tsx`

**Description**: Displays player profile with stats, status indicators, and quick actions.

**Props**:
- `player: Player` - Player data
- `variant?: 'list' | 'card' | 'compact'` - Display variant
- `showStats?: boolean` - Show statistics
- `showActions?: boolean` - Show action buttons
- `onInvite?: (playerId: string) => void` - Invite handler
- `onMessage?: (playerId: string) => void` - Message handler

**Example**:
```tsx
<PlayerCard
  player={{
    id: '1',
    name: 'John Doe',
    avatar: '/avatar.jpg',
    stats: { gamesPlayed: 50, wins: 35, rating: 4.8 }
  }}
  variant="card"
  showStats
  onInvite={(id) => invitePlayer(id)}
/>
```

---

### Game Attendance Components

**Location**: `src/domains/games/components/`

**Components**:
- `AttendeeList` - Full attendee list with facepile
- `RSVPSection` - RSVP interface with status

**Example**:
```tsx
<RSVPSection
  attendees={attendees}
  userRSVPStatus="going"
  onRSVPChange={(status) => updateRSVP(status)}
  onInvite={() => openInviteModal()}
/>
```

**Features**:
- Facepile integration
- RSVP status (Going, Maybe, Not Going)
- Organizer badges
- Collapsible full list

---

## Social & Community Components

### Activity Feed

**Location**: `src/shared/components/ui/feed/`

**Components**:
- `FeedItem` - Individual feed item
- `FeedCard` - Card variant

**Example**:
```tsx
<FeedItem
  user={{ id: '1', name: 'John Doe', avatar: '/avatar.jpg' }}
  action="joined_game"
  timestamp={new Date()}
  content={{ gameTitle: 'Basketball Game', gameId: '123' }}
  likes={5}
  onLike={() => handleLike()}
  onComment={() => handleComment()}
/>
```

**Action Types**:
- `joined_game` - User joined a game
- `created_game` - User created a game
- `achieved_milestone` - User achieved milestone
- `completed_game` - User completed a game
- `invited_friend` - User invited friend
- `rated_game` - User rated a game

---

## Data Visualization Components

### Stats Display

**Location**: `src/shared/components/ui/stats/`

**Components**:
- `StatCard` - Individual stat card
- `StatGroup` - Grouped stats grid
- `ProgressCard` - Progress bar card

**Example**:
```tsx
<StatGroup
  stats={[
    { label: 'Games', value: 50, icon: <Activity /> },
    { label: 'Wins', value: 35, icon: <Trophy /> },
    { label: 'Rating', value: 4.8, icon: <Star /> },
  ]}
  columns={3}
/>
```

**Features**:
- Trend indicators (up/down arrows)
- Color coding
- Tooltips
- Progress visualization

---

## Form & Input Components

### Multi-Step Wizard

**Location**: `src/shared/components/ui/wizard/`

**Components**:
- `Wizard` - Main wizard container
- `WizardStep` - Individual step container
- `WizardProgress` - Progress indicator

**Example**:
```tsx
<Wizard
  steps={steps}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
  onComplete={() => handleSubmit()}
  showProgress
/>
```

**Features**:
- Step validation
- Progress indicator (bar, dots, or steps)
- Navigation controls
- Mobile-optimized

---

## Layout Components

### Location Picker

**Location**: `src/domains/locations/components/LocationPicker.tsx`

**Description**: Enhanced location picker with map, search, recent locations, and favorites.

**Example**:
```tsx
<LocationPicker
  selectedLocation={location}
  onLocationSelect={(loc) => setLocation(loc)}
  showMap
  showSearch
  recentLocations={recent}
  favoriteLocations={favorites}
  onToggleFavorite={(loc) => toggleFavorite(loc)}
/>
```

**Features**:
- Map integration
- Search functionality
- Recent locations
- Favorites support
- Distance calculation
- Current location option

---

## Accessibility Guidelines

All components follow WCAG 2.1 AA standards:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Touch Targets**: Minimum 44x44px on mobile

---

## Best Practices

1. **Use TypeScript**: All components are fully typed
2. **Follow Patterns**: Use existing components as reference
3. **Responsive Design**: Mobile-first approach
4. **Dark Mode**: All components support dark mode
5. **Performance**: Lazy load heavy components
6. **Accessibility**: Test with screen readers

---

## Component Status

| Component | Status | Location |
|-----------|--------|----------|
| Facepile | ✅ Complete | `ui/facepile.tsx` |
| Empty States | ✅ Complete | `ui/empty-state-enhanced.tsx` |
| Sport Picker | ✅ Complete | `domains/games/components/SportPicker.tsx` |
| Leaderboard | ✅ Complete | `ui/leaderboard/` |
| Player Card | ✅ Complete | `domains/users/components/PlayerCard.tsx` |
| Attendance | ✅ Complete | `domains/games/components/` |
| Activity Feed | ✅ Complete | `ui/feed/` |
| Stats Display | ✅ Complete | `ui/stats/` |
| Wizard | ✅ Complete | `ui/wizard/` |
| Location Picker | ✅ Complete | `domains/locations/components/LocationPicker.tsx` |

---

**Last Updated**: January 2025  
**Version**: 1.0.0

