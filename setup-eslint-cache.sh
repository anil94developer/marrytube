#!/bin/bash
# Setup ESLint cache directory to avoid permission issues
mkdir -p "$HOME/.eslintcache"
chmod 755 "$HOME/.eslintcache" 2>/dev/null || true
echo "ESLint cache directory configured at: $HOME/.eslintcache"

