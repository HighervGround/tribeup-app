#!/bin/bash

# Move project back from iCloud Drive location to Downloads

set -e

SOURCE="/Users/cole.guyton/Library/Mobile Documents/com~apple~CloudDocs/Projects/React TribeUp Social Sports App"
DEST="/Users/cole.guyton/Downloads/React TribeUp Social Sports App"
LOCAL_CACHE="$HOME/.local-cache/React TribeUp Social Sports App"

echo "🔙 Moving project back to Downloads..."

# Remove symlinks first
if [ -L "$SOURCE/node_modules" ]; then
    rm "$SOURCE/node_modules"
fi

if [ -L "$SOURCE/build" ]; then
    rm "$SOURCE/build"
fi

# Restore node_modules and build from local cache if they exist
if [ -d "$LOCAL_CACHE/node_modules" ]; then
    echo "   📦 Restoring node_modules..."
    cp -r "$LOCAL_CACHE/node_modules" "$SOURCE/node_modules" 2>/dev/null || true
fi

if [ -d "$LOCAL_CACHE/build" ]; then
    echo "   📦 Restoring build folder..."
    cp -r "$LOCAL_CACHE/build" "$SOURCE/build" 2>/dev/null || true
fi

# Move project back
echo "   📦 Moving project..."
mv "$SOURCE" "$DEST"

echo "✅ Project moved back to: $DEST"

