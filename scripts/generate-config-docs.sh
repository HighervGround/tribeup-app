#!/bin/bash

# Generate configuration and setup documentation
# Environment config, database setup, routing config

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_FILE="$PROJECT_ROOT/docs/CONFIG_DOCUMENTATION.md"

echo "📚 Generating configuration documentation..."
echo "   Source: Config files, env setup, database config"
echo "   Output: $OUTPUT_FILE"

cd "$PROJECT_ROOT"

if ! command -v code2prompt &> /dev/null; then
    echo "❌ Error: code2prompt is not installed"
    exit 1
fi

# Generate docs for config-related files
code2prompt src/core/config src/core/database supabase/config.toml \
    --include "*.ts,*.tsx,*.toml,*.json" \
    -O "$OUTPUT_FILE"

FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
LINE_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

echo ""
echo "✅ Configuration documentation generated!"
echo "   File: $OUTPUT_FILE"
echo "   Size: $FILE_SIZE"
echo "   Lines: $LINE_COUNT"
echo ""

