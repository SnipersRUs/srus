#!/bin/bash
# Quick setup to add bot to cron for auto-restart

BOT_DIR="/Users/bishop/Desktop/bots/short hunter"
START_SCRIPT="$BOT_DIR/start_bot.sh"

echo "🔧 Setting up cron job for Short Hunter Bot..."
echo ""

# Check if bot is running
if pgrep -f "short_hunter_bot.py" > /dev/null; then
    echo "⚠️  Bot is currently running. Stopping it first..."
    pkill -f "short_hunter_bot.py"
    sleep 2
fi

# Check for existing cron job
EXISTS=$(crontab -l 2>/dev/null | grep -c "start_bot.sh" || true)

if [ "$EXISTS" -gt 0 ]; then
    echo "⚠️  Existing cron job found. Removing old job..."
    crontab -l 2>/dev/null | grep -v "start_bot.sh" | crontab -
fi

# Add new cron job - runs every 5 minutes and checks if bot is running
echo "➕ Adding cron job (checks bot every 5 minutes, starts if not running)..."
(crontab -l 2>/dev/null; echo "*/5 * * * * $START_SCRIPT > $BOT_DIR/cron.log 2>&1") | crontab -

# Start bot now
echo "🚀 Starting bot now..."
bash "$START_SCRIPT"

sleep 2

echo ""
echo "✅ Setup complete!"
echo ""
echo "Cron job will:"
echo "  ✓ Check every 5 minutes if bot is running"
echo "  ✓ Start the bot automatically if it's not running"
echo "  ✓ This survives reboots and crashes"
echo ""
echo "Check bot status anytime:"
echo "  bash '$BOT_DIR/run_short_hunter.sh' status"
echo ""
echo "To remove cron job:"
echo "  crontab -e (then delete the line with start_bot.sh)"
echo ""
