#!/bin/bash

# Generate comprehensive codebase documentation using code2prompt
# This creates a full codebase snapshot for AI analysis, onboarding, and reference

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_FILE="$PROJECT_ROOT/docs/CODEBASE_DOCUMENTATION.md"

echo "📚 Generating codebase documentation..."
echo "   Source: src/"
echo "   Output: $OUTPUT_FILE"

cd "$PROJECT_ROOT"

# Check if code2prompt is installed
if ! command -v code2prompt &> /dev/null; then
    echo "❌ Error: code2prompt is not installed"
    echo "   Install it with: npm install -g code2prompt"
    exit 1
fi

# Generate documentation
code2prompt src -O "$OUTPUT_FILE"

# Get file stats
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
LINE_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

echo ""
echo "✅ Documentation generated successfully!"
echo "   File: $OUTPUT_FILE"
echo "   Size: $FILE_SIZE"
echo "   Lines: $LINE_COUNT"
echo ""
echo "💡 Use this file for:"
echo "   - AI codebase analysis (ChatGPT, Claude, etc.)"
echo "   - Onboarding new developers"
echo "   - Code reviews and audits"
echo "   - Migration planning"
echo ""

