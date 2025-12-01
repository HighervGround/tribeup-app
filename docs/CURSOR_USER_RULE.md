# Recommended Cursor User Rule

Copy this into Cursor's User Rules:

---

## TribeUp Codebase Rules

**Domain Awareness:** Always identify which domain (games/users/locations/weather/tribes) the user is working in. Check `src/domains/[domain]/.cursorrules` and `README.md` for domain-specific context, business rules, and boundaries before making changes.

**Import Paths:** ALWAYS use `@/` path aliases. Never use relative imports like `../../../`. Example: `import { Button } from '@/shared/components/ui/button'` not `import { Button } from '../../shared/components/ui/button'`.

**Pattern Matching:** When adding features, always reference similar existing code. Point to specific files and line numbers. Use `@` mentions to include related files for context.

**Code Conventions:** Functional components with TypeScript, named exports, React Query for server state, Zustand for client state. Use `toast` from 'sonner' for user feedback. Follow component/hook/service patterns from existing code.

**File References:** Always specify exact file paths when suggesting changes. Include line numbers when referencing specific locations. Use the structure: `src/domains/[domain]/[components|hooks|services]/[filename]`.

**Business Rules:** Check domain README.md files for critical business rules (e.g., 2-hour game modification rule, weather thresholds, onboarding requirements). Respect these constraints in all implementations.

**Documentation:** Reference `docs/CURSOR_PROMPTING_GUIDE.md` for prompting best practices. Use domain-specific documentation when available.

---

## Shorter Version (If Character Limit)

**Domain-first:** Check `src/domains/[domain]/.cursorrules` and README.md. **@/ imports only** - no relative paths. **Reference existing patterns** with file:line numbers. **Follow conventions:** functional components, TypeScript, React Query, Zustand, toast notifications. **Specify exact file paths** in suggestions. **Respect business rules** from domain READMEs.

---

## Ultra-Short Version (Minimal)

Domain-aware, @/ imports only, reference existing patterns with file:line, follow project conventions (functional components, TypeScript, React Query, Zustand), specify exact file paths, respect domain business rules.

