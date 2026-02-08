#!/bin/bash
# Short Hunter Bot Monitor - detects crashes AND frozen processes
# Auto-restarts and notifies on issues

BOT_DIR="/Users/bishop/Desktop/bots/short hunter"
PID_FILE="$BOT_DIR/short_hunter_bot.pid"
LOG_FILE="$BOT_DIR/short_hunter_bot.log"
MONITOR_LOG="$BOT_DIR/monitor.log"
WEBHOOK_URL_FILE="$BOT_DIR/discord_webhook.txt"

# Discord webhook (if configured)
if [ -f "$WEBHOOK_URL_FILE" ]; then
    WEBHOOK_URL=$(cat "$WEBHOOK_URL_FILE")
fi

# Send Discord alert
send_alert() {
    local message="$1"
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"content\": \"🚨 **Short Hunter Bot Alert**\n$message\"}" > /dev/null
    fi
}

# Check if bot is truly alive (not just running)
check_bot_health() {
    local pid="$1"

    # Process exists?
    if ! kill -0 "$pid" 2>/dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Process dead (PID: $pid)" >> "$MONITOR_LOG"
        return 1
    fi

    # Check if log is being updated (activity in last 15 minutes)
    if [ -f "$LOG_FILE" ]; then
        local last_log=$(stat -f "%m" "$LOG_FILE")
        local current=$(date +%s)
        local diff=$((current - last_log))

        if [ $diff -gt 900 ]; then  # 15 minutes = 900 seconds
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  Frozen - log stale for ${diff}s" >> "$MONITOR_LOG"
            return 2
        fi
    fi

    return 0
}

# Main monitoring check
monitor() {
    local issue_found=false
    local issue_type=""

    # Check PID file
    if [ ! -f "$PID_FILE" ]; then
        issue_found=true
        issue_type="No PID file - bot not started"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $issue_type" >> "$MONITOR_LOG"
    else
        local pid=$(cat "$PID_FILE")
        check_bot_health "$pid"
        local status=$?

        case $status in
            1)
                issue_found=true
                issue_type="Process crashed"
                ;;
            2)
                issue_found=true
                issue_type="Process frozen/hung"
                # Kill frozen process
                kill -9 "$pid" 2>/dev/null
                rm -f "$PID_FILE"
                ;;
        esac
    fi

    # Restart if needed
    if [ "$issue_found" = true ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Restarting bot ($issue_type)" >> "$MONITOR_LOG"
        send_alert "⚠️ Bot issue detected: **$issue_type**\nAuto-restarting..."

        cd "$BOT_DIR"
        python3 short_hunter_bot.py >> "$LOG_FILE" 2>&1 &
        local new_pid=$!
        echo $new_pid > "$PID_FILE"

        sleep 3
        if kill -0 "$new_pid" 2>/dev/null; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Restarted (PID: $new_pid)" >> "$MONITOR_LOG"
            send_alert "✅ Bot restarted successfully (PID: $new_pid)"
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Restart failed" >> "$MONITOR_LOG"
            send_alert "❌ Bot failed to restart! Manual intervention needed."
        fi
    fi
}

monitor
