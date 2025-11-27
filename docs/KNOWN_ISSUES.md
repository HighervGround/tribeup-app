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

## Adding New Known Issues

When documenting new issues, please include:
1. **Issue Description** - What the problem is
2. **Symptoms** - How it manifests
3. **Root Cause** - What's causing it (if known)
4. **Attempted Fixes** - What was tried
5. **Current Solution** - What's in place now
6. **If Issue Returns** - Troubleshooting steps
7. **Related Files** - Where the code lives

