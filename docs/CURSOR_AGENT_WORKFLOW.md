# Cursor Agent Workflow for GitHub Issues

This guide shows how to use Cursor's AI agents effectively to work on GitHub issues.

---

## 🚀 Quick Start: Using Cursor with GitHub Issues

### Method 1: Direct Issue Reference (Recommended)

1. **Open the issue in GitHub** and copy the issue number
2. **In Cursor**, use the chat/agent with this prompt format:

```
@issue #40 - Implement the GDPR data export feature following the safe approach documented in the issue. Use the Edge Function pattern, not restrictive RLS policies.
```

3. **Cursor will:**
   - Read the issue content
   - Understand the context
   - Generate code following your project patterns
   - Reference existing codebase structure

### Method 2: Create Issue-Specific Context Files

For complex issues, create a context file that Cursor can reference:

**Example:** `docs/issues/issue-40-gdpr-export.md`
```markdown
# Issue #40: GDPR Data Export

## Requirements
[Copy issue requirements here]

## Implementation Approach
[Copy implementation steps]

## Files to Create/Modify
- supabase/functions/export-user-data/index.ts
- src/domains/users/components/DataExportSection.tsx
```

Then in Cursor:
```
@docs/issues/issue-40-gdpr-export.md - Start implementing Phase 1: Database indexes
```

---

## 📋 Workflow for Each Issue Type

### For P0 Critical Issues

**Issue #40 - GDPR Data Export**
```
@issue #40 @docs/COPILOT_IMPLEMENTATION_PLAN.md 
Implement Phase 1: Add the database indexes and unique constraints. 
Make sure to use IF NOT EXISTS to avoid conflicts.
```

**Issue #27 - Production Env Vars**
```
@issue #27 @.env.example
Create a script to verify all production environment variables are set.
Check against the .env.example file and Supabase dashboard.
```

**Issue #25 - Error Tracking**
```
@issue #25
Set up Sentry integration for error tracking. 
Create src/core/monitoring/sentry.ts following our error handling patterns.
```

**Issue #24 - Analytics/Monitoring**
```
@issue #24
Integrate analytics service. 
Use React Query for data fetching, follow our domain structure.
```

### For P1 High Priority Issues

**Issue #39 - Web Push Notifications**
```
@issue #39 @src/core/notifications
Implement web push notifications using the existing notification system.
Follow the patterns in src/core/notifications/.
```

**Issue #22 - Data Export (Related to #40)**
```
@issue #22 @issue #40
This is covered by issue #40. Close this issue once #40 is complete.
```

### For P2 Enhancement Issues

**Issue #32 - Onboarding Enhancements**
```
@issue #32 @src/core/auth/components/OnboardingFlow.tsx
Enhance onboarding with value proposition screen and sport preferences.
Follow existing onboarding patterns.
```

**Issue #31 - Feature Game Organizers**
```
@issue #31 @src/domains/users @src/domains/games
Create organizer metrics and badges. 
Use the user stats system and game metrics.
```

---

## 🎯 Best Practices

### 1. Use Domain Context
Always reference the relevant domain when working on issues:

```
@src/domains/games/.cursorrules @issue #30
Implement successful games showcase feature.
Follow the game domain patterns and business rules.
```

### 2. Reference Existing Patterns
Point Cursor to similar implementations:

```
@src/domains/users/components/UserProfile.tsx @issue #29
Add active user badge similar to how achievements are displayed.
Use the same Badge component and styling patterns.
```

### 3. Use Project Rules
Reference your `.cursorrules` files:

```
@.cursorrules @src/domains/games/.cursorrules @issue #31
Create organizer metrics following our domain-driven design.
Use @/ path aliases and follow TypeScript patterns.
```

### 4. Break Down Large Issues
For complex issues, work in phases:

**Phase 1:**
```
@issue #40
Implement Phase 1: Database indexes only.
Create migration file: supabase/migrations/YYYYMMDD_add_gdpr_export_indexes.sql
```

**Phase 2:**
```
@issue #40 @supabase/functions
Implement Phase 2: Edge Function for export.
Follow Supabase Edge Function patterns from existing functions.
```

**Phase 3:**
```
@issue #40 @src/domains/users/components
Implement Phase 3: Frontend UI component.
Use Radix UI components and follow our component patterns.
```

---

## 🔧 Setting Up Cursor for Issue Work

### 1. Install GitHub Extension (Optional)
- Install "GitHub Pull Requests and Issues" extension in Cursor
- This allows you to view issues directly in Cursor

### 2. Create Issue Templates
Create `docs/issues/TEMPLATE.md`:
```markdown
# Issue #[NUMBER]: [TITLE]

## Context
[Issue description]

## Implementation Plan
[Steps from issue]

## Files to Modify
- [ ] File 1
- [ ] File 2

## Testing Checklist
- [ ] Test 1
- [ ] Test 2
```

### 3. Use Cursor Composer for Multi-File Changes
For issues that touch multiple files:

```
@issue #40
Use Cursor Composer to implement all three phases:
1. Database migration
2. Edge Function
3. Frontend component

Make sure all files follow our patterns and use @/ imports.
```

---

## 📝 Issue-Specific Prompts

### For Database/Backend Issues

```
@issue #[N] @supabase/migrations
Create a migration following our naming convention.
Check existing migrations for patterns.
Use IF NOT EXISTS for safety.
```

### For Frontend/UI Issues

```
@issue #[N] @src/shared/components/ui
Create component using Radix UI primitives.
Follow mobile-first responsive design.
Use Tailwind CSS utility classes.
```

### For Integration Issues

```
@issue #[N] @src/core/config
Add new service integration.
Follow existing service patterns.
Add to environment config.
Update .env.example.
```

---

## 🎨 Advanced: Multi-Issue Context

For related issues, provide context from multiple sources:

```
@issue #40 @issue #22 @docs/COPILOT_IMPLEMENTATION_PLAN.md
These issues are related. Issue #40 provides the safe implementation approach.
Implement according to #40's plan, which addresses #22's requirements.
```

---

## ✅ Completion Checklist

After implementing an issue:

1. **Test the implementation:**
```
Run the test suite and verify the feature works.
Check mobile responsiveness.
Verify error handling.
```

2. **Update documentation:**
```
@docs/DATABASE_SCHEMA.md
Update schema documentation if database changes were made.
```

3. **Create PR with issue reference:**
```
Closes #[N]
Implements [feature description]
```

---

## 🚨 Troubleshooting

### Cursor Not Understanding Issue Context
- Copy issue body into a local markdown file
- Reference that file: `@docs/issues/issue-N.md`

### Code Not Following Patterns
- Explicitly reference `.cursorrules` files
- Point to similar existing implementations
- Use `@` mentions for specific files

### Missing Domain Context
- Always include relevant domain `.cursorrules`
- Reference domain README files
- Use `@src/domains/[domain]` for context

---

## 📚 Resources

- [Cursor Documentation](https://docs.cursor.com)
- [GitHub Issues API](https://docs.github.com/en/rest/issues)
- Project Rules: `.cursorrules` and `src/domains/*/.cursorrules`
- Implementation Plan: `docs/COPILOT_IMPLEMENTATION_PLAN.md`

---

**Last Updated:** November 28, 2025

