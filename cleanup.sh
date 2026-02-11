#!/bin/bash

# SRUS Project Cleanup Script
# Run this to clean up unnecessary files and dependencies

echo "🧹 Cleaning up SRUS project..."

# Remove build artifacts and cache
echo "Removing build artifacts..."
rm -rf .next
rm -rf node_modules
rm -f package-lock.json
rm -f bun.lockb
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Remove log files
echo "Removing log files..."
rm -f *.log
rm -f dev.log dev_output.log dev_output_2.log server.log
rm -f bounty_seeker.log short_hunter.log signal_streamer.log

# Remove temporary data files (keep structure)
echo "Cleaning temporary files..."
rm -f active_trades.json
rm -f bounty_seeker_status.json
rm -f sniper_guru_trades.json
rm -f trades.db

# Remove documentation files that are no longer needed
echo "Removing old documentation..."
rm -f AGENT_SIGNALS.md
rm -f DEPLOY_GUIDE.md
rm -f NEXTJS_FIX_EXPLAINED.md
rm -f SIGNAL_EXAMPLES.md
rm -f SIGNAL_TRACKING.md
rm -f TEST_GUIDE.md

# Remove unused directories
echo "Removing unused directories..."
rm -rf .zscripts
rm -rf download
rm -rf db
rm -rf prisma
rm -rf .netlify

# Remove unused UI components (keep only what's needed)
echo "Cleaning UI components..."
cd src/components/ui
# Keep only essential components, remove the rest
# This is a manual step - see CLEANUP.md for list

echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm run dev"
echo ""
echo "See CLEANUP.md for full details on what was removed."
