#!/bin/bash
# Watchdog script for Short Hunter Bot - keeps it running and restarts on crash

BOT_DIR="/Users/bishop/Desktop/bots/short hunter"
PID_FILE="$BOT_DIR/short_hunter_bot.pid"
LOG_FILE="$BOT_DIR/watchdog.log"

while true; do
    # Check if bot is running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            # Bot is running, just wait
            sleep 10
            continue
        else
            # PID file exists but process is dead
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  Bot process died (stale PID: $PID). Restarting..." >> "$LOG_FILE"
            rm -f "$PID_FILE"
        fi
    fi
    
    # Start the bot
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 Starting Short Hunter Bot..." >> "$LOG_FILE"
    cd "$BOT_DIR"
    python3 short_hunter_bot.py > /dev/null 2>&1 &
    NEW_PID=$!
    echo $NEW_PID > "$PID_FILE"
    
    # Wait a moment to see if it stays running
    sleep 5
    if ! kill -0 $NEW_PID 2>/dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Bot failed to start. Will retry in 30s..." >> "$LOG_FILE"
        rm -f "$PID_FILE"
        sleep 30
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Bot started (PID: $NEW_PID)" >> "$LOG_FILE"
    fi
done
