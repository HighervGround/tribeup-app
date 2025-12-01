#!/bin/bash

# Generate custom hooks documentation
# All React hooks for state management and data fetching

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_FILE="$PROJECT_ROOT/docs/HOOKS_DOCUMENTATION.md"

echo "📚 Generating hooks documentation..."
echo "   Source: All hook files (use*.ts, use*.tsx)"
echo "   Output: $OUTPUT_FILE"

cd "$PROJECT_ROOT"

if ! command -v code2prompt &> /dev/null; then
    echo "❌ Error: code2prompt is not installed"
    exit 1
fi

# Generate docs for all hook files
code2prompt src \
    --include "use*.ts,use*.tsx" \
    -O "$OUTPUT_FILE"

FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
LINE_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

echo ""
echo "✅ Hooks documentation generated!"
echo "   File: $OUTPUT_FILE"
echo "   Size: $FILE_SIZE"
echo "   Lines: $LINE_COUNT"
echo ""

