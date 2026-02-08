#!/usr/bin/env python3
"""
Short Hunter Fleet Manager
Runs ALL short hunter bots simultaneously with TOP FINDER optimizations
Each bot scans different segments for maximum coverage
"""

import subprocess
import time
import logging
import signal
import sys
from datetime import datetime
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('fleet_manager.log')
    ]
)
logger = logging.getLogger(__name__)

# Bot configurations
BOTS = [
    {
        'name': 'V3-ALL (281 pairs)',
        'script': 'short_hunter_bot_v3_all.py',
        'description': 'ALL OKX futures - TOP FINDER mode',
        'scan_interval': 15,  # minutes
        'priority': 1
    },
    {
        'name': 'V3-Dynamic',
        'script': 'short_hunter_bot_v3_dynamic.py', 
        'description': 'Dynamic volume-based scanning',
        'scan_interval': 20,
        'priority': 2
    },
    {
        'name': 'V2.5-Top30',
        'script': 'short_hunter_bot_v25_top30.py',
        'description': 'Top 30 high-volume assets',
        'scan_interval': 10,
        'priority': 3
    },
    {
        'name': 'V2-Alerts',
        'script': 'short_hunter_bot_v2_alertsonly.py',
        'description': 'Pure signal alerts',
        'scan_interval': 25,
        'priority': 4
    },
    {
        'name': 'V1-Original',
        'script': 'short_hunter_bot.py',
        'description': 'Original with paper trading',
        'scan_interval': 30,
        'priority': 5
    }
]

BOT_DIR = Path.home() / "Desktop/bots/short hunter"
processes = {}

def start_bot(bot_config):
    """Start a single bot"""
    script_path = BOT_DIR / bot_config['script']
    
    if not script_path.exists():
        logger.error(f"❌ Script not found: {script_path}")
        return None
    
    try:
        process = subprocess.Popen(
            ['/Library/Frameworks/Python.framework/Versions/3.13/bin/python3', str(script_path)],
            cwd=BOT_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        logger.info(f"✅ Started {bot_config['name']} (PID: {process.pid})")
        return process
        
    except Exception as e:
        logger.error(f"❌ Failed to start {bot_config['name']}: {e}")
        return None

def stop_all_bots():
    """Stop all running bots"""
    logger.info("🛑 Stopping all bots...")
    for name, process in processes.items():
        if process and process.poll() is None:
            try:
                process.terminate()
                process.wait(timeout=5)
                logger.info(f"✅ Stopped {name}")
            except:
                process.kill()
                logger.warning(f"💀 Killed {name}")

def check_bot_health():
    """Check if bots are running, restart if needed"""
    for bot in BOTS:
        name = bot['name']
        process = processes.get(name)
        
        if process is None or process.poll() is not None:
            logger.warning(f"⚠️ {name} is not running, restarting...")
            processes[name] = start_bot(bot)

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info("🛑 Received shutdown signal")
    stop_all_bots()
    sys.exit(0)

def main():
    """Main fleet manager loop"""
    logger.info("=" * 60)
    logger.info("🚀 SHORT HUNTER FLEET MANAGER")
    logger.info("=" * 60)
    logger.info(f"📊 Managing {len(BOTS)} bots")
    logger.info("🎯 Mode: TOP FINDER (local tops & 24h highs)")
    logger.info("=" * 60)
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start all bots
    for bot in sorted(BOTS, key=lambda x: x['priority']):
        logger.info(f"🔄 Starting {bot['name']}...")
        processes[bot['name']] = start_bot(bot)
        time.sleep(2)  # Stagger starts
    
    logger.info("=" * 60)
    logger.info("✅ All bots started! Monitoring...")
    logger.info("=" * 60)
    
    # Monitor loop
    health_check_interval = 60  # seconds
    last_health_check = time.time()
    
    try:
        while True:
            time.sleep(1)
            
            # Health check every minute
            if time.time() - last_health_check >= health_check_interval:
                check_bot_health()
                last_health_check = time.time()
                
                # Log status
                running = sum(1 for p in processes.values() if p and p.poll() is None)
                logger.info(f"📈 Fleet Status: {running}/{len(BOTS)} bots running")
                
    except KeyboardInterrupt:
        logger.info("👋 Keyboard interrupt received")
        stop_all_bots()

if __name__ == "__main__":
    main()
