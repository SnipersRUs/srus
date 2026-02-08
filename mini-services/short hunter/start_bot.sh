#!/bin/bash
# Simple launcher script with error handling

BOT_DIR="/Users/bishop/Desktop/bots/short hunter"
PID_FILE="$BOT_DIR/short_hunter_bot.pid"

cd "$BOT_DIR" || { echo "❌ Cannot access bot directory"; exit 1; }

# Clean up stale PID file if needed
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ! kill -0 "$OLD_PID" 2>/dev/null; then
        echo "🧹 Cleaning up stale PID file ($OLD_PID no longer running)"
        rm -f "$PID_FILE"
    fi
fi

# Check if already running
if [ -f "$PID_FILE" ]; then
    CURRENT_PID=$(cat "$PID_FILE")
    if kill -0 "$CURRENT_PID" 2>/dev/null; then
        echo "❌ Bot is already running (PID: $CURRENT_PID)"
        exit 1
    fi
fi

# Start the bot
echo "🚀 Starting Short Hunter Bot..."
python3 short_hunter_bot.py &
BOT_PID=$!
echo $BOT_PID > "$PID_FILE"

# Wait a moment to verify it started
sleep 3
if kill -0 $BOT_PID 2>/dev/null; then
    echo "✅ Bot started successfully (PID: $BOT_PID)"
    echo "📝 Logs: $BOT_DIR/short_hunter_bot.log"
else
    echo "❌ Bot failed to start. Check logs for errors."
    rm -f "$PID_FILE"
    exit 1
fi
