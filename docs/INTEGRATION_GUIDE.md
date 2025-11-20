# Design System Integration Guide

This guide documents the integration of the new design system components into the TribeUp application.

## Overview

The design system integration brings a comprehensive set of reusable UI components inspired by modern sports apps like Strava. All components follow consistent design patterns, support dark mode, and are fully accessible.

## Component Locations

### Shared UI Components
Located in `src/shared/components/ui/`:
- **Facepile** - Overlapping avatar display with overflow indicator
- **EmptyStateEnhanced** - Enhanced empty states with variants and CTAs
- **Leaderboard** - Ranking display with sorting
- **Stats Display** - StatCard, StatGroup, ProgressCard
- **Wizard** - Multi-step form component
- **Activity Feed** - FeedItem and FeedCard components

### Games Domain Components
Located in `src/domains/games/components/`:
- **SportPicker** - Sport selection with search and recent sports
- **RSVPSection** - RSVP management with facepile
- **AttendeeList** - Full attendee list with status categories

### Users Domain Components
Located in `src/domains/users/components/`:
- **PlayerCard** - Player/athlete card with stats and actions

### Locations Domain Components
Located in `src/domains/locations/components/`:
- **LocationPicker** - Location selection with map, search, and recent locations

## Integration Points

### 1. GameDetails.tsx
**Changes:**
- Replaced participant list with `RSVPSection` component
- Added Facepile for quick attendee preview
- Integrated AttendeeList for full attendee view

**Usage:**
```tsx
import { RSVPSection, AttendeeList } from '@/domains/games/components';
import { Facepile } from '@/shared/components/ui';

<RSVPSection
  attendees={attendees}
  userRSVPStatus={userRSVPStatus}
  maxPlayers={game.maxPlayers}
  currentPlayers={players.length}
  onRSVPChange={handleRSVPChange}
  onInvite={() => setShowInvite(true)}
/>
```

### 2. CreateGame.tsx
**Changes:**
- Replaced sport selection grid with `SportPicker` component
- Added recent sports tracking via localStorage

**Usage:**
```tsx
import { SportPicker, DEFAULT_SPORTS } from '@/domains/games/components';

<SportPicker
  sports={DEFAULT_SPORTS}
  selectedSport={formData.sport}
  onSportSelect={handleSportSelect}
  showSearch={true}
  showRecent={true}
  recentSports={recentSports}
/>
```

### 3. PublicGamePage.tsx
**Changes:**
- Replaced RSVP list with `Facepile` component

**Usage:**
```tsx
import { Facepile } from '@/shared/components/ui';

<Facepile
  users={publicRsvps.map(rsvp => ({
    id: `guest-${rsvp.id}`,
    name: rsvp.name || 'Guest',
    image: null,
  }))}
  maxVisible={5}
  size="md"
/>
```

### 4. SearchDiscovery.tsx
**Changes:**
- Replaced empty state with `EmptyStateEnhanced` component

**Usage:**
```tsx
import { EmptyStateEnhanced } from '@/shared/components/ui';

<EmptyStateEnhanced
  variant="no-results"
  title="No activities found"
  description="Try adjusting your search or filters"
  primaryAction={{
    label: "Clear Filters",
    onClick: () => clearFilters(),
  }}
/>
```

### 5. UserProfile.tsx
**Changes:**
- Replaced stats grid with `StatGroup` component

**Usage:**
```tsx
import { StatGroup } from '@/shared/components/ui';

<StatGroup
  stats={userStats.map(stat => ({
    label: stat.label,
    value: stat.value,
    icon: <stat.icon className="w-5 h-5" />,
  }))}
  columns={2}
/>
```

### 6. LeaderboardPage.tsx (New)
**Created:**
- New leaderboard page at `/leaderboard` route
- Uses `Leaderboard` component with sorting

**Usage:**
```tsx
import { Leaderboard } from '@/shared/components/ui';

<Leaderboard
  players={players}
  columns={[
    { key: 'name', label: 'Player', sortable: false },
    { key: 'gamesPlayed', label: 'Games', sortable: true },
    { key: 'rating', label: 'Rating', sortable: true },
  ]}
  onSort={handleSort}
/>
```

## Barrel Exports

For easier imports, use barrel exports:

```tsx
// UI Components
import { Facepile, EmptyStateEnhanced, Leaderboard, StatGroup } from '@/shared/components/ui';

// Games Components
import { SportPicker, RSVPSection, AttendeeList } from '@/domains/games/components';

// Users Components
import { PlayerCard } from '@/domains/users/components';
```

## Design Tokens

All components use centralized design tokens defined in `src/styles/globals.css`:
- Spacing scale (4pt grid system)
- Shadow system (6 levels)
- Z-index scale (layering system)
- Status colors (upcoming, in-progress, completed, cancelled)
- Animation tokens

Access programmatically via `src/shared/config/designTokens.ts`.

## Migration Notes

### Breaking Changes
None - all integrations are additive. Existing components continue to work.

### Deprecations
- `NoGamesFound` component now wraps `EmptyStateEnhanced` - API remains compatible
- Old empty state components can be gradually replaced

### Performance
- Components are lazy-loaded where appropriate
- No significant bundle size impact
- All components support code splitting

## Testing

### Component Testing
All integrated components should be tested in:
- Light mode
- Dark mode
- Mobile viewport (375px)
- Keyboard navigation
- Screen readers

### Integration Testing
Test these flows:
1. Game creation with SportPicker
2. RSVP flow with RSVPSection
3. Participant display with Facepile
4. Location selection with LocationPicker
5. Stats display with StatGroup

## Demo/Showcase

Visit `/design-system` route (when authenticated) to see:
- All components with interactive demos
- Different variants and configurations
- Usage examples

## Next Steps

1. **Gradual Migration**: Continue replacing old components with new design system components
2. **User Testing**: Gather feedback on new components
3. **Performance Monitoring**: Track bundle size and render performance
4. **Accessibility Audit**: Complete full accessibility review
5. **Documentation**: Keep component docs updated as features evolve

## Support

For questions or issues:
- Check component documentation in `src/shared/components/COMPONENT_LIBRARY.md`
- Review patterns in `src/shared/patterns/PATTERNS.md`
- See demo page at `/design-system`

