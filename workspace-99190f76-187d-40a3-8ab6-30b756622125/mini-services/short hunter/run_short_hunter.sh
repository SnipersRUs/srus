#!/bin/bash
# Short Hunter Bot Management Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOT_SCRIPT="$SCRIPT_DIR/short_hunter_bot.py"
PID_FILE="$SCRIPT_DIR/short_hunter_bot.pid"
LOG_FILE="$SCRIPT_DIR/short_hunter_bot.log"

case "$1" in
    start)
        if [ -f "$PID_FILE" ]; then
            OLD_PID=$(cat "$PID_FILE")
            if kill -0 "$OLD_PID" 2>/dev/null; then
                echo "❌ Bot is already running (PID: $OLD_PID)"
                exit 1
            else
                echo "⚠️  Cleaning up stale PID file (PID $OLD_PID no longer running)"
                rm -f "$PID_FILE"
            fi
        fi
        echo "🚀 Starting Short Hunter Bot..."
        nohup python3 "$BOT_SCRIPT" > "$LOG_FILE" 2>&1 &
        NEW_PID=$!
        echo $NEW_PID > "$PID_FILE"
        sleep 1
        if kill -0 $NEW_PID 2>/dev/null; then
            echo "✅ Bot started successfully (PID: $NEW_PID)"
            echo "📝 Logs: $LOG_FILE"
        else
            echo "❌ Bot failed to start. Check $LOG_FILE for errors"
            rm -f "$PID_FILE"
            exit 1
        fi
        ;;
    stop)
        if [ ! -f "$PID_FILE" ]; then
            echo "❌ PID file not found. Bot may not be running."
            exit 1
        fi
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            rm "$PID_FILE"
            echo "✅ Bot stopped"
        else
            echo "❌ Process not found. Removing stale PID file."
            rm "$PID_FILE"
        fi
        ;;
    status)
        if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            PID=$(cat "$PID_FILE")
            echo "✅ Bot is running (PID: $PID)"
            echo "📝 Logs: $LOG_FILE"
            if [ -f "$LOG_FILE" ]; then
                echo ""
                echo "Last 5 log lines:"
                tail -n 5 "$LOG_FILE"
            fi
        else
            echo "❌ Bot is not running"
        fi
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    logs)
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "❌ Log file not found: $LOG_FILE"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|logs}"
        exit 1
        ;;
esac
