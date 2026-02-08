#!/bin/bash
# Bounty Seeker Bot - Run Script

echo "🚀 Starting Bounty Seeker Bot..."
echo "📊 Strategy: GPS Zones + Deviation Bands + SFP Reversals"
echo "⏰ Scanning at XX:45 (15 minutes before hour)"
echo ""

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the bot
python3 bounty_seeker_v5.py
