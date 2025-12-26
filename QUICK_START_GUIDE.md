# MOVED: Quick Start Guide
The active Quick Start Guide now lives at `docs/QUICK_START_GUIDE.md`.

This root stub remains temporarily to avoid breaking any bookmarked paths. Update links or references to point to the `docs/` version which includes the latest reorganized domain prompts and usage patterns.

Highlights in the new version:
- Domain‑driven structure overview
- AI prompt examples per domain
- Import alias guidance
- Troubleshooting & circular dependency mitigation

Please remove this stub after all consumers are updated.

Last updated: Nov 2025 consolidation.

### 2. Domain-Driven Organization
Your code is now organized by business domain:

```
src/domains/
  ├── games/      # 🎮 Game Management (your core feature)
  ├── weather/    # ⛅ Weather Integration
  ├── locations/  # 📍 Location Services
  └── users/      # 👤 User Engagement

src/shared/       # 🔄 Reusable across domains
src/core/         # ⚙️ App infrastructure
```

### 3. Rich AI Context
Every domain now has:
- **README.md** - Business logic, rules, database schema
- **.cursorrules** - AI coding patterns, common issues, solutions

## 🚀 To Complete the Reorganization

### Step 1: Test the Build
```bash
npm run build
```

Fix any compilation errors (there will likely be a few).

### Step 2: Test in Development
```bash
npm run dev
```

Verify the app works correctly.

## 🤖 Using AI Code Generation

### Before (Problems)
❌ AI loaded irrelevant files
❌ Confused by scattered code
❌ No domain context
❌ Relative path mess

### After (Benefits)
✅ Load only relevant domain
✅ Clear boundaries
✅ Rich context from .cursorrules
✅ Clean @/ imports

### Example AI Prompts

**For Games:**
```
Load src/domains/games/.cursorrules

"Add a 'repeat weekly' feature to game creation"
```

**For Weather:**
```
Load src/domains/weather/.cursorrules

"Add weather alerts 24 hours before game time"
```

**For Locations:**
```
Load src/domains/locations/.cursorrules

"Add route planning from user location to game venue"
```

## 📁 Where Things Are Now

### Components
| What | Where |
|------|-------|
| Game creation/details | `src/domains/games/components/` |
| Weather widgets | `src/domains/weather/components/` |
| Maps | `src/domains/locations/components/` |
| User profiles | `src/domains/users/components/` |
| UI components (buttons, dialogs) | `src/shared/components/ui/` |
| Layout (nav, etc) | `src/shared/components/layout/` |
| Auth screens | `src/core/auth/` |

### Hooks
| What | Where |
|------|-------|
| Game actions | `src/domains/games/hooks/` |
| Location tracking | `src/domains/locations/hooks/` |
| User profile | `src/domains/users/hooks/` |
| Shared utilities | `src/shared/hooks/` |

### Services
| What | Where |
|------|-------|
| Game database ops | `src/domains/games/services/` |
| Weather API | `src/domains/weather/services/` |
| Venue management | `src/domains/locations/services/` |
| User profiles | `src/domains/users/services/` |
| Supabase client | `src/core/database/` |

## 💡 Import Pattern

**Always use `@/` aliases:**

```typescript
// ✅ CORRECT
import { CreateGame } from '@/domains/games/components/CreateGame';
import { useLocation } from '@/domains/locations/hooks/useLocation';
import { Button } from '@/shared/components/ui/button';
import { supabase } from '@/core/database/supabase';

// ❌ WRONG (don't use relative paths)
import { CreateGame } from '../../domains/games/components/CreateGame';
import { Button } from '../../../shared/components/ui/button';
```

## 🎯 Quick Reference

### Working on Games
1. Load: `src/domains/games/.cursorrules`
2. Components: `src/domains/games/components/`
3. Context: `src/domains/games/README.md`
4. **Key Rule**: 2-hour modification restriction

### Working on Weather
1. Load: `src/domains/weather/.cursorrules`
2. Service: `src/domains/weather/services/weatherService.ts`
3. Context: `src/domains/weather/README.md`
4. **Key Rule**: Sport-specific thresholds

### Working on Locations
1. Load: `src/domains/locations/.cursorrules`
2. Components: `src/domains/locations/components/`
3. Context: `src/domains/locations/README.md`
4. **Key Rule**: Use Haversine for distance

### Working on Users
1. Load: `src/domains/users/.cursorrules`
2. Components: `src/domains/users/components/`
3. Context: `src/domains/users/README.md`
4. **Key Rule**: Onboarding required before app access

## 🆘 Troubleshooting

### Build Errors After Import Update
**Problem:** Module not found errors
**Solution:** 
1. Check path alias in error message
2. Verify file exists at that location
3. Ensure tsconfig.json has `"@/*": ["./src/*"]`
4. Restart TypeScript server in VS Code

### AI Not Understanding Context
**Problem:** AI generates code not matching your patterns
**Solution:**
1. Explicitly load the domain .cursorrules
2. Reference the README.md for that domain
3. Include relevant business rules in your prompt

### Circular Dependencies
**Problem:** Import cycle detected
**Solution:**
1. Create shared types file
2. Move interface to separate file
3. Use dependency injection pattern

## 📞 Need Help?

1. Check `REORGANIZATION_SUMMARY.md` for detailed status
2. Review domain README for business logic
3. Check domain .cursorrules for patterns
4. Root `.cursorrules` has overall architecture

## 🎉 You're Ready!

Your codebase is now optimized for AI-assisted development. Each domain is self-contained with rich context, making it easier for AI to:
- Generate relevant code
- Follow your patterns
- Understand business rules
- Produce higher quality suggestions

Happy coding! 🚀

