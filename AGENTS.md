# TribeUp Agent Instructions

## Domain-Driven Architecture
Code is organized by business domain. Always identify which domain you're working in and check:
- `src/domains/[domain]/.cursorrules` - Domain-specific rules
- `src/domains/[domain]/README.md` - Domain documentation and business rules

## Import Paths
**ALWAYS use `@/` path aliases** - never relative imports like `../../../`

## Pattern Matching
Reference similar existing code with specific file paths and line numbers. Use `@` mentions to include related files.

## Code Conventions
- Functional components with TypeScript
- Named exports
- React Query for server state
- Zustand for client state
- Toast notifications for user feedback
- Mobile-first responsive design

## File References
Always specify exact file paths: `src/domains/[domain]/[components|hooks|services]/[filename]`

## Business Rules
Check domain README.md files for critical rules:
- Games: 2-hour modification restriction
- Weather: Sport-specific thresholds
- Users: Onboarding requirements
- Locations: Geospatial calculations

## Error Handling
- Try/catch in async functions
- Toast notifications for user feedback
- Console logging for debugging
- Error boundaries for components

