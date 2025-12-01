#!/bin/bash

# Generate domain-specific documentation for focused analysis
# Usage: ./scripts/generate-domain-docs.sh [domain]
# Domains: games, users, locations, tribes, weather

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOMAIN="${1:-games}"

if [[ ! -d "$PROJECT_ROOT/src/domains/$DOMAIN" ]]; then
    echo "❌ Error: Domain '$DOMAIN' not found"
    echo "   Available domains: games, users, locations, tribes, weather"
    exit 1
fi

DOMAIN_UPPER=$(echo "$DOMAIN" | tr '[:lower:]' '[:upper:]')
OUTPUT_FILE="$PROJECT_ROOT/docs/DOMAIN_${DOMAIN_UPPER}_DOCUMENTATION.md"

echo "📚 Generating documentation for domain: $DOMAIN"
echo "   Source: src/domains/$DOMAIN/"
echo "   Output: $OUTPUT_FILE"

cd "$PROJECT_ROOT"

if ! command -v code2prompt &> /dev/null; then
    echo "❌ Error: code2prompt is not installed"
    exit 1
fi

code2prompt "src/domains/$DOMAIN" -O "$OUTPUT_FILE"

FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
LINE_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

echo ""
echo "✅ Documentation generated!"
echo "   File: $OUTPUT_FILE"
echo "   Size: $FILE_SIZE"
echo "   Lines: $LINE_COUNT"
echo ""

