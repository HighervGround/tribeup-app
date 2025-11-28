#!/bin/bash

# Generate Cursor agent prompts for GitHub issues
# Usage: ./scripts/generate-cursor-prompts.sh [issue-number]

REPO="HighervGround/React-TribeUp-Social-Sports-App"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/generate-cursor-prompts.sh [issue-number]"
  echo ""
  echo "Available issues:"
  gh issue list --repo "$REPO" --state open --limit 20 --json number,title,labels --jq '.[] | "\(.number) - \(.title) [\(.labels | map(.name) | join(", "))]"'
  exit 1
fi

ISSUE_NUM=$1

# Get issue details
ISSUE=$(gh issue view "$ISSUE_NUM" --repo "$REPO" --json number,title,body,assignees,labels)

TITLE=$(echo "$ISSUE" | jq -r '.title')
BODY=$(echo "$ISSUE" | jq -r '.body')
ASSIGNEES=$(echo "$ISSUE" | jq -r '.assignees | map(.login) | join(", ")')
LABELS=$(echo "$ISSUE" | jq -r '.labels | map(.name) | join(", ")')

echo "=========================================="
echo "Cursor Agent Prompt for Issue #$ISSUE_NUM"
echo "=========================================="
echo ""
echo "Title: $TITLE"
echo "Assignee: $ASSIGNEES"
echo "Labels: $LABELS"
echo ""
echo "---"
echo ""

# Generate prompt based on issue type
if [[ "$TITLE" == *"GDPR"* ]] || [[ "$TITLE" == *"Data Export"* ]]; then
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM @docs/COPILOT_IMPLEMENTATION_PLAN.md @supabase/migrations"
  echo "Implement the GDPR data export feature following the safe approach documented in issue #$ISSUE_NUM."
  echo "Use Edge Function pattern, not restrictive RLS policies."
  echo "Start with Phase 1: Database indexes and unique constraints."
  echo ""
elif [[ "$TITLE" == *"Error Tracking"* ]] || [[ "$TITLE" == *"Sentry"* ]]; then
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM @src/core/monitoring @src/core/config"
  echo "Set up error tracking integration (Sentry) for the TribeUp app."
  echo "Create src/core/monitoring/sentry.ts following our error handling patterns."
  echo "Add Sentry initialization and error boundary components."
  echo ""
elif [[ "$TITLE" == *"Analytics"* ]] || [[ "$TITLE" == *"Monitoring"* ]]; then
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM @src/core/config @src/shared/hooks"
  echo "Integrate analytics and monitoring services."
  echo "Use React Query for data fetching, follow our domain structure."
  echo "Add analytics hooks and tracking utilities."
  echo ""
elif [[ "$TITLE" == *"Push Notification"* ]] || [[ "$TITLE" == *"Web Push"* ]]; then
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM @src/core/notifications @src/core/config"
  echo "Implement web push notifications using the existing notification system."
  echo "Follow the patterns in src/core/notifications/."
  echo "Add service worker registration and push subscription handling."
  echo ""
elif [[ "$TITLE" == *"Onboarding"* ]]; then
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM @src/core/auth/components/OnboardingFlow.tsx @src/domains/users"
  echo "Enhance onboarding with value proposition screen and sport preferences."
  echo "Follow existing onboarding patterns and domain structure."
  echo ""
elif [[ "$TITLE" == *"Organizer"* ]]; then
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM @src/domains/users @src/domains/games @src/shared/components/common"
  echo "Create organizer metrics and badges."
  echo "Use the user stats system and game metrics."
  echo "Follow domain-driven design patterns."
  echo ""
elif [[ "$TITLE" == *"Successful Games"* ]] || [[ "$TITLE" == *"Showcase"* ]]; then
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM @src/domains/games @src/domains/games/.cursorrules"
  echo "Implement successful games showcase feature."
  echo "Follow the game domain patterns and business rules."
  echo "Create game metrics service and showcase component."
  echo ""
elif [[ "$TITLE" == *"Active Users"* ]] || [[ "$TITLE" == *"Highlight"* ]]; then
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM @src/domains/users/components/UserProfile.tsx @src/shared/components/common"
  echo "Add active user badge similar to how achievements are displayed."
  echo "Use the same Badge component and styling patterns."
  echo "Create activity tracking service."
  echo ""
elif [[ "$TITLE" == *"Env"* ]] || [[ "$TITLE" == *"Environment"* ]]; then
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM @.env.example @src/core/config"
  echo "Create a script to verify all production environment variables are set."
  echo "Check against the .env.example file and Supabase dashboard."
  echo "Add validation and documentation."
  echo ""
else
  echo "Recommended Cursor Prompt:"
  echo ""
  echo "@issue #$ISSUE_NUM"
  echo "Implement: $TITLE"
  echo ""
  echo "Follow our project patterns:"
  echo "- Use @/ path aliases"
  echo "- Follow domain-driven design"
  echo "- Reference .cursorrules files"
  echo "- Use TypeScript and React best practices"
  echo ""
fi

echo "---"
echo ""
echo "Issue Details:"
echo "$BODY" | head -30
echo ""
echo "Full issue: https://github.com/$REPO/issues/$ISSUE_NUM"

