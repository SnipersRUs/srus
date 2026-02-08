# Short Hunter Bot - Launchd-Only Configuration

**Date:** 2026-01-25
**Issue:** Bot was being double-managed by both launchd and cron, causing unnecessary restarts

## Root Cause

Two systems were fighting over the bot:
1. **LaunchAgent** (`com.bishop.shorthunterbot`) - has `KeepAlive=true` to auto-restart
2. **Cron job** (`*/5 * * * * bot_monitor.sh`) - kills frozen processes and restarts

The cron job was sending SIGTERM signals which triggered launchd to restart the bot, creating a restart loop:
- 12:23:43 → SIGTERM → 12:23:44 restart (launchd)
- 12:23:50 → SIGTERM again → 12:23:55 restart (launchd)
- 15:46:41 → SIGTERM → 15:46:42 restart (launchd)

## Solution: Option A - Launchd Only

**Removed:** Cron job running `bot_monitor.sh`

**Kept:** LaunchAgent configuration at:
- `~/Library/LaunchAgents/com.bishop.shorthunterbot.plist`
- Bot script: `short_hunter_bot.py`
- Pid file: `short_hunter_bot.pid`

## Current Status

- **Bot is running:** PID 27269 (active for ~1h 43m)
- **Management:** Launchd only (no cron interference)
- **Auto-restart:** `KeepAlive=true` in launchd plist
- **Scan schedule:** Every hour at :45 (15 min before top of hour, local time)

## Files for Reference

- **LaunchAgent plist:** `/Users/bishop/Library/LaunchAgents/com.bishop.shorthunterbot.plist`
- **Bot log:** `/Users/bishop/Desktop/bots/short hunter/short_hunter_bot.log`
- **launchd log:** `/Users/bishop/Desktop/bots/short hunter/launchd_stderr.log`

## Bot Control Commands

```bash
# Check status
launchctl list | grep shorthunter

# Restart bot
launchctl kickstart -k gui/$(id -u)/com.bishop.shorthunterbot

# Stop bot (temporary - will restart on reboot)
launchctl stop gui/$(id -u)/com.bishop.shorthunterbot

# Unload (permanently disable)
launchctl unload ~/Library/LaunchAgents/com.bishop.shorthunterbot.plist

# Load (enable)
launchctl load ~/Library/LaunchAgents/com.bishop.shorthunterbot.plist
```

## Monitoring

The bot will now:
- ✅ Scan at :45 every hour
- ✅ Auto-restart if it crashes (via launchd KeepAlive)
- ✅ Survive system reboots (launchd will start it)
- ✅ Log to both `short_hunter_bot.log` and `launchd_stderr.log`

No more restart loops from conflicting management systems.
