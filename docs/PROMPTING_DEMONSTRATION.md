# Prompting Demonstration - Real Example

## The Task
Add a "Copy Link" button to GameDetails that copies the game URL to clipboard.

---

## ❌ Bad Prompt (What NOT to do)

```
Add a copy link button
```

**Result:** AI has to guess:
- Where to add it?
- What styling to use?
- What icon to use?
- How to handle errors?
- What pattern to follow?

---

## ✅ Good Prompt (Using Our Techniques)

```
I'm working in the games domain.

Context:
- Current file: src/domains/games/components/GameDetails.tsx
- Related: Share button (line 859-868), handleShare function (line 602-604)
- Similar pattern: Share button uses Share icon and opens ShareGameModal
- Domain rules: Must follow existing button styling patterns

Task:
Add a "Copy Link" button next to the Share button in the header

Requirements:
- Should copy the game URL to clipboard
- Should show toast notification on success/error
- Should use the same button styling as Share button (ghost variant, icon size)
- Should use Copy icon from lucide-react (import Copy)
- Should use useDeepLinks hook's generateGameUrl function (already imported)
- Should be accessible (aria-label, title attribute)

Implementation details:
- Add Copy import to lucide-react imports (line 18-37)
- Add button next to Share button in header (around line 858-868)
- Create handleCopyLink function similar to handleShare pattern
- Use toast.success() for success, toast.error() for errors
- Use navigator.clipboard.writeText() for copying
- Follow the same button structure as Share button

Related files:
- @GameDetails.tsx - Main file to modify
- @useDeepLinks.ts - Has generateGameUrl function
- @ShareGameModal.tsx - Reference for share functionality pattern
```

---

## Implementation Result

### Changes Made:

1. **Added Copy icon import** (line 37):
```typescript
import { Copy } from 'lucide-react';
```

2. **Added generateGameUrl to hook destructuring** (line 109):
```typescript
const { shareGame, navigateToChat, navigateToUser, generateGameUrl } = useDeepLinks();
```

3. **Created handleCopyLink function** (after handleShare):
```typescript
const handleCopyLink = async () => {
  if (!gameId) return;
  
  try {
    const gameUrl = generateGameUrl(gameId);
    await navigator.clipboard.writeText(gameUrl);
    toast.success('Link copied to clipboard!', {
      description: 'Share this link with others to invite them to the game',
    });
  } catch (error) {
    console.error('Failed to copy link:', error);
    toast.error('Failed to copy link', {
      description: 'Please try again',
    });
  }
};
```

4. **Added Copy Link button** (before Share button):
```typescript
<Button 
  variant="ghost" 
  size="icon" 
  onClick={handleCopyLink}
  data-action="copy-link"
  aria-label="Copy game link"
  title="Copy game link to clipboard"
>
  <Copy className="w-5 h-5" />
</Button>
```

---

## Why This Works

✅ **Specific file and line numbers** - AI knows exactly where to make changes
✅ **Reference to existing code** - Follows established patterns
✅ **Clear requirements** - No ambiguity about what's needed
✅ **Implementation details** - Specific functions and patterns to use
✅ **Related files** - Context for additional context
✅ **No linter errors** - Code follows project conventions

---

## Key Takeaways

1. **Be specific** - File paths, line numbers, function names
2. **Reference patterns** - Point to similar existing code
3. **List requirements** - Don't leave things to interpretation
4. **Provide context** - Related files, domain rules, constraints
5. **Specify implementation** - Functions, libraries, patterns to use

---

## Try It Yourself

The feature is now implemented! You can:
1. Test it in the app
2. Use this as a template for future prompts
3. Reference this example when structuring your prompts

**Next time you need a feature, use this structure!**

