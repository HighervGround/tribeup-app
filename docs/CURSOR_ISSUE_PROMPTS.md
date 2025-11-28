# Cursor Agent Prompts for Outstanding Issues

Quick reference for using Cursor agents with GitHub issues.

---

## 🚀 Quick Start

1. **Generate a prompt for any issue:**
   ```bash
   ./scripts/generate-cursor-prompts.sh [issue-number]
   ```

2. **Copy the prompt and paste into Cursor chat/composer**

3. **Cursor will read the issue and generate code following your patterns**

---

## 📋 P0 Critical Issues

### Issue #40 - GDPR Data Export Feature
```bash
./scripts/generate-cursor-prompts.sh 40
```

**Cursor Prompt:**
```
@issue #40 @docs/COPILOT_IMPLEMENTATION_PLAN.md @supabase/migrations
Implement the GDPR data export feature following the safe approach documented in issue #40.
Use Edge Function pattern, not restrictive RLS policies.
Start with Phase 1: Database indexes and unique constraints.
```

**Key Context:**
- @supabase/functions - For Edge Function
- @src/domains/users/components - For UI component
- @docs/COPILOT_IMPLEMENTATION_PLAN.md - For full implementation plan

---

### Issue #27 - Production Env Vars Verification
```bash
./scripts/generate-cursor-prompts.sh 27
```

**Cursor Prompt:**
```
@issue #27 @.env.example @src/core/config
Create a script to verify all production environment variables are set.
Check against the .env.example file and Supabase dashboard.
Add validation and documentation.
```

**Key Context:**
- @src/core/config - Existing config patterns
- @.env.example - Reference file

---

### Issue #25 - Error Tracking (Sentry)
```bash
./scripts/generate-cursor-prompts.sh 25
```

**Cursor Prompt:**
```
@issue #25 @src/core/monitoring @src/core/config
Set up error tracking integration (Sentry) for the TribeUp app.
Create src/core/monitoring/sentry.ts following our error handling patterns.
Add Sentry initialization and error boundary components.
```

**Key Context:**
- @src/core/config - For environment setup
- @src/shared/components - For error boundaries

---

### Issue #24 - Analytics/Monitoring
```bash
./scripts/generate-cursor-prompts.sh 24
```

**Cursor Prompt:**
```
@issue #24 @src/core/config @src/shared/hooks
Integrate analytics and monitoring services.
Use React Query for data fetching, follow our domain structure.
Add analytics hooks and tracking utilities.
```

**Key Context:**
- @src/shared/hooks - For analytics hooks
- @src/core/config - For service configuration

---

## 🔥 P1 High Priority Issues

### Issue #39 - Web Push Notifications
```bash
./scripts/generate-cursor-prompts.sh 39
```

**Cursor Prompt:**
```
@issue #39 @src/core/notifications @src/core/config
Implement web push notifications using the existing notification system.
Follow the patterns in src/core/notifications/.
Add service worker registration and push subscription handling.
```

**Key Context:**
- @src/core/notifications - Existing notification patterns
- @public/sw.js - Service worker file

---

### Issue #22 - Data Export (GDPR)
```bash
./scripts/generate-cursor-prompts.sh 22
```

**Note:** This is covered by issue #40. Reference #40 for implementation.

---

## 🎨 P2 Enhancement Issues

### Issue #32 - Onboarding Enhancements
```bash
./scripts/generate-cursor-prompts.sh 32
```

**Cursor Prompt:**
```
@issue #32 @src/core/auth/components/OnboardingFlow.tsx @src/domains/users
Enhance onboarding with value proposition screen and sport preferences.
Follow existing onboarding patterns and domain structure.
```

**Key Context:**
- @src/core/auth/components - Onboarding components
- @src/domains/users - User preferences

---

### Issue #31 - Feature Game Organizers
```bash
./scripts/generate-cursor-prompts.sh 31
```

**Cursor Prompt:**
```
@issue #31 @src/domains/users @src/domains/games @src/shared/components/common
Create organizer metrics and badges.
Use the user stats system and game metrics.
Follow domain-driven design patterns.
```

**Key Context:**
- @src/domains/users/services - For metrics
- @src/shared/components/common - For badge components

---

### Issue #30 - Showcase Successful Games
```bash
./scripts/generate-cursor-prompts.sh 30
```

**Cursor Prompt:**
```
@issue #30 @src/domains/games @src/domains/games/.cursorrules
Implement successful games showcase feature.
Follow the game domain patterns and business rules.
Create game metrics service and showcase component.
```

**Key Context:**
- @src/domains/games/services - For metrics
- @src/domains/games/components - For showcase UI

---

### Issue #29 - Highlight Active Users
```bash
./scripts/generate-cursor-prompts.sh 29
```

**Cursor Prompt:**
```
@issue #29 @src/domains/users/components/UserProfile.tsx @src/shared/components/common
Add active user badge similar to how achievements are displayed.
Use the same Badge component and styling patterns.
Create activity tracking service.
```

**Key Context:**
- @src/domains/users/services - For activity tracking
- @src/shared/components/common - For badge components

---

### Issue #28 - Automated Testing (Post-Launch)
```bash
./scripts/generate-cursor-prompts.sh 28
```

**Note:** Deferred to post-launch. Not urgent.

---

## 🎯 General Workflow

### Step 1: Generate Prompt
```bash
./scripts/generate-cursor-prompts.sh [issue-number]
```

### Step 2: Copy Prompt to Cursor
- Open Cursor chat or composer
- Paste the generated prompt
- Add any additional context files with `@`

### Step 3: Review Generated Code
- Check it follows project patterns
- Verify `@/` imports are used
- Ensure domain structure is respected
- Test the implementation

### Step 4: Commit with Issue Reference
```bash
git commit -m "Implement issue #40: GDPR data export

Closes #40
Implements Phase 1: Database indexes and constraints"
```

---

## 📚 Additional Resources

- **Full Workflow Guide:** `docs/CURSOR_AGENT_WORKFLOW.md`
- **Implementation Plan:** `docs/COPILOT_IMPLEMENTATION_PLAN.md`
- **Project Rules:** `.cursorrules` and `src/domains/*/.cursorrules`
- **Domain READMEs:** `src/domains/*/README.md`

---

## 💡 Pro Tips

1. **Always include domain context:**
   ```
   @src/domains/[domain]/.cursorrules
   ```

2. **Reference similar implementations:**
   ```
   @src/domains/users/components/UserProfile.tsx
   ```

3. **Use project rules:**
   ```
   @.cursorrules
   ```

4. **Break down large issues:**
   - Work in phases
   - Test each phase
   - Commit incrementally

---

**Last Updated:** November 28, 2025

