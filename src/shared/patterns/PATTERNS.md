# UI Patterns Library

Common UI patterns used throughout the TribeUp app, inspired by Strava's design patterns.

## Table of Contents

1. [Facepile Pattern](#facepile-pattern)
2. [Step-by-Step Forms](#step-by-step-forms)
3. [Empty States](#empty-states)
4. [Loading States](#loading-states)
5. [Error Handling](#error-handling)
6. [Modal Patterns](#modal-patterns)
7. [Card Patterns](#card-patterns)

---

## Facepile Pattern

**Purpose**: Display multiple users/attendees in a compact, visually appealing way.

**Implementation**:
```tsx
import { Facepile } from '@/shared/components/ui/facepile';

<Facepile
  users={attendees}
  maxVisible={5}
  size="md"
  enablePopover
  onUserClick={(user) => navigate(`/user/${user.id}`)}
/>
```

**Use Cases**:
- Game attendees
- Team members
- Event participants
- Friend lists

**Best Practices**:
- Show 3-5 visible avatars
- Use "+X more" for overflow
- Enable popover for full list
- Make avatars clickable to view profiles

---

## Step-by-Step Forms

**Purpose**: Break complex forms into manageable steps with validation.

**Implementation**:
```tsx
import { Wizard, WizardStep } from '@/shared/components/ui/wizard';

<Wizard
  steps={[
    {
      id: 'sport',
      title: 'Select Sport',
      component: <SportPicker onSelect={handleSelect} />,
      isValid: selectedSport !== null,
    },
    {
      id: 'details',
      title: 'Game Details',
      component: <GameDetailsForm />,
      isValid: formIsValid,
    },
  ]}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
  onComplete={handleSubmit}
/>
```

**Best Practices**:
- Validate each step before proceeding
- Show progress indicator
- Allow going back
- Save draft state
- Mobile-optimized navigation

---

## Empty States

**Purpose**: Provide helpful guidance when no data is available.

**Implementation**:
```tsx
import { EmptyStateEnhanced } from '@/shared/components/ui/empty-state-enhanced';

<EmptyStateEnhanced
  variant="no-results"
  title="No games found"
  description="Try adjusting your filters or create a new game"
  primaryAction={{
    label: "Create Game",
    onClick: () => navigate('/create'),
    icon: <Plus />
  }}
/>
```

**Variants**:
- `no-results` - Search/filter returned no results
- `no-data` - No data exists yet
- `error` - Error occurred
- `onboarding` - First-time user experience
- `success` - Completion state
- `loading` - Loading state

**Best Practices**:
- Provide clear explanation
- Include actionable CTAs
- Use appropriate illustrations
- Match tone to context

---

## Loading States

**Purpose**: Show progress and maintain user engagement during async operations.

**Implementation**:
```tsx
import { Skeleton } from '@/shared/components/ui/skeleton';

// Skeleton loading
<div className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
</div>

// Spinner loading
<LoadingSpinner />
```

**Best Practices**:
- Use skeletons for content loading
- Use spinners for actions
- Show progress when possible
- Optimistic updates for better UX

---

## Error Handling

**Purpose**: Gracefully handle errors and provide recovery options.

**Implementation**:
```tsx
import { ErrorState } from '@/shared/components/ui/empty-state-enhanced';

<ErrorState
  onRetry={() => refetch()}
  onContactSupport={() => openSupport()}
/>
```

**Best Practices**:
- Show user-friendly messages
- Provide retry options
- Log errors for debugging
- Don't expose technical details
- Offer alternative actions

---

## Modal Patterns

**Purpose**: Focus user attention on specific tasks or information.

**Types**:
1. **Confirmation Modals** - Confirm destructive actions
2. **Form Modals** - Quick input forms
3. **Information Modals** - Display details
4. **Full-Screen Modals** - Complex flows

**Implementation**:
```tsx
import { Dialog } from '@/shared/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Best Practices**:
- Use for important actions
- Provide clear CTAs
- Support keyboard navigation
- Focus trap inside modal
- Escape key to close

---

## Card Patterns

**Purpose**: Group related content in visually distinct containers.

**Types**:
1. **Game Cards** - Display game information
2. **Player Cards** - Show player profiles
3. **Stat Cards** - Display metrics
4. **Feed Cards** - Activity feed items

**Implementation**:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

<Card className="hover:shadow-medium transition-all">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content here
  </CardContent>
</Card>
```

**Best Practices**:
- Use consistent padding
- Add hover effects
- Support click actions
- Responsive design
- Clear visual hierarchy

---

## Pattern Checklist

When implementing a new pattern:

- [ ] Follow existing component structure
- [ ] Support dark mode
- [ ] Mobile-responsive
- [ ] Keyboard accessible
- [ ] Screen reader friendly
- [ ] Performance optimized
- [ ] Documented with examples

---

**Last Updated**: January 2025  
**Version**: 1.0.0

