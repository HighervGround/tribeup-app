#!/bin/bash

# Script to prepare TribeUp project for iCloud upload
# Excludes node_modules, build folders, and other unnecessary files

PROJECT_DIR="/Users/cole.guyton/Downloads/React TribeUp Social Sports App"
ARCHIVE_NAME="TribeUp-Source-$(date +%Y%m%d-%H%M%S).zip"
ICLOUD_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs"

echo "📦 Preparing TribeUp source for iCloud upload..."
echo ""

# Navigate to parent directory to include the project folder name in zip
cd "$(dirname "$PROJECT_DIR")"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

# Create zip archive, excluding unnecessary files
zip -r "$ARCHIVE_NAME" "$PROJECT_NAME" \
  -x "*/node_modules/*" \
  -x "*/build/*" \
  -x "*/dist/*" \
  -x "*/.git/*" \
  -x "*/\.DS_Store" \
  -x "*/.env.local" \
  -x "*/.env.production" \
  -x "*/package-lock.json" \
  -x "*/*.log" \
  -x "*/\.next/*" \
  -x "*/coverage/*" \
  -x "*/.vscode/*" \
  -x "*/.idea/*"

ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)

echo ""
echo "✅ Archive created: $ARCHIVE_NAME"
echo "📊 Size: $ARCHIVE_SIZE"
echo ""
echo "📁 Archive location: $(dirname "$PROJECT_DIR")/$ARCHIVE_NAME"
echo ""
echo "🚀 Next steps:"
echo "   1. Open Finder"
echo "   2. Drag '$ARCHIVE_NAME' to iCloud Drive"
echo "   OR"
echo "   3. Copy it: cp \"$(dirname "$PROJECT_DIR")/$ARCHIVE_NAME\" \"$ICLOUD_DIR/\""
echo ""
read -p "Copy to iCloud Drive now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cp "$(dirname "$PROJECT_DIR")/$ARCHIVE_NAME" "$ICLOUD_DIR/"
  echo "✅ Copied to iCloud Drive!"
fi

