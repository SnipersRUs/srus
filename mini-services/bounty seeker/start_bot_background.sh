#!/bin/bash
# Start Bounty Seeker Bot in background

echo "🛑 Stopping existing instances..."
# Kill all python processes matching the bot names
pkill -f "bounty_seeker_v5.py" || true
pkill -f "bounty_seeker_bot.py" || true
pkill -f "bounty_seeker" || true

# Wait a moment for them to die
sleep 2

# Force kill if still running
pkill -9 -f "bounty_seeker_v5.py" || true

# Activate venv if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run in background with nohup
echo "🚀 Starting Bounty Seeker Bot (V5) in background..."
nohup python3 bounty_seeker_v5.py > bounty_seeker.log 2>&1 &

echo "✅ Bot started! PID: $!"
echo "📄 Logs being written to bounty_seeker.log"
echo "⏰ Scanning every hour."
