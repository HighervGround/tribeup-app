#!/usr/bin/env bash
#
# Pre-commit hook to prevent committing secrets (API keys, tokens, passwords)
# Install: cp scripts/hooks/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Scanning for secrets...${NC}"

# Patterns to detect (case-insensitive)
PATTERNS=(
    # API Keys
    'VITE_OPENWEATHER_API_KEY\s*=\s*["\047][a-f0-9]{32}'
    'OPENWEATHER.*KEY.*["\047][a-f0-9]{32}'
    
    # Supabase
    'VITE_SUPABASE_ANON_KEY\s*=\s*["\047]eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
    'SUPABASE.*KEY.*["\047]eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
    'SUPABASE.*URL.*["\047]https://[a-z0-9-]+\.supabase\.co'
    
    # Generic secrets
    'api[_-]?key\s*[:=]\s*["\047][a-zA-Z0-9]{20,}'
    'secret[_-]?key\s*[:=]\s*["\047][a-zA-Z0-9]{20,}'
    'password\s*[:=]\s*["\047][^"\047]{8,}'
    'token\s*[:=]\s*["\047][a-zA-Z0-9]{20,}'
    
    # AWS
    'AKIA[0-9A-Z]{16}'
    
    # Google OAuth
    'client[_-]?secret\s*[:=]\s*["\047][a-zA-Z0-9_-]{20,}'
    
    # Private keys
    'BEGIN.*PRIVATE.*KEY'
)

# Files to always exclude
EXCLUDE_PATTERNS=(
    '\.env\.example$'
    '\.md$'
    'package-lock\.json$'
    'yarn\.lock$'
    '\.min\.js$'
    'pre-commit\.sh$'
)

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${GREEN}✅ No files to scan${NC}"
    exit 0
fi

FOUND_SECRETS=0

# Scan each staged file
for FILE in $STAGED_FILES; do
    # Skip excluded files
    SKIP=0
    for EXCLUDE in "${EXCLUDE_PATTERNS[@]}"; do
        if echo "$FILE" | grep -qE "$EXCLUDE"; then
            SKIP=1
            break
        fi
    done
    
    if [ $SKIP -eq 1 ]; then
        continue
    fi
    
    # Check if file exists (might be deleted)
    if [ ! -f "$FILE" ]; then
        continue
    fi
    
    # Scan file content
    for PATTERN in "${PATTERNS[@]}"; do
        if grep -qiE "$PATTERN" "$FILE"; then
            echo -e "${RED}❌ Potential secret found in $FILE${NC}"
            echo -e "${YELLOW}   Pattern matched: $PATTERN${NC}"
            grep -niE "$PATTERN" "$FILE" | head -3 | sed 's/^/   /'
            FOUND_SECRETS=1
        fi
    done
done

if [ $FOUND_SECRETS -eq 1 ]; then
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⛔ COMMIT BLOCKED: Secrets detected in staged files${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}To fix:${NC}"
    echo "  1. Remove secrets from the files"
    echo "  2. Use environment variables instead (.env file)"
    echo "  3. Add sensitive values to .env.example as placeholders"
    echo "  4. Ensure .env is in .gitignore"
    echo ""
    echo -e "${YELLOW}If this is a false positive:${NC}"
    echo "  - Add the file pattern to EXCLUDE_PATTERNS in scripts/hooks/pre-commit.sh"
    echo "  - Or bypass this check: git commit --no-verify (NOT RECOMMENDED)"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ No secrets detected - commit allowed${NC}"
exit 0
