# Short Hunter Bot

## Files

- **short_hunter_bot.py** - Main bot script
- **active_trades.json** - Trade persistence file (stores active trades)
- **short_hunter_bot.log** - Bot log file
- **short_hunter_bot.pid** - Process ID file (for managing bot instance)
- **run_short_hunter.sh** - Management script for starting/stopping the bot

## Quick Start

### Start the bot:
```bash
cd ~/Desktop/short\ hunter
./run_short_hunter.sh start
```

### Stop the bot:
```bash
./run_short_hunter.sh stop
```

### Check status:
```bash
./run_short_hunter.sh status
```

### View logs:
```bash
./run_short_hunter.sh logs
```

### Restart:
```bash
./run_short_hunter.sh restart
```

## Bot Features

- Scans OKX perpetual futures at :45 of each hour
- Detects short opportunities using GPS resistance, deviation zones, and volume spikes
- Sends Discord alerts with TradingView links
- Tracks up to 3 active trades
- Includes watchlist of 3 coins approaching resistance zones

## Configuration

Edit `short_hunter_bot.py` to change:
- `DISCORD_WEBHOOK_URL` - Your Discord webhook URL
- `SCAN_MINUTE` - When to scan (default: 45, meaning :45 past each hour)
- `MAX_ACTIVE_TRADES` - Maximum concurrent trades (default: 3)
- `MAX_TRADES_PER_HOUR` - Maximum trades per hour (default: 3)
