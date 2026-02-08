#!/usr/bin/env python3
"""
Short Hunter Bot V3 - Dynamic TOP FINDER
Scans ALL OKX perpetual futures with volume for LOCAL TOPS
"""

import time
import logging
import requests
import json
import os
import signal
import sys
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass

# ==========================================
# CONFIGURATION
# ==========================================
DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1444925694290300938/ACddvkCxvrMz6I_LqbH7l4TOyhicCMh67g-kAtal8YPi0F-AZbXnZpYe7vzrQihJKo5X'
EXCHANGE = "OKX"
OKX_INSTRUMENTS_URL = "https://www.okx.com/api/v5/public/instruments"
OKX_CANDLES_URL = "https://www.okx.com/api/v5/market/candles"
OKX_TICKERS_URL = "https://www.okx.com/api/v5/market/tickers"
OKX_INST_TYPE = "SWAP"
OKX_SETTLE = "USDT"
OKX_CANDLE_BAR = "15m"
OKX_CANDLE_LIMIT = 100
OKX_LOOKBACK = 96  # ~24h of 15m candles

# Volume threshold (24h volume in USDT)
MIN_VOLUME_USDT = 10000000  # $10M+ daily volume for decent liquidity

SCAN_INTERVAL = 20  # Scan every 20 minutes
CARD_COLOR = 0x9b59b6  # Purple

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('short_hunter_bot_v3.log')
    ]
)
logger = logging.getLogger(__name__)

# ==========================================
# DATA STRUCTURES
# ==========================================
@dataclass
class Signal:
    symbol: str
    price: float
    score: int
    reasons: List[str]
    stop_loss: float
    take_profit: float

# ==========================================
# MARKET DATA FETCHER
# ==========================================
class MarketDataFetcher:
    """Fetch market data from OKX with dynamic asset discovery"""

    def __init__(self):
        self.session = requests.Session()
        self.available_assets = []
        self._load_assets()

    def _load_assets(self):
        """Load all OKX perpetual futures with decent volume"""
        try:
            logger.info("📊 Fetching all OKX perpetual futures...")
            params = {"instType": OKX_INST_TYPE, "settle": OKX_SETTLE}
            resp = self.session.get(OKX_INSTRUMENTS_URL, params=params, timeout=20)
            resp.raise_for_status()
            payload = resp.json()
            instruments = payload.get("data", [])

            # Filter by volume
            high_volume_assets = []
            for inst in instruments:
                try:
                    # Parse instrument ID: BTC-USDT-SWAP
                    inst_id = inst.get("instId", "")
                    if not inst_id.endswith("-SWAP"):
                        continue

                    # Extract symbol: BTC-USDT-SWAP -> BTCUSDT
                    symbol_parts = inst_id.split("-")
                    if len(symbol_parts) >= 3:
                        base = symbol_parts[0]
                        symbol = f"{base}USDT"

                        # Check volume (from 24h volCcy field)
                        vol_24h = float(inst.get("volCcy", 0)) or 0

                        if vol_24h >= MIN_VOLUME_USDT:
                            high_volume_assets.append({
                                's': symbol,
                                'n': base,
                                'instId': inst_id,
                                'volume24h': vol_24h
                            })
                except Exception as e:
                    continue

            # Sort by volume and take top 30
            high_volume_assets.sort(key=lambda x: x['volume24h'], reverse=True)
            self.available_assets = high_volume_assets[:30]

            logger.info(f"📊 Loaded {len(self.available_assets)} high-volume assets (min volume: ${MIN_VOLUME_USDT:,})")
            logger.info(f"📊 Sample: {[a['s'] for a in self.available_assets[:5]]}")

        except Exception as e:
            logger.error(f"❌ Failed to load assets: {e}")
            self.available_assets = []

    def _fetch_candles(self, inst_id: str, retries: int = 3) -> List[List[float]]:
        """Fetch candles with retry logic"""
        for attempt in range(retries):
            try:
                params = {"instId": inst_id, "bar": OKX_CANDLE_BAR, "limit": OKX_CANDLE_LIMIT}
                resp = self.session.get(OKX_CANDLES_URL, params=params, timeout=15)
                resp.raise_for_status()
                payload = resp.json()
                data = payload.get("data", [])
                candles = []
                for row in data:
                    try:
                        o = float(row[1])
                        h = float(row[2])
                        l = float(row[3])
                        c = float(row[4])
                        v = float(row[5])
                        candles.append([o, h, l, c, v])
                    except Exception:
                        continue
                candles.reverse()
                return candles
            except requests.exceptions.RequestException as e:
                if attempt < retries - 1:
                    wait_time = (attempt + 1) * 2
                    logger.debug(f"Retry {attempt + 1}/{retries} for {inst_id} after {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    logger.warning(f"Failed to fetch candles for {inst_id} after {retries} attempts: {e}")
                    return []
            except Exception as e:
                logger.warning(f"Unexpected error fetching candles for {inst_id}: {e}")
                return []
        return []

    def tick(self) -> Dict[str, Dict]:
        """Fetch OKX 15m candles and build market snapshot"""
        data: Dict[str, Dict] = {}

        for asset in self.available_assets:
            symbol = asset["s"]
            inst_id = asset["instId"]

            try:
                candles = self._fetch_candles(inst_id)
                if not candles or len(candles) < OKX_LOOKBACK:
                    logger.debug(f"Not enough candles for {symbol}: {len(candles) if candles else 0}")
                    continue

                lookback = candles[-OKX_LOOKBACK:] if len(candles) >= OKX_LOOKBACK else candles
                highs = [c[1] for c in lookback]
                lows = [c[2] for c in lookback]
                closes = [c[3] for c in lookback]
                vols = [c[4] for c in lookback]
                last_o, last_h, last_l, last_c, last_v = candles[-1]

                high = max(highs)
                low = min(lows)
                change = ((last_c - low) / low) * 100 if low > 0 else 0.0

                # VWAP approximation
                typicals = [(h + l + c) / 3 for h, l, c in zip(highs, lows, closes)]
                vol_sum = sum(vols)
                vwap = sum(t * v for t, v in zip(typicals, vols)) / vol_sum if vol_sum > 0 else last_c

                # Deviation (std dev of closes)
                mean_close = sum(closes) / len(closes)
                variance = sum((c - mean_close) ** 2 for c in closes) / len(closes)
                std_dev = variance ** 0.5 if variance > 0 else 1.0
                dev = round((last_c - vwap) / std_dev, 2) if std_dev > 0 else 0.0

                # RSI
                rsi = _compute_rsi(closes, 14)

                # Liquidity sweep
                prev_high = max([c[1] for c in candles[-21:-1]]) if len(candles) > 21 else high
                is_sweep = last_h > prev_high and last_c < prev_high

                # Volume spikes
                vol_slice = vols[-20:] if len(vols) >= 20 else vols
                vol_ma = sum(vol_slice) / len(vol_slice)
                vol_var = sum((v - vol_ma) ** 2 for v in vol_slice) / len(vol_slice)
                vol_std = vol_var ** 0.5
                dynamic_threshold = vol_ma + vol_std * 2.0
                extreme_threshold = vol_ma + vol_std * 3.5
                is_abnormal_volume = last_v > dynamic_threshold
                is_extreme_volume = last_v > extreme_threshold

                data[symbol] = {
                    "price": last_c,
                    "high": high,
                    "low": low,
                    "change": change,
                    "rsi": rsi,
                    "vwap": vwap,
                    "dev": dev,
                    "is_sweep": is_sweep,
                    "volume": last_v,
                    "vol_ma": vol_ma,
                    "vol_std": vol_std,
                    "is_abnormal_volume": is_abnormal_volume,
                    "is_extreme_volume": is_extreme_volume,
                }
                time.sleep(0.01)
            except Exception as exc:
                logger.debug(f"OKX candle fetch failed for {symbol}: {exc}")
                continue

        logger.info(f"📈 Market data updated for {len(data)} pairs")
        return data


# ==========================================
# STRATEGY LOGIC (SHORT HUNTER)
# ==========================================
def analyze_market(market_data: Dict[str, Dict]) -> List[Signal]:
    """Analyze market data for short opportunities"""
    signals: List[Signal] = []

    for symbol, coin in market_data.items():
        reasons = []
        score = 0

        price = coin["price"]
        gp_resist = coin["vwap"] + (coin["vwap"] * (coin["dev"] * 0.01))

        distance_to_gp = abs(price - gp_resist) / gp_resist * 100
        if distance_to_gp < 0.5:
            reasons.append(f"Price at GPS Resistance Zone ({gp_resist:.2f})")
            score += 20

        if coin["dev"] >= 3.0:
            reasons.append(f"Deviation +{coin['dev']:.1f} Sigma Zone (Overextended)")
            score += 30
        elif coin["dev"] >= 2.0:
            reasons.append(f"Deviation +{coin['dev']:.1f} Sigma Zone (Extended)")
            score += 20

        if coin["rsi"] > 75:
            reasons.append(f"RSI: {coin['rsi']:.1f} (Severely Overbought)")
            score += 25
        elif coin["rsi"] > 70:
            reasons.append(f"RSI: {coin['rsi']:.1f} (Overbought)")
            score += 20

        if coin["is_sweep"]:
            reasons.append("Liquidity Sweep Detected (Break + Reject)")
            score += 15

        if coin["is_extreme_volume"]:
            reasons.append("Extreme Volume Spike (>3.5σ)")
            score += 15
        elif coin["is_abnormal_volume"]:
            reasons.append("Abnormal Volume Spike (>2σ)")
            score += 10

        if score >= 60:
            stop_loss = price * 1.01
            take_profit = price * 0.97
            signals.append(Signal(
                symbol=symbol,
                price=price,
                score=score,
                reasons=reasons,
                stop_loss=stop_loss,
                take_profit=take_profit
            ))

    return signals


def _compute_rsi(closes: List[float], period: int = 14) -> float:
    """Compute RSI from closing prices"""
    if len(closes) < period + 1:
        return 50.0

    gains = []
    losses = []

    for i in range(1, len(closes)):
        change = closes[i] - closes[i - 1]
        gains.append(max(0, change))
        losses.append(max(0, -change))

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


# ==========================================
# DISCORD ALERTS
# ==========================================

# Rate limiting for notifications
_last_notification_time = 0
MIN_NOTIFICATION_INTERVAL = 3600  # 1 hour in seconds

def send_discord_alert(signals: List[Signal]) -> int:
    """Send Discord webhook alert for short signals (MAX 3 per scan)"""
    global _last_notification_time
    
    """Send Discord webhook alert for short signals"""
    if not signals:
        return 0
    
    # Rate limiting: max 1 notification per hour
    current_time = time.time()
    if current_time - _last_notification_time < MIN_NOTIFICATION_INTERVAL:
        logger.info(f"⏳ Notification rate limited. Last sent {(current_time - _last_notification_time)/60:.1f} min ago. Skipping.")
        return 0
    
    _last_notification_time = current_time

    embeds = []

    for signal in signals:
        reasons_text = "\n".join(f"• {r}" for r in signal.reasons)

        embed = {
            "title": f"🎯 SHORT SIGNAL: {signal.symbol}",
            "description": f"**Current Price:** `{signal.price:.4f}`\n"
                           f"**Score:** `{signal.score}/100`\n\n"
                           f"**Setup Reasons:**\n{reasons_text}\n\n"
                           f"**Trade Parameters:**\n"
                           f"Entry: `{signal.price:.4f}` | SL: `{signal.stop_loss:.4f}` | TP: `{signal.take_profit:.4f}`\n"
                           f"**Risk:Reward:** `1:3` (1% SL / 3% TP)",
            "color": CARD_COLOR,
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "Short Hunter V3 • Dynamic Scanner • Top 30 High-Volume Pairs"}
        }
        embeds.append(embed)

    payload = {
        "embeds": embeds,
        "username": "Short Hunter V3"
    }

    try:
        resp = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
        resp.raise_for_status()
        logger.info(f"✅ Discord alert sent for {len(signals)} signal(s)")
        return len(signals)
    except Exception as e:
        logger.error(f"❌ Failed to send Discord alert: {e}")
        return 0


# ==========================================
# MAIN BOT LOOP
# ==========================================
def should_scan(minute: int, last_scan_minute: int, last_scan_hour: int) -> bool:
    """Check if we should scan this minute"""
    current_time = datetime.now()
    return (minute % SCAN_INTERVAL == 0) and (minute != last_scan_minute or current_time.hour != last_scan_hour)


def main():
    """Main bot loop"""
    logger.info("🚀 Short Hunter Bot V3 started!")
    logger.info(f"📅 Scan schedule: Every {SCAN_INTERVAL} minutes")
    logger.info(f"📊 Dynamic scanner: Top 30 high-volume OKX perps (min ${MIN_VOLUME_USDT:,} daily)")
    logger.info(f"🔔 Discord webhook: Configured")
    logger.info(f"⚙️  Mode: ALERTS ONLY - No trade tracking")

    fetcher = MarketDataFetcher()
    last_scan_minute = -1
    last_scan_hour = -1

    def shutdown(signum, frame):
        logger.info("🛑 Received shutdown signal. Shutting down gracefully...")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    while True:
        try:
            now = datetime.now()
            minute = now.minute

            logger.debug(f"🔍 should_scan: minute={minute}, hour={now.hour}, last_scan={last_scan_minute}/{last_scan_hour}, result={should_scan(minute, last_scan_minute, last_scan_hour)}")

            if should_scan(minute, last_scan_minute, last_scan_hour):
                logger.info(f"⏰ Scan time reached: {now.strftime('%H:%M:%S')}")

                # Fetch market data
                logger.info("🔍 Scanning for short opportunities...")
                market_data = fetcher.tick()

                if not market_data:
                    logger.warning("⚠️  No market data received. Skipping scan.")
                else:
                    # Analyze for signals
                    signals = analyze_market(market_data)

                    if not signals:
                        logger.info("✓ No short signals detected")
                    else:
                        total_found = len(signals)
                        signals_sent = send_discord_alert(signals)
                        if total_found > signals_sent:
                            logger.info(f"📊 Found {total_found} signals, sent TOP {signals_sent} (max 3/hour)")
                        else:
                            logger.info(f"📊 Found {signals_sent} short signal(s)!")
                        # Send alerts
                        send_discord_alert(signals)

                # Update last scan time
                last_scan_minute = minute
                last_scan_hour = now.hour

            # Sleep until next minute
            time.sleep(60)

        except KeyboardInterrupt:
            logger.info("👋 Bot stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
            time.sleep(30)


if __name__ == "__main__":
    main()
