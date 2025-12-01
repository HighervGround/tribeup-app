#!/bin/bash

# Generate API/Service layer documentation
# Focuses on services, API calls, and business logic

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_FILE="$PROJECT_ROOT/docs/API_SERVICES_DOCUMENTATION.md"

echo "📚 Generating API/Services documentation..."
echo "   Source: All service files (*Service.ts, *service.ts)"
echo "   Output: $OUTPUT_FILE"

cd "$PROJECT_ROOT"

if ! command -v code2prompt &> /dev/null; then
    echo "❌ Error: code2prompt is not installed"
    exit 1
fi

# Generate docs for all service files
code2prompt src \
    --include "*Service.ts,*service.ts" \
    -O "$OUTPUT_FILE"

FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
LINE_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

echo ""
echo "✅ API documentation generated!"
echo "   File: $OUTPUT_FILE"
echo "   Size: $FILE_SIZE"
echo "   Lines: $LINE_COUNT"
echo ""

