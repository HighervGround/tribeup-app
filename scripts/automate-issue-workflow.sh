#!/bin/bash

# Automated Cursor Agent Workflow for GitHub Issues
# This script automates the entire workflow for working on GitHub issues with Cursor

set -e

REPO="HighervGround/React-TribeUp-Social-Sports-App"
ISSUES_DIR="docs/issues"
CURSOR_PROMPTS_DIR=".cursor/prompts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Create directories if they don't exist
mkdir -p "$ISSUES_DIR"
mkdir -p "$CURSOR_PROMPTS_DIR"

# Function to fetch and setup an issue
setup_issue() {
    local issue_num=$1
    local create_branch=${2:-false}
    
    print_info "Setting up issue #$issue_num..."
    
    # Fetch issue details
    local issue_json=$(gh issue view "$issue_num" --repo "$REPO" --json number,title,body,assignees,labels,state,url)
    
    if [ -z "$issue_json" ]; then
        print_error "Failed to fetch issue #$issue_num"
        return 1
    fi
    
    local title=$(echo "$issue_json" | jq -r '.title')
    local body=$(echo "$issue_json" | jq -r '.body')
    local assignees=$(echo "$issue_json" | jq -r '.assignees | map(.login) | join(", ")')
    local labels=$(echo "$issue_json" | jq -r '.labels | map(.name) | join(", ")')
    local url=$(echo "$issue_json" | jq -r '.url')
    local state=$(echo "$issue_json" | jq -r '.state')
    
    if [ "$state" != "OPEN" ]; then
        print_warning "Issue #$issue_num is $state, not OPEN"
    fi
    
    # Create issue context file
    local issue_file="$ISSUES_DIR/issue-$issue_num.md"
    cat > "$issue_file" << EOF
# Issue #$issue_num: $title

**URL:** $url  
**Assignee:** $assignees  
**Labels:** $labels  
**State:** $state

---

## Issue Description

$body

---

## Cursor Agent Prompt

\`\`\`
@issue #$issue_num @docs/issues/issue-$issue_num.md
$(generate_cursor_prompt "$issue_num" "$title")
\`\`\`

---

## Implementation Checklist

- [ ] Review issue requirements
- [ ] Set up development environment
- [ ] Implement solution
- [ ] Test implementation
- [ ] Update documentation
- [ ] Create pull request

---

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
EOF
    
    print_success "Created issue context: $issue_file"
    
    # Create Cursor prompt file
    local prompt_file="$CURSOR_PROMPTS_DIR/issue-$issue_num.txt"
    generate_cursor_prompt "$issue_num" "$title" > "$prompt_file"
    print_success "Created Cursor prompt: $prompt_file"
    
    # Create branch if requested
    if [ "$create_branch" = "true" ]; then
        local branch_name="issue/$issue_num-$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | cut -c1-50)"
        if git show-ref --verify --quiet refs/heads/"$branch_name"; then
            print_warning "Branch $branch_name already exists"
            git checkout "$branch_name"
        else
            git checkout -b "$branch_name"
            print_success "Created and checked out branch: $branch_name"
        fi
    fi
    
    # Display summary
    echo ""
    print_success "Issue #$issue_num setup complete!"
    echo ""
    echo "📄 Issue Context: $issue_file"
    echo "💬 Cursor Prompt: $prompt_file"
    echo "🔗 Issue URL: $url"
    echo ""
    echo "To start working:"
    echo "  1. Open Cursor"
    echo "  2. Open chat/composer"
    echo "  3. Copy prompt from: $prompt_file"
    echo "  4. Paste into Cursor and start coding!"
    echo ""
}

# Function to generate Cursor prompt based on issue
generate_cursor_prompt() {
    local issue_num=$1
    local title=$2
    
    # Determine prompt based on issue type
    if [[ "$title" == *"GDPR"* ]] || [[ "$title" == *"Data Export"* ]]; then
        cat << EOF
@issue #$issue_num @docs/COPILOT_IMPLEMENTATION_PLAN.md @supabase/migrations @supabase/functions
Implement the GDPR data export feature following the safe approach documented in issue #$issue_num.
Use Edge Function pattern, not restrictive RLS policies.
Start with Phase 1: Database indexes and unique constraints.
Follow our migration naming convention and use IF NOT EXISTS for safety.
EOF
    elif [[ "$title" == *"Error Tracking"* ]] || [[ "$title" == *"Sentry"* ]]; then
        cat << EOF
@issue #$issue_num @src/core/monitoring @src/core/config @.cursorrules
Set up error tracking integration (Sentry) for the TribeUp app.
Create src/core/monitoring/sentry.ts following our error handling patterns.
Add Sentry initialization and error boundary components.
Update environment configuration and documentation.
EOF
    elif [[ "$title" == *"Analytics"* ]] || [[ "$title" == *"Monitoring"* ]]; then
        cat << EOF
@issue #$issue_num @src/core/config @src/shared/hooks @.cursorrules
Integrate analytics and monitoring services.
Use React Query for data fetching, follow our domain structure.
Add analytics hooks and tracking utilities.
Update environment configuration.
EOF
    elif [[ "$title" == *"Push Notification"* ]] || [[ "$title" == *"Web Push"* ]]; then
        cat << EOF
@issue #$issue_num @src/core/notifications @src/core/config @public/sw.js
Implement web push notifications using the existing notification system.
Follow the patterns in src/core/notifications/.
Add service worker registration and push subscription handling.
Update service worker for push notifications.
EOF
    elif [[ "$title" == *"Onboarding"* ]]; then
        cat << EOF
@issue #$issue_num @src/core/auth/components/OnboardingFlow.tsx @src/domains/users @.cursorrules
Enhance onboarding with value proposition screen and sport preferences.
Follow existing onboarding patterns and domain structure.
Use Radix UI components and Tailwind CSS.
EOF
    elif [[ "$title" == *"Organizer"* ]]; then
        cat << EOF
@issue #$issue_num @src/domains/users @src/domains/games @src/shared/components/common @.cursorrules
Create organizer metrics and badges.
Use the user stats system and game metrics.
Follow domain-driven design patterns.
Use @/ path aliases for imports.
EOF
    elif [[ "$title" == *"Successful Games"* ]] || [[ "$title" == *"Showcase"* ]]; then
        cat << EOF
@issue #$issue_num @src/domains/games @src/domains/games/.cursorrules
Implement successful games showcase feature.
Follow the game domain patterns and business rules.
Create game metrics service and showcase component.
Use React Query for data fetching.
EOF
    elif [[ "$title" == *"Active Users"* ]] || [[ "$title" == *"Highlight"* ]]; then
        cat << EOF
@issue #$issue_num @src/domains/users/components/UserProfile.tsx @src/shared/components/common @.cursorrules
Add active user badge similar to how achievements are displayed.
Use the same Badge component and styling patterns.
Create activity tracking service.
Follow existing component patterns.
EOF
    elif [[ "$title" == *"Env"* ]] || [[ "$title" == *"Environment"* ]]; then
        cat << EOF
@issue #$issue_num @.env.example @src/core/config @.cursorrules
Create a script to verify all production environment variables are set.
Check against the .env.example file and Supabase dashboard.
Add validation and documentation.
Create verification script in scripts/ directory.
EOF
    else
        cat << EOF
@issue #$issue_num @.cursorrules
Implement: $title

Follow our project patterns:
- Use @/ path aliases for imports
- Follow domain-driven design structure
- Reference relevant .cursorrules files
- Use TypeScript and React best practices
- Follow mobile-first responsive design
- Use Radix UI components and Tailwind CSS
EOF
    fi
}

# Function to setup all open issues
setup_all_issues() {
    print_info "Setting up all open issues..."
    
    local issues=$(gh issue list --repo "$REPO" --state open --json number,title --limit 50)
    local count=$(echo "$issues" | jq 'length')
    
    print_info "Found $count open issues"
    
    echo "$issues" | jq -r '.[] | "\(.number) - \(.title)"' | while IFS= read -r line; do
        local issue_num=$(echo "$line" | cut -d' ' -f1)
        print_info "Setting up issue #$issue_num..."
        setup_issue "$issue_num" false
        echo ""
    done
    
    print_success "All issues setup complete!"
}

# Function to create a workspace file for Cursor
create_workspace() {
    local issue_num=$1
    local workspace_file=".cursor/workspace-issue-$issue_num.code-workspace"
    
    cat > "$workspace_file" << EOF
{
    "folders": [
        {
            "path": "."
        }
    ],
    "settings": {
        "files.exclude": {
            "**/node_modules": true,
            "**/.git": true
        },
        "files.associations": {
            "*.cursorrules": "markdown"
        }
    },
    "extensions": {
        "recommendations": [
            "dbaeumer.vscode-eslint",
            "esbenp.prettier-vscode",
            "bradlc.vscode-tailwindcss"
        ]
    }
}
EOF
    
    print_success "Created workspace file: $workspace_file"
}

# Main script
main() {
    case "${1:-}" in
        "all")
            setup_all_issues
            ;;
        "list")
            echo "Open issues:"
            gh issue list --repo "$REPO" --state open --limit 50 --json number,title,assignees,labels --jq '.[] | "\(.number) - \(.title) [\(.labels | map(.name) | join(", "))]"'
            ;;
        "workspace")
            if [ -z "$2" ]; then
                print_error "Please provide an issue number"
                exit 1
            fi
            create_workspace "$2"
            ;;
        "")
            if [ -z "$2" ]; then
                print_error "Usage: $0 [issue-number|all|list|workspace] [options]"
                echo ""
                echo "Commands:"
                echo "  [issue-number]    Setup a specific issue (e.g., 40)"
                echo "  all               Setup all open issues"
                echo "  list              List all open issues"
                echo "  workspace [num]   Create workspace file for issue"
                echo ""
                echo "Options:"
                echo "  --branch          Create a git branch for the issue"
                echo ""
                echo "Examples:"
                echo "  $0 40              Setup issue #40"
                echo "  $0 40 --branch     Setup issue #40 and create branch"
                echo "  $0 all              Setup all open issues"
                echo "  $0 list             List all open issues"
                exit 1
            fi
            local issue_num=$1
            local create_branch=false
            
            if [ "$2" = "--branch" ]; then
                create_branch=true
            fi
            
            setup_issue "$issue_num" "$create_branch"
            create_workspace "$issue_num"
            ;;
        *)
            print_error "Unknown command: $1"
            exit 1
            ;;
    esac
}

main "$@"

