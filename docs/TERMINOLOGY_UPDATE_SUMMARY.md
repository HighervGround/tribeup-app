# Terminology Update: Games → Activities
**Updated:** November 15, 2025

## Overview
Updated all user-facing text to use "activity/activities" instead of "game/games" to match TribeUp's branding. Code variables and database references remain as "game" for consistency with backend.

---

## Files Updated

### 1. **HomeScreen.tsx** ✅
**Section Headers:**
- Today section: `{X} activities` / `{1} activity`
- Tomorrow section: `{X} activities` / `{1} activity`
- This Week section: `{X} activities` / `{1} activity`
- Upcoming section: `{X} activities` / `{1} activity`

**Loading/Error States:**
- "Loading activities..." (was "Loading games...")
- "Activities are taking too long to load..." (was "Games are...")
- "Unable to load activities..." (was "Unable to load games...")

**Empty State:**
- "No campus activities found" (was "No campus games found")
- "No activities yet" (was "No games yet")
- "No activities at UF venues..." (was "No games at...")
- "Be the first to create an activity..." (was "...create a game...")

---

### 2. **CampusEmptyState.tsx** ✅
**Default Props:**
- `title = "No activities yet"` (was "No games yet")
- `description = "Be the first to create an activity..."` (was "...create a game...")

**Button Text:**
- "Create Your First Activity" (was "Create Your First Game")

---

### 3. **FriendList.tsx** ✅
**Friend Suggestions:**
- `{X} activities together` / `{1} activity together` (was "games"/"game")

**Empty State:**
- "Join some activities to find co-players!" (was "Play some games...")

---

## Code Consistency

### Variables/Functions (Unchanged)
These remain as "game" for code consistency:
- `games` array
- `gamesBySection` object
- `game.id`, `game.title`, etc.
- `handleGameSelect()`
- `onJoinLeave()`
- Database tables: `games`, `game_participants`, etc.

### User-Facing Text (Updated)
All visible text now uses "activity/activities":
- Section headers
- Button labels
- Empty state messages
- Loading states
- Error messages
- Badge counts
- Friend activity indicators

---

## Terminology Map

| Old (Code) | Old (UI) | New (UI) |
|------------|----------|----------|
| `game` | "game" | "activity" |
| `games` | "games" | "activities" |
| `gamesBySection` | "games by section" | "activities by section" |
| `gamesWithFriends` | "games with friends" | "activities with friends" |
| `game.title` | "game title" | "activity title" |

---

## User Experience Impact

### Benefits:
1. **Consistent Branding:** Matches "TribeUp" positioning as broader than just games
2. **Inclusive Language:** "Activity" feels more welcoming than "game"
3. **Better Fit:** Covers fitness, social events, not just competitive games
4. **Professional Tone:** "Activity" sounds more organized/legitimate

### Examples in Context:
- ✅ "5 activities today" (was "5 games today")
- ✅ "3 friends joined this activity" (was "...this game")
- ✅ "Create Your First Activity" (was "Create Your First Game")
- ✅ "No campus activities found" (was "No campus games found")

---

## Verification Checklist

- [x] HomeScreen section headers updated
- [x] HomeScreen loading/error states updated
- [x] HomeScreen empty states updated
- [x] CampusEmptyState component updated
- [x] FriendList badge text updated
- [x] FriendList empty state updated
- [x] No linter errors
- [x] Code variables remain as "game" for consistency
- [x] All user-facing text uses "activity/activities"

---

## Future Considerations

### Additional Files to Review (Optional):
- Game detail pages
- Create game form labels
- Email/push notification templates
- Marketing copy
- Help/FAQ sections

### Database Terminology (Keep as "game"):
- Table names: `games`, `game_participants`
- View names: `games_with_counts`, `games_friend_counts`
- Function names: `createGame()`, `joinGame()`
- API endpoints: `/api/games`

**Rationale:** Changing database terminology would require extensive migrations and could break existing integrations. Code-level naming conventions should remain stable.

---

**Status:** ✅ Complete - All user-facing text updated to use "activity/activities"

