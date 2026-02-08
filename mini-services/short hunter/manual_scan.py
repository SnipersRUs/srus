#!/usr/bin/env python3
"""
Manual scan trigger for Short Hunter Bot
Runs a one-time market scan and reports results without affecting the running bot
"""

import sys
import os
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Change to bot directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Import bot components
from short_hunter_bot import (
    analyze_market,
    TradeTracker,
    MAX_ACTIVE_TRADES,
    DISCORD_WEBHOOK_URL,
    send_discord_alert,
    MarketEngine,
    load_okx_perps
)

def main():
    """Run a one-time manual scan"""
    logger.info("🚀 Manual scan started...")
    logger.info("Loading asset list...")

    # Load asset list
    assets = load_okx_perps()
    if not assets:
        logger.error("❌ Failed to load asset list")
        return 1

    logger.info(f"✅ Loaded {len(assets)} assets")

    # Initialize market engine
    logger.info("Fetching market data...")
    engine = MarketEngine(assets)
    market_data = engine.tick()

    if not market_data:
        logger.error("❌ No market data available")
        return 1

    logger.info(f"✅ Market data fetched for {len(market_data)} pairs")

    # Load active trades (read-only)
    trade_tracker = TradeTracker()
    active_count = trade_tracker.get_active_trades_count()
    logger.info(f"📂 Active trades: {active_count}/{MAX_ACTIVE_TRADES}")

    # Run analysis
    logger.info("🔍 Analyzing market for signals...")
    signals, watchlist = analyze_market(market_data, trade_tracker, trades_this_hour=0)

    # Report results
    logger.info(f"\n{'='*60}")
    logger.info(f"MANUAL SCAN RESULTS")
    logger.info(f"{'='*60}")

    if signals:
        logger.info(f"📊 Found {len(signals)} short signal(s):")
        for i, signal in enumerate(signals, 1):
            logger.info(f"\n  Signal #{i}:")
            logger.info(f"    Symbol: {signal.symbol}")
            logger.info(f"    Price: {signal.price:.4f}")
            logger.info(f"    Stop Loss: {signal.stop_loss:.4f}")
            logger.info(f"    Take Profit: {signal.take_profit:.4f}")
            logger.info(f"    Score: {signal.score}/100")
            logger.info(f"    Reasons: {', '.join(signal.reasons)}")
    else:
        logger.info("✅ No short signals detected")

    if watchlist:
        logger.info(f"\n👀 Watchlist ({len(watchlist)} approaching resistance):")
        for symbol, dist_pct, gp_resist, price in watchlist:
            logger.info(f"    {symbol}: {dist_pct:.2f}% below GP ({gp_resist:.4f})")

    logger.info(f"\n{'='*60}")

    # Ask about sending to Discord
    if signals:
        response = input("\nSend alerts to Discord? (y/n): ").strip().lower()
        if response == 'y':
            logger.info("📤 Sending Discord alerts...")
            if send_discord_alert(signals, watchlist, trade_tracker):
                logger.info("✅ Alerts sent successfully!")
            else:
                logger.error("❌ Failed to send alerts")

    logger.info("✅ Manual scan complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
