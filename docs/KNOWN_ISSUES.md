# Known Issues & Workarounds

This document tracks known issues, attempted fixes, and workarounds in the TribeUp codebase.

## Auto-Scrolling Issue on Game Details Page

### Issue Description
When navigating to the Game Details page (`/app/game/:gameId`), the page would sometimes auto-scroll to an unwanted position instead of starting at the top. This created a poor user experience where users would land in the middle of a long game details page.

### Symptoms
- Page would scroll to a random position on initial load
- Scroll position would jump around during the first second after navigation
- Users had to manually scroll back to the top to see the game header information

### Root Cause (Suspected)
The issue was likely caused by:
1. **Browser scroll restoration** - Browsers try to restore scroll position on navigation
2. **React component lifecycle** - Dynamic content loading causing layout shifts
3. **Route transitions** - React Router transitions potentially triggering scroll events
4. **DOM updates** - Multiple rapid DOM updates during component mount causing layout recalculations

### Attempted Fix (Removed)
An aggressive scroll prevention mechanism was implemented in `GameDetails.tsx` that:
- Locked scrolling for the first second after mount
- Force-scrolled to top repeatedly at intervals (50ms, 100ms, 200ms, 400ms, 600ms, 800ms)
- Prevented scroll events from firing during the lock period

**Why it was removed:**
- Too aggressive and intrusive
- Created poor UX by preventing legitimate user scrolling
- Was a workaround rather than addressing the root cause
- Could interfere with accessibility features

### Current Solution
The app now relies on more standard approaches:

1. **Browser scroll restoration disabled** (in `App.tsx`):
   ```typescript
   window.history.scrollRestoration = 'manual';
   ```

2. **Route-based scroll to top** (in `AppContent.tsx`):
   ```typescript
   useEffect(() => {
     window.scrollTo(0, 0);
   }, [location.pathname]);
   ```

These solutions are less intrusive and follow React Router best practices.

### If Issue Returns
If the auto-scrolling issue returns, investigate:
1. Check if React Router's scroll restoration is interfering
2. Look for components that trigger layout shifts on mount
3. Verify that `window.history.scrollRestoration = 'manual'` is still active
4. Check for third-party libraries that might be manipulating scroll position
5. Review CSS that might be causing unexpected scroll behavior
6. Test with browser DevTools to identify which element is triggering the scroll

### Alternative Solutions to Consider
- Use React Router's `ScrollToTop` component pattern
- Implement a more gentle scroll-to-top animation
- Use CSS `scroll-behavior: smooth` instead of JavaScript
- Investigate if specific components (maps, charts, etc.) are causing scroll triggers
- Add `{ behavior: 'auto' }` to scroll calls to prevent smooth scrolling conflicts

### Related Files
- `src/App.tsx` - Browser scroll restoration disabled
- `src/shared/components/layout/AppContent.tsx` - Route-based scroll to top
- `src/domains/games/components/GameDetails.tsx` - Previous aggressive fix removed

---

## Attendee Click Navigation Not Working

### Issue Description
Users are unable to click on attendees in the Game Details page to navigate to their profiles. The click handlers appear to be wired up correctly, but navigation is not occurring when clicking on attendee avatars or names in the RSVP section.

### Symptoms
- Clicking on attendee avatars in the Facepile does not navigate to user profiles
- Clicking on attendee items in the full AttendeeList does not navigate to user profiles
- No error messages or console errors when clicking
- Click handlers appear to be connected but not executing navigation

### Root Cause (Suspected)
The issue may be related to:
1. **Event propagation** - Click events may be getting stopped or prevented somewhere in the component tree
2. **ID format issues** - Attendee IDs may not be in the expected format for navigation
3. **ClickableAvatar behavior** - When `onClick` is provided to `ClickableAvatar`, it may override the built-in navigation, but the custom handler may not be executing properly
4. **Facepile component** - The Facepile's `onUserClick` may not be properly propagating to the `onAttendeeClick` handler

### Attempted Fixes
1. **Improved handler validation** - Added better null checks and ID validation in `onAttendeeClick` handler
2. **Error handling** - Added try/catch around navigation calls
3. **ID filtering** - Added checks to exclude guest and temp user IDs

**Current handler implementation:**
```typescript
onAttendeeClick={(attendee) => {
  if (attendee?.id && typeof attendee.id === 'string' && !attendee.id.startsWith('guest-') && !attendee.id.startsWith('temp-')) {
    try {
      navigateToUser(attendee.id);
    } catch (error) {
      console.error('Failed to navigate to user profile:', error);
    }
  }
}}
```

### Current Status
**Still not fixed** - The issue persists despite handler improvements. Navigation is not occurring when clicking on attendees.

### If Issue Persists
If the issue continues, investigate:
1. Check browser console for any errors when clicking attendees
2. Verify that `navigateToUser` function is being called (add console.log)
3. Check if event propagation is being stopped somewhere (check for `stopPropagation()` calls)
4. Verify attendee IDs are valid UUIDs or user IDs
5. Test if `ClickableAvatar`'s built-in navigation works when `onClick` is not provided
6. Check if the Facepile component is properly forwarding click events
7. Verify that `useDeepLinks` hook's `navigateToUser` is working correctly
8. Check if there are any route guards or authentication checks blocking navigation

### Alternative Solutions to Consider
- Remove custom `onClick` from `ClickableAvatar` and rely on built-in navigation
- Use `Link` components from React Router instead of programmatic navigation
- Add explicit click handlers directly to attendee items instead of relying on component props
- Debug by adding console.log statements throughout the click handler chain

### Related Files
- `src/domains/games/components/GameDetails.tsx` - Main handler implementation
- `src/domains/games/components/RSVPSection.tsx` - Facepile and attendee list rendering
- `src/domains/games/components/AttendeeList.tsx` - Full attendee list with click handlers
- `src/shared/components/ui/facepile.tsx` - Facepile component with ClickableAvatar
- `src/shared/components/ui/clickable-avatar.tsx` - Avatar component with built-in navigation
- `src/shared/hooks/useDeepLinks.ts` - Navigation utility function

---

## UI Consistency Issues: Badges and Buttons

### Issue Description
There are several UI consistency issues related to badges and buttons throughout the application:
1. **Missing Orange Badge Variant** - Orange is a brand color (primary) but there's no dedicated orange badge variant
2. **Inconsistent Badge Sizes** - Badge sizes are inconsistently defined with custom className overrides instead of using standardized size variants
3. **Badge/Button Redundancy** - Some UI elements use badges when buttons would be more appropriate, or have redundant badge+button combinations

### Symptoms
- Orange color is only available via custom className (e.g., `bg-primary` or `bg-orange-600`)
- Badge sizes vary with custom `px-`, `py-`, `h-`, `text-` classes throughout codebase
- Some components have both badges and buttons for similar actions
- No standardized badge size system like buttons have (sm, default, lg)

### Root Cause
1. **Badge Component Limitations** - The badge component only has 4 variants (default, secondary, destructive, outline) with no orange/warning variant
2. **No Size System** - Badges don't have a size prop like buttons do, forcing developers to use custom classes
3. **Design System Gaps** - Missing clear guidelines on when to use badges vs buttons

### Attempted Fixes
None yet - this is a newly identified issue.

### Current Status
**Not Fixed** - Badges still lack orange variant, size standardization, and redundancy removal is pending.

### Required Improvements

#### 1. Add Orange Badge Variant
Add a new `orange` or `warning` variant to the badge component that uses the brand orange color:
```typescript
orange: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
// or
warning: "border-transparent bg-warning text-warning-foreground [a&]:hover:bg-warning/90",
```

#### 2. Standardize Badge Sizes
Add a size system similar to buttons:
```typescript
sizes: {
  sm: "px-1.5 py-0.5 text-xs",
  default: "px-2 py-0.5 text-xs", // current default
  lg: "px-3 py-1 text-sm",
  icon: "size-6 p-1" // for icon-only badges
}
```

#### 3. Remove Badge/Button Redundancy
Identify and remove instances where:
- Badges are used as action buttons (should be Button components)
- Both badges and buttons exist for the same action
- Badges are used where buttons would be more semantically correct

### Related Files
- `src/shared/components/ui/badge.tsx` - Badge component definition
- `src/shared/components/ui/button.tsx` - Button component for comparison
- `src/shared/components/layout/DesktopLayout.tsx` - Example of custom badge sizing
- `src/domains/games/components/GameDetails.tsx` - Example usage
- `src/domains/games/components/RSVPSection.tsx` - Badge usage examples
- `src/domains/games/components/AttendeeList.tsx` - Badge usage examples

### Implementation Steps
1. Add orange/warning variant to `badgeVariants` in `badge.tsx`
2. Add size variants to `badgeVariants` (sm, default, lg, icon)
3. Update Badge component to accept a `size` prop
4. Audit codebase for badge usage inconsistencies
5. Replace custom badge sizing classes with standardized size prop
6. Identify and remove redundant badge+button combinations
7. Update Design System documentation with badge usage guidelines

### Design System Recommendations
- **Badges** should be used for: status indicators, tags, labels, counts
- **Buttons** should be used for: actions, navigation, form submissions
- **Size consistency**: Use `sm` for inline text, `default` for most cases, `lg` for emphasis
- **Color consistency**: Use variants (default=orange, secondary=blue, destructive=red) rather than custom classes

---

## Adding New Known Issues

When documenting new issues, please include:
1. **Issue Description** - What the problem is
2. **Symptoms** - How it manifests
3. **Root Cause** - What's causing it (if known)
4. **Attempted Fixes** - What was tried
5. **Current Solution** - What's in place now
6. **If Issue Returns** - Troubleshooting steps
7. **Related Files** - Where the code lives

