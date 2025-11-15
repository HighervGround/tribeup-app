#!/bin/bash

# Script to set up TribeUp project for live iCloud syncing
# Moves project to iCloud Drive and uses symlinks for large folders

set -e  # Exit on error

PROJECT_NAME="React TribeUp Social Sports App"
CURRENT_DIR="/Users/cole.guyton/Downloads/$PROJECT_NAME"
ICLOUD_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Projects"
ICLOUD_PROJECT_DIR="$ICLOUD_DIR/$PROJECT_NAME"
LOCAL_CACHE="$HOME/.local-cache/$PROJECT_NAME"

echo "🔄 Setting up live iCloud sync for TribeUp..."
echo ""

# Create Projects folder in iCloud if it doesn't exist
mkdir -p "$ICLOUD_DIR"

# Create local cache for non-synced folders
mkdir -p "$LOCAL_CACHE"

# Check if already in iCloud
if [[ "$CURRENT_DIR" == *"iCloud"* ]] || [[ "$CURRENT_DIR" == *"CloudDocs"* ]]; then
    echo "✅ Project appears to already be in iCloud Drive"
    CURRENT_DIR=$(pwd)
    ICLOUD_PROJECT_DIR="$CURRENT_DIR"
else
    echo "📦 Moving project to iCloud Drive..."
    echo "   From: $CURRENT_DIR"
    echo "   To: $ICLOUD_PROJECT_DIR"
    
    # Backup node_modules and build if they exist
    if [ -d "$CURRENT_DIR/node_modules" ]; then
        echo "   📦 Backing up node_modules..."
        mv "$CURRENT_DIR/node_modules" "$LOCAL_CACHE/node_modules" 2>/dev/null || true
    fi
    
    if [ -d "$CURRENT_DIR/build" ]; then
        echo "   📦 Backing up build folder..."
        mv "$CURRENT_DIR/build" "$LOCAL_CACHE/build" 2>/dev/null || true
    fi
    
    if [ -d "$CURRENT_DIR/dist" ]; then
        echo "   📦 Backing up dist folder..."
        mv "$CURRENT_DIR/dist" "$LOCAL_CACHE/dist" 2>/dev/null || true
    fi
    
    # Move project to iCloud
    mv "$CURRENT_DIR" "$ICLOUD_PROJECT_DIR"
    
    echo "✅ Project moved to iCloud Drive"
fi

# Set up symlinks for large folders (keep them local, don't sync)
cd "$ICLOUD_PROJECT_DIR"

echo ""
echo "🔗 Setting up local symlinks for large folders..."

# node_modules symlink
if [ ! -L "node_modules" ] && [ ! -d "node_modules" ]; then
    if [ -d "$LOCAL_CACHE/node_modules" ]; then
        echo "   🔗 Creating symlink for node_modules..."
        ln -s "$LOCAL_CACHE/node_modules" node_modules
    else
        mkdir -p "$LOCAL_CACHE/node_modules"
        ln -s "$LOCAL_CACHE/node_modules" node_modules
    fi
fi

# build symlink
if [ ! -L "build" ] && [ ! -d "build" ]; then
    if [ -d "$LOCAL_CACHE/build" ]; then
        echo "   🔗 Creating symlink for build..."
        ln -s "$LOCAL_CACHE/build" build
    else
        mkdir -p "$LOCAL_CACHE/build"
        ln -s "$LOCAL_CACHE/build" build
    fi
fi

# dist symlink (if exists)
if [ ! -L "dist" ] && [ ! -d "dist" ]; then
    if [ -d "$LOCAL_CACHE/dist" ]; then
        echo "   🔗 Creating symlink for dist..."
        ln -s "$LOCAL_CACHE/dist" dist
    fi
fi

echo ""
echo "✅ Live sync setup complete!"
echo ""
echo "📍 Project location: $ICLOUD_PROJECT_DIR"
echo "📦 Local cache: $LOCAL_CACHE"
echo ""
echo "💡 Your source code will now sync to iCloud automatically"
echo "💡 node_modules and build folders stay local (don't sync)"
echo ""
echo "🚀 To start working:"
echo "   cd \"$ICLOUD_PROJECT_DIR\""
echo ""
echo "📝 Note: Run 'npm install' to restore node_modules in the local cache"
echo ""

# Ask if they want to run npm install now
read -p "Run npm install now to restore dependencies? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing dependencies..."
    cd "$ICLOUD_PROJECT_DIR"
    npm install
    echo "✅ Dependencies installed!"
fi

