#!/bin/bash
# Setup Short Hunter Bot as a macOS Launch Agent

BOT_DIR="/Users/bishop/Desktop/bots/short hunter"
PLIST_FILE="$BOT_DIR/com.bishop.shorthunterbot.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_DEST="$LAUNCH_AGENTS_DIR/com.bishop.shorthunterbot.plist"

echo "🔧 Setting up Short Hunter Bot as a Launch Agent..."
echo ""

# Check if LaunchAgents directory exists
if [ ! -d "$LAUNCH_AGENTS_DIR" ]; then
    echo "📁 Creating LaunchAgents directory..."
    mkdir -p "$LAUNCH_AGENTS_DIR"
fi

# Copy plist file
echo "📋 Installing launch agent..."
cp "$PLIST_FILE" "$PLIST_DEST"

# Stop any existing instance
echo "🛑 Stopping any existing instance..."
launchctl unload "$PLIST_DEST" 2>/dev/null

# Load the launch agent
echo "🚀 Loading launch agent..."
launchctl load "$PLIST_DEST"

# Start the bot
echo "▶️  Starting bot..."
launchctl start com.bishop.shorthunterbot

sleep 2

# Check status
echo ""
echo "✅ Setup complete!"
echo ""
echo "Status commands:"
echo "  Check bot status:   bash '$BOT_DIR/run_short_hunter.sh' status"
echo "  View logs:          bash '$BOT_DIR/run_short_hunter.sh' logs"
echo "  Stop bot:           bash '$BOT_DIR/run_short_hunter.sh' stop"
echo "  Start bot manually: bash '$BOT_DIR/run_short_hunter.sh' start"
echo ""
echo "The bot will now:"
echo "  ✓ Start automatically on boot/reboot"
echo "  ✓ Restart automatically if it crashes"
echo "  ✓ Clean up stale PID files on startup"
echo ""
