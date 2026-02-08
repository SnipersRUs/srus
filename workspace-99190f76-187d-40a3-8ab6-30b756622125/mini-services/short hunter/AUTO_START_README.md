# Short Hunter Bot - Auto-Start Setup

## Problem Fixed
The bot now:
- ✅ Automatically cleans up stale PID files on startup
- ✅ Has a reliable start script with error handling
- ✅ Can be set to auto-start on boot/reboot

## Quick Start

### Start the Bot Manually
```bash
cd "/Users/bishop/Desktop/bots/short hunter"
bash start_bot.sh
```

### Check Bot Status
```bash
cd "/Users/bishop/Desktop/bots/short hunter"
bash run_short_hunter.sh status
```

### Stop the Bot
```bash
cd "/Users/bishop/Desktop/bots/short hunter"
bash run_short_hunter.sh stop
```

### View Logs
```bash
cd "/Users/bishop/Desktop/bots/short hunter"
bash run_short_hunter.sh logs
```

---

## Option 1: Login Items (Recommended - Easiest)

1. Open **System Preferences** → **Users & Groups**
2. Click on your username
3. Click **Login Items** tab
4. Click **+** to add a new item
5. Navigate to: `/Users/bishop/Desktop/bots/short hunter/start_bot.sh`
6. Select the file and click **Add**
7. Make sure the checkbox is checked

**The bot will now start automatically when you login!**

---

## Option 2: Using Watchdog Script (Best for Crash Recovery)

The watchdog script automatically restarts the bot if it crashes:

```bash
cd "/Users/bishop/Desktop/bots/short hunter"
./watchdog.sh &
```

To stop the watchdog:
```bash
pkill -f "watchdog.sh"
```

To set up watchdog as a Login Item (recommended):
1. Follow steps in Option 1 above, but add `watchdog.sh` instead of `start_bot.sh`

---

## Option 3: Launch Agent (Auto-start on Boot)

**Note:** Launch Agents require Full Disk Access permissions for the Desktop folder. 
If you see "Operation not permitted" errors, grant Full Disk Access to Terminal or use Option 1 or 2 instead.

### To Grant Full Disk Access:
1. Open **System Settings** → **Privacy & Security**
2. Scroll down and click **Full Disk Access**
3. Click the **+** button
4. Add **Terminal** (or iTerm2 if using that)
5. Restart your terminal

### Install Launch Agent:
```bash
cd "/Users/bishop/Desktop/bots/short hunter"
bash setup_launchd.sh
```

### To Uninstall:
```bash
launchctl unload ~/Library/LaunchAgents/com.bishop.shorthunterbot.plist
rm ~/Library/LaunchAgents/com.bishop.shorthunterbot.plist
```

---

## Option 4: Cron (Easiest Auto-Start)

**Recommended for most users - simple and reliable**

This sets up a cron job that:
- Checks every 5 minutes if the bot is running
- Automatically starts it if it's not running
- Survives reboots and crashes

```bash
cd "/Users/bishop/Desktop/bots/short hunter"
bash setup_cron.sh
```

**To remove:**
```bash
crontab -e
# Delete the line containing "start_bot.sh"
# Save and exit
```

---

## Troubleshooting

### Bot won't start after reboot
1. Check if Login Item is set up (Option 1 is most reliable)
2. Try manually starting: `bash start_bot.sh`
3. Check logs: `tail -50 short_hunter_bot.log`

### Stale PID file errors
The new scripts automatically clean these up. If you still see them:
```bash
rm short_hunter_bot.pid
bash start_bot.sh
```

### Bot crashes repeatedly
Check the error logs:
```bash
tail -100 short_hunter_bot.log
```

### Check if bot is running
```bash
ps aux | grep short_hunter_bot.py
```

---

## File Summary

| File | Purpose |
|------|---------|
| `short_hunter_bot.py` | Main bot script |
| `run_short_hunter.sh` | Management script (start/stop/status/logs) |
| `start_bot.sh` | **Improved start script** with stale PID cleanup |
| `watchdog.sh` | Auto-restart on crash |
| `setup_launchd.sh` | Install launch agent |
| `com.bishop.shorthunterbot.plist` | Launch agent configuration |
| `active_trades.json` | Trade persistence |
| `short_hunter_bot.log` | Main log file |
| `debug.log` | Debug log (NDJSON) |

---

## Recommended Setup

**Option 4 (Cron) - Easiest & Most Reliable**
```bash
bash setup_cron.sh
```
- Checks bot every 5 minutes
- Auto-starts on boot/login
- Auto-restarts on crashes
- No terminal window needed
- **Most reliable option**

**Option 1 (Login Items) - Good Alternative**
- Add `start_bot.sh` to Login Items in System Preferences
- Auto-starts on login only
- Simple, but no crash recovery

**Option 2 (Watchdog) - Best Crash Recovery**
- Add `watchdog.sh` to Login Items
- Auto-restarts on crashes
- Requires adding to Login Items

**Option 3 (Launch Agent) - Advanced**
- Auto-starts on boot (before login)
- Requires Full Disk Access permission
- More complex setup
