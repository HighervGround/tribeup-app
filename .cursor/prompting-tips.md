# Quick Prompting Tips

## 🚀 Quick Start

**Before prompting:**
1. Open the file you want to modify
2. Open related files (Ctrl/Cmd + Click)
3. Open domain `.cursorrules` file
4. Use @ mentions for additional context

**Prompt structure:**
```
Domain: [domain name]
File: [file path]
Task: [what to do]
Pattern: [similar existing code]
Requirements: [specific needs]
```

## 📝 Examples

### Adding a Feature
```
Domain: games
File: GameDetails.tsx
Task: Add cancel button for creators
Pattern: Join button (line 150)
Requirements: 2-hour rule check, confirmation dialog
```

### Fixing a Bug
```
Bug: Participant count not updating
File: GameDetails.tsx:200
Expected: Real-time updates
Related: useGameRealtime.ts
```

### Refactoring
```
Refactor: Extract validation logic
From: CreateGame.tsx
To: utils/gameValidation.ts
Pattern: Follow dateUtils.ts structure
```

## 🎯 Pro Tips

- **Use @ mentions** for files, domains, functions
- **Reference line numbers** for specific locations
- **Mention similar patterns** from existing code
- **Specify requirements** clearly
- **Include constraints** (business rules, etc.)

## 📚 Resources

- Domain rules: `src/domains/[domain]/.cursorrules`
- Full guide: `docs/CURSOR_PROMPTING_GUIDE.md`
- Generate docs: `./scripts/generate-domain-docs.sh [domain]`

