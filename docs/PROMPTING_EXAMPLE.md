# Prompting Example: Before vs After

## ❌ Bad Prompt (Vague, No Context)

```
Add a copy link button
```

**Problems:**
- No file location
- No context about where it should go
- No reference to existing patterns
- No requirements specified

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

## Result

The good prompt provides:
✅ Specific file and line numbers
✅ Reference to similar existing code
✅ Clear requirements
✅ Implementation details
✅ Related files for context
✅ Domain awareness

This results in **better, more accurate code** that follows your patterns!

