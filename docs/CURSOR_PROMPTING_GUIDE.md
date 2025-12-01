# Cursor Prompting Guide - How to Get Better AI Results

This guide shows you how to structure prompts and provide context to get the best results from Cursor's AI assistant.

## 🎯 Core Principles

### 1. **Provide Domain Context First**
Always reference the domain you're working in:

```
I'm working in the games domain. Add a feature to allow game creators to set a skill level requirement.
```

**Better:**
```
I'm working in the games domain (src/domains/games/). 
Looking at CreateGame.tsx and useGameActions.ts, add a skill level selector 
that filters games by skill level (beginner, intermediate, advanced).
```

### 2. **Reference Existing Patterns**
Point to similar code that works:

```
Add a new button component similar to the join button in GameDetails.tsx
```

**Better:**
```
In GameDetails.tsx, there's a join button around line 150. Create a similar 
"Share Game" button component that opens ShareGameModal.tsx. Use the same 
styling pattern (orange-600, rounded-lg, etc.)
```

### 3. **Specify File Locations**
Always mention where code should go:

```
Add error handling for game creation
```

**Better:**
```
In src/domains/games/hooks/useGameActions.ts, add try/catch error handling 
to the createGame function. Show toast notifications using the toast utility 
from @/shared/utils/toast (similar to how it's done in GameDetails.tsx line 200).
```

---

## 📁 File Selection Strategy

### Before Prompting: Select Relevant Files

**DO:**
- Open the file you want to modify
- Select related files (Ctrl/Cmd + Click)
- Include domain `.cursorrules` file
- Include similar components for reference

**Example:**
```
Files open:
- src/domains/games/components/CreateGame.tsx (main file)
- src/domains/games/hooks/useGameActions.ts (related hook)
- src/domains/games/.cursorrules (domain context)
```

### Use Cursor's @ Mentions

**@-mention files for context:**
```
@CreateGame.tsx @useGameActions.ts 
Add validation to prevent creating games in the past. 
Use the same validation pattern from GameDetails.tsx
```

**@-mention domains:**
```
@domains/games 
Add a feature to show weather forecast when creating outdoor games.
Reference WeatherWidget.tsx from @domains/weather
```

---

## 🏗️ Prompt Structure Templates

### Template 1: Feature Addition

```
I'm working in [DOMAIN] domain.

Context:
- Current file: [FILE_PATH]
- Related files: [FILE1, FILE2]
- Similar pattern: [EXISTING_COMPONENT]

Task:
[What you want to add]

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Constraints:
- Must follow [PATTERN/CONVENTION]
- Must use [LIBRARY/UTILITY]
- Must not break [EXISTING_FEATURE]
```

**Example:**
```
I'm working in the games domain.

Context:
- Current file: src/domains/games/components/GameDetails.tsx
- Related files: src/domains/games/hooks/useGameActions.ts
- Similar pattern: Join button (line 150)

Task:
Add a "Report Game" button next to the join button

Requirements:
- Only visible to participants
- Opens a modal with report reasons
- Sends report to moderation service

Constraints:
- Must use existing Button component from @/shared/components/ui/button
- Must follow error handling pattern from useGameActions
- Must use toast notifications for success/error
```

### Template 2: Bug Fix

```
Bug: [DESCRIPTION]

Location: [FILE_PATH:LINE_NUMBER]

Current behavior: [WHAT HAPPENS]
Expected behavior: [WHAT SHOULD HAPPEN]

Related files:
- [FILE1] - [HOW IT'S RELATED]
- [FILE2] - [HOW IT'S RELATED]

Additional context:
[Any relevant business rules, edge cases, etc.]
```

**Example:**
```
Bug: Game participant count doesn't update in real-time

Location: src/domains/games/components/GameDetails.tsx:200

Current behavior: Count only updates on page refresh
Expected behavior: Count updates immediately when someone joins

Related files:
- useGameRealtime.ts - Has real-time subscription setup
- useGameParticipants.ts - Fetches participant data

Additional context:
- Real-time subscription exists but may not be triggering updates
- Check if query invalidation is happening correctly
```

### Template 3: Refactoring

```
Refactor: [WHAT TO REFACTOR]

Current issues:
- [ISSUE 1]
- [ISSUE 2]

Target files:
- [FILE1] - [WHAT TO CHANGE]
- [FILE2] - [WHAT TO CHANGE]

Pattern to follow:
- Reference: [EXISTING_GOOD_PATTERN]
- Use: [LIBRARY/PATTERN]

Preserve:
- [FEATURE 1] must still work
- [FEATURE 2] must still work
```

---

## 🎨 Domain-Specific Prompting

### Games Domain

**Always mention:**
- 2-hour rule (can't modify games within 2 hours)
- Real-time updates requirement
- Optimistic updates for join/leave

**Example:**
```
In the games domain, modify GameDetails.tsx to show a warning 
when a game is within 2 hours of start time. Use the same pattern 
from CreateGame.tsx that checks canModifyGame(). Show an Alert 
component (from @/shared/components/ui/alert) with orange styling.
```

### Users Domain

**Always mention:**
- Onboarding requirements
- Privacy settings
- Achievement tracking

**Example:**
```
In the users domain, add a privacy toggle in Settings.tsx to 
control whether achievements are visible to other users. 
Update useUserProfile.ts to include privacy settings, and 
modify OtherUserProfile.tsx to respect the privacy setting.
```

### Locations Domain

**Always mention:**
- Google Maps integration
- Geocoding patterns
- Distance calculations

**Example:**
```
In the locations domain, enhance LocationPicker.tsx to show 
driving distance and time to selected location. Use the 
routesApi.ts service and display the info in a Card component 
below the map.
```

---

## 🔧 Using Generated Documentation

### For Complex Features

1. **Generate domain docs first:**
   ```bash
   ./scripts/generate-domain-docs.sh games
   ```

2. **Reference in prompt:**
   ```
   I've generated the games domain documentation. 
   Review DOMAIN_GAMES_DOCUMENTATION.md and add a feature to 
   allow game creators to set custom rules for their games.
   ```

### For API Changes

1. **Generate API docs:**
   ```bash
   ./scripts/generate-api-docs.sh
   ```

2. **Use in prompt:**
   ```
   Review API_SERVICES_DOCUMENTATION.md. I need to add a new 
   endpoint for game statistics. Follow the pattern from 
   gameParticipantService.ts.
   ```

### For Hook Patterns

1. **Generate hooks docs:**
   ```bash
   ./scripts/generate-hooks-docs.sh
   ```

2. **Reference patterns:**
   ```
   Looking at HOOKS_DOCUMENTATION.md, create a new hook 
   useGameStatistics that follows the same pattern as 
   useGameParticipants but fetches statistics data.
   ```

---

## 💡 Advanced Prompting Techniques

### 1. Multi-Step Tasks

Break complex tasks into steps:

```
Step 1: Create the database migration for game_statistics table
Step 2: Add the service function in gameParticipantService.ts
Step 3: Create useGameStatistics hook following useGameParticipants pattern
Step 4: Add StatisticsCard component to GameDetails.tsx
Step 5: Add real-time subscription for statistics updates
```

### 2. Comparison Prompts

Compare with existing code:

```
Compare the error handling in useGameActions.ts with useUserProfile.ts. 
Apply the better pattern to useGameActions.ts, ensuring we maintain 
the optimistic update behavior.
```

### 3. Pattern Application

Apply patterns from one area to another:

```
The games domain has a good real-time subscription pattern in 
useGameRealtime.ts. Apply the same pattern to the users domain 
for user presence tracking in useUserPresence.ts.
```

### 4. Constraint-Based Prompts

Set clear boundaries:

```
Add a feature to filter games by distance, but:
- Must not break existing search functionality
- Must use existing location utilities from @/domains/locations
- Must cache results for 5 minutes
- Must work on mobile (test at 375px width)
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Too Vague
```
Make the button better
```

### ✅ Specific
```
In GameDetails.tsx line 150, change the join button to:
- Use orange-700 instead of orange-600 for better contrast
- Add a loading spinner when joining
- Disable button during join operation
- Show success toast on completion
```

### ❌ Missing Context
```
Add error handling
```

### ✅ With Context
```
In src/domains/games/hooks/useGameActions.ts, the createGame 
function (line 45) doesn't have error handling. Add try/catch 
with toast notifications, following the pattern from 
GameDetails.tsx handleJoinGame function (line 200).
```

### ❌ No File References
```
Create a new component
```

### ✅ With References
```
Create a new GameStatistics component in 
src/domains/games/components/GameStatistics.tsx. 
Use the same styling as GameCard.tsx, fetch data using 
useGameStatistics hook (create this hook following the 
pattern from useGameParticipants.ts), and display stats 
in a Card component from @/shared/components/ui/card.
```

---

## 📋 Prompt Checklist

Before sending a prompt, check:

- [ ] Mentioned the domain you're working in
- [ ] Referenced specific files (with paths)
- [ ] Included line numbers for specific locations
- [ ] Referenced similar existing patterns
- [ ] Specified requirements clearly
- [ ] Mentioned constraints/business rules
- [ ] Included related files in context
- [ ] Used @ mentions for additional context
- [ ] Specified styling/component library to use
- [ ] Mentioned error handling requirements

---

## 🎓 Example: Complete Good Prompt

```
I'm working in the games domain.

Context:
- Current file: src/domains/games/components/GameDetails.tsx
- Related: src/domains/games/hooks/useGameActions.ts
- Similar pattern: Join button (GameDetails.tsx:150-180)
- Domain rules: 2-hour modification restriction applies

Task:
Add a "Cancel Game" button for game creators

Requirements:
- Only visible to game creator
- Only enabled if game is more than 2 hours away
- Shows confirmation dialog before canceling
- Sends cancellation notification to all participants
- Updates game status to 'cancelled' in database
- Redirects to home page after cancellation

Implementation details:
- Use AlertDialog from @/shared/components/ui/alert-dialog
- Use same button styling as join button (orange-600, rounded-lg)
- Add cancelGame function to useGameActions.ts
- Use toast.success() for confirmation
- Use toast.error() for failures
- Follow error handling pattern from handleJoinGame
- Must check 2-hour rule using canModifyGame() utility

Related files to consider:
- @domains/games/hooks/useGameActions.ts - Add cancelGame function
- @domains/games/services/gameParticipantService.ts - May need notification logic
- @core/notifications/notificationService.ts - For participant notifications
```

---

## 🔄 Iterative Prompting

### First Prompt: High-Level
```
Add a cancel game feature for creators
```

### Second Prompt: Refine
```
The cancel button should check the 2-hour rule and show a confirmation dialog
```

### Third Prompt: Fix Issues
```
The confirmation dialog isn't showing. Check AlertDialog usage in InviteModal.tsx
```

### Best Approach: Comprehensive First Prompt
```
[Use the complete prompt template above]
```

---

## 📚 Additional Resources

- **Domain Rules**: Check `src/domains/[domain]/.cursorrules`
- **Project Rules**: See `.cursorrules` in root
- **Domain Docs**: `src/domains/[domain]/README.md`
- **Generated Docs**: Use scripts in `scripts/generate-*.sh`
- **Component Library**: `src/shared/components/COMPONENT_LIBRARY.md`

---

## 🎯 Quick Reference

**For new features:**
1. Mention domain
2. Reference similar code
3. Specify file locations
4. List requirements
5. Mention constraints

**For bug fixes:**
1. Describe the bug clearly
2. Provide file:line location
3. Show expected vs actual
4. Reference related files

**For refactoring:**
1. Explain current issues
2. Show target pattern
3. List files to change
4. Specify what to preserve

---

*Remember: The more context you provide, the better the AI can help you!*

