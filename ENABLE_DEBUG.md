# Enable Debug Logging

## Step 1: Enable Debug Mode

Open browser console (F12) and run:

```javascript
window.__debugCapacity = true;
```

Then refresh the page. You'll see logs like:

```
🎯 GameCapacity render: {
  props: {
    currentPlayers: 1,
    publicRsvpCount: 1,
    totalPlayers: 2,
    availableSpots: 8,
    maxPlayers: 10
  },
  computed: {
    total: 2,
    available: 8
  },
  displayWillShow: "2/10",
  publicBadge: "+1 public"
}
```

## Step 2: Check What You See

### If props are CORRECT but display is WRONG:
- `totalPlayers: 2` ✅
- `publicRsvpCount: 1` ✅
- Display shows: "Players (1/10) +2 public RSVPs" ❌

**Problem**: Something else is rendering, not `GameCapacity`

### If props are WRONG:
- `totalPlayers: undefined` or `1` ❌
- `publicRsvpCount: 2` ❌

**Problem**: Data transform is broken or wrong fields passed

## Step 3: Find What's Actually Displaying

Search your codebase for where "Players (" is rendered:

```bash
grep -r "Players (" src/components/
```

If you find multiple places, some might not be using `GameCapacity`.

## Step 4: Check Game Object

```javascript
// Get the game object from the card
const gamesData = window.queryClient?.getQueryData(['games', 'list']);
const game = gamesData?.[0];

console.log('Game object:', {
  currentPlayers: game.currentPlayers,
  publicRsvpCount: game.publicRsvpCount,
  totalPlayers: game.totalPlayers,
  availableSpots: game.availableSpots
});
```

Expected:
```
currentPlayers: 1
publicRsvpCount: 1
totalPlayers: 2
availableSpots: 8
```

If `totalPlayers` is missing, the transform is broken.
If `publicRsvpCount` is 2, something is doubling it.

## Step 5: Quick Fix

If you can't find the issue, temporarily force correct values in `GameCapacity.tsx`:

```typescript
// TEMPORARY DEBUG: Force use of totalPlayers
const total = totalPlayers !== undefined 
  ? totalPlayers 
  : (currentPlayers + publicRsvpCount);

console.log('⚠️ Using total:', total, 'from totalPlayers:', totalPlayers);
```

This will show if the component has the right data but isn't using it.

