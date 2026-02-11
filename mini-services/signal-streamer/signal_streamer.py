#!/usr/bin/env python3
"""
SRUS Real-Time Signal Streamer
Integrates Tactical Deviation + GPS Pro indicators
Sends signals directly to SRUS app - No Discord needed!
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import websockets
import aiohttp
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("signal_streamer.log"),
    ],
)
logger = logging.getLogger(__name__)

# Configuration
BINANCE_WS_URL = "wss://stream.binance.us:9443/ws"
SRUS_WEBHOOK_URL = os.getenv(
    "SRUS_WEBHOOK_URL", "http://localhost:3000/api/webhook/tradingview"
)
SYMBOLS = [
    "BTCUSDT",
    "ETHUSDT",
    "SOLUSDT",
    "XRPUSDT",
    "ADAUSDT",
    "LINKUSDT",
    "AVAXUSDT",
    "DOGEUSDT",
]

# Scan timer settings (from your Pine Script)
SCAN_INTERVAL_MINUTES = 15  # Scan every 15 minutes like your bots
SIGNAL_COOLDOWN_MINUTES = 15  # Min time between signals per symbol


class GPZone:
    """Golden Pocket Zone calculator"""

    def __init__(self):
        self.daily_high = {}
        self.daily_low = {}
        self.weekly_high = {}
        self.weekly_low = {}

    def calculate_gp_zones(
        self, symbol: str, prices: List[float]
    ) -> Dict[str, Tuple[float, float]]:
        """Calculate Golden Pocket zones (61.8% - 65% Fibonacci)"""
        if len(prices) < 20:
            return {}

        high = max(prices[-20:])
        low = min(prices[-20:])
        range_size = high - low

        # Golden Pocket: 61.8% to 65% retracement
        gp_high = low + (range_size * 0.618)
        gp_low = low + (range_size * 0.65)

        return {
            "daily": (gp_low, gp_high),
            "gp_high": gp_high,
            "gp_low": gp_low,
            "range_high": high,
            "range_low": low,
        }

    def is_price_in_gp_zone(self, price: float, gp_zones: Dict) -> bool:
        """Check if price is within Golden Pocket zone"""
        if not gp_zones or "gp_high" not in gp_zones:
            return False
        return gp_zones["gp_low"] <= price <= gp_zones["gp_high"]


class TacticalDeviation:
    """Tactical Deviation indicator"""

    def __init__(self):
        self.vwap_period = 100
        self.deviation_multipliers = [1.0, 2.0, 3.0]  # 1σ, 2σ, 3σ

    def calculate(self, prices: List[float], volumes: List[float]) -> Dict[str, Any]:
        """Calculate VWAP and deviation bands"""
        if len(prices) < 20 or len(volumes) < 20:
            return {"vwap": 0, "std_dev": 0, "deviation": 0}

        # Use last 100 candles for VWAP
        prices_arr = np.array(prices[-self.vwap_period :], dtype=float)
        volumes_arr = np.array(volumes[-self.vwap_period :], dtype=float)

        if volumes_arr.sum() == 0:
            vwap = float(prices_arr.mean())
        else:
            vwap = float(np.average(prices_arr, weights=volumes_arr))

        # Calculate standard deviation
        std_dev = float(np.std(prices_arr - vwap))

        # Current deviation
        current_price = prices[-1]
        deviation = (current_price - vwap) / std_dev if std_dev > 0 else 0

        return {
            "vwap": vwap,
            "std_dev": std_dev,
            "deviation": deviation,
            "current_price": current_price,
            "bands": {
                "upper_1": vwap + (std_dev * 1),
                "upper_2": vwap + (std_dev * 2),
                "upper_3": vwap + (std_dev * 3),
                "lower_1": vwap - (std_dev * 1),
                "lower_2": vwap - (std_dev * 2),
                "lower_3": vwap - (std_dev * 3),
            },
        }


class SignalStreamer:
    def __init__(self):
        self.ws = None
        self.price_history: Dict[str, List[float]] = {}
        self.volume_history: Dict[str, List[float]] = {}
        self.last_scan_time: Dict[str, datetime] = {}
        self.last_signal_time: Dict[str, datetime] = {}
        self.candle_data: Dict[str, List[Dict]] = {}

        # Indicators
        self.gp_indicator = GPZone()
        self.deviation_indicator = TacticalDeviation()

        # Scan timer
        self.next_scan_time = datetime.now()

    async def connect_binance(self):
        """Connect to Binance WebSocket"""
        try:
            streams = "/".join([f"{symbol.lower()}@ticker" for symbol in SYMBOLS])
            ws_url = f"{BINANCE_WS_URL}/{streams}"

            self.ws = await websockets.connect(ws_url)
            logger.info(f"✅ Connected to Binance WebSocket")

            for symbol in SYMBOLS:
                self.price_history[symbol] = []
                self.volume_history[symbol] = []
                self.candle_data[symbol] = []
                self.last_scan_time[symbol] = datetime.min
                self.last_signal_time[symbol] = datetime.min

            logger.info(f"📡 Monitoring {len(SYMBOLS)} symbols")
            logger.info(f"⏱️  Scan interval: {SCAN_INTERVAL_MINUTES} minutes")

        except Exception as e:
            logger.error(f"❌ Failed to connect: {e}")
            raise

    async def send_signal_to_srus(self, signal: Dict[str, Any]):
        """Send signal to SRUS webhook"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    SRUS_WEBHOOK_URL,
                    json=signal,
                    headers={"Content-Type": "application/json"},
                ) as response:
                    if response.status == 200:
                        logger.info(
                            f"✅ SIGNAL SENT: {signal['symbol']} {signal['side']} (Score: {signal['score']})"
                        )
                        return True
                    else:
                        logger.error(f"❌ Failed: {response.status}")
                        return False
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            return False

    def check_scan_timer(self, symbol: str) -> bool:
        """Check if enough time has passed since last scan"""
        now = datetime.now()
        last_scan = self.last_scan_time.get(symbol, datetime.min)
        time_diff = (now - last_scan).total_seconds() / 60  # minutes

        if time_diff >= SCAN_INTERVAL_MINUTES:
            self.last_scan_time[symbol] = now
            return True
        return False

    def check_signal_cooldown(self, symbol: str) -> bool:
        """Check cooldown between signals"""
        now = datetime.now()
        last_signal = self.last_signal_time.get(symbol, datetime.min)
        time_diff = (now - last_signal).total_seconds() / 60  # minutes

        return time_diff >= SIGNAL_COOLDOWN_MINUTES

    def calculate_confluence_score(
        self, deviation: float, in_gp_zone: bool, vwap: float, current_price: float
    ) -> int:
        """Calculate confluence score (0-100)"""
        score = 50  # Base score

        # Deviation score (up to 30 points)
        deviation_score = min(30, abs(deviation) * 10)
        score += deviation_score

        # GP Zone bonus (15 points)
        if in_gp_zone:
            score += 15

        # Trend alignment (5 points)
        if deviation < -2 and current_price < vwap:  # Oversold + below VWAP
            score += 5
        elif deviation > 2 and current_price > vwap:  # Overbought + above VWAP
            score += 5

        return min(100, int(score))

    def generate_signal(
        self, symbol: str, deviation_data: Dict, gp_zones: Dict
    ) -> Optional[Dict]:
        """Generate signal using BOTH indicators"""

        deviation = deviation_data["deviation"]
        vwap = deviation_data["vwap"]
        current_price = deviation_data["current_price"]

        # Check GP zone
        in_gp_zone = self.gp_indicator.is_price_in_gp_zone(current_price, gp_zones)

        # Calculate confluence score
        confluence_score = self.calculate_confluence_score(
            deviation, in_gp_zone, vwap, current_price
        )

        # Minimum score threshold (55 from your Pine Script)
        if confluence_score < 55:
            return None

        signal = None

        # LONG Signal conditions
        if deviation <= -2.0:
            side = "LONG"

            # Determine grade based on deviation + confluence
            if abs(deviation) >= 3.0 and confluence_score >= 75:
                grade = "A+"
                stop_loss = current_price * 0.975
                take_profit = current_price * 1.06
                score = min(98, confluence_score)
            elif abs(deviation) >= 2.5 or confluence_score >= 70:
                grade = "A"
                stop_loss = current_price * 0.98
                take_profit = current_price * 1.05
                score = min(90, confluence_score)
            else:
                grade = "B"
                stop_loss = current_price * 0.985
                take_profit = current_price * 1.04
                score = min(75, confluence_score)

            reasons = [
                f"📊 VWAP Deviation: {deviation:.2f}σ",
                f"🎯 Confluence Score: {confluence_score}/100",
                f"📈 Grade: {grade}",
            ]

            if in_gp_zone:
                reasons.append("✅ Golden Pocket Zone")

            signal = {
                "symbol": symbol.replace("USDT", ""),
                "side": side,
                "entry_price": current_price,
                "stop_loss": stop_loss,
                "take_profit": take_profit,
                "timeframe": "15m",
                "reasons": reasons,
                "score": score,
                "grade": grade,
                "indicator": "Tactical Deviation + GPS Pro",
                "timestamp": datetime.now().isoformat(),
                "metadata": {
                    "vwap": vwap,
                    "deviation": deviation,
                    "in_gp_zone": in_gp_zone,
                    "confluence_score": confluence_score,
                },
            }

        # SHORT Signal conditions
        elif deviation >= 2.0:
            side = "SHORT"

            if abs(deviation) >= 3.0 and confluence_score >= 75:
                grade = "A+"
                stop_loss = current_price * 1.025
                take_profit = current_price * 0.94
                score = min(98, confluence_score)
            elif abs(deviation) >= 2.5 or confluence_score >= 70:
                grade = "A"
                stop_loss = current_price * 1.02
                take_profit = current_price * 0.95
                score = min(90, confluence_score)
            else:
                grade = "B"
                stop_loss = current_price * 1.015
                take_profit = current_price * 0.96
                score = min(75, confluence_score)

            reasons = [
                f"📊 VWAP Deviation: +{deviation:.2f}σ",
                f"🎯 Confluence Score: {confluence_score}/100",
                f"📈 Grade: {grade}",
            ]

            if in_gp_zone:
                reasons.append("✅ Golden Pocket Zone")

            signal = {
                "symbol": symbol.replace("USDT", ""),
                "side": side,
                "entry_price": current_price,
                "stop_loss": stop_loss,
                "take_profit": take_profit,
                "timeframe": "15m",
                "reasons": reasons,
                "score": score,
                "grade": grade,
                "indicator": "Tactical Deviation + GPS Pro",
                "timestamp": datetime.now().isoformat(),
                "metadata": {
                    "vwap": vwap,
                    "deviation": deviation,
                    "in_gp_zone": in_gp_zone,
                    "confluence_score": confluence_score,
                },
            }

        return signal

    async def process_symbol_scan(self, symbol: str):
        """Run scan for a single symbol"""

        # Check scan timer
        if not self.check_scan_timer(symbol):
            return

        # Check signal cooldown
        if not self.check_signal_cooldown(symbol):
            return

        prices = self.price_history.get(symbol, [])
        volumes = self.volume_history.get(symbol, [])

        if len(prices) < 50 or len(volumes) < 50:
            return

        # Calculate Tactical Deviation
        deviation_data = self.deviation_indicator.calculate(prices, volumes)

        # Calculate Golden Pocket zones
        gp_zones = self.gp_indicator.calculate_gp_zones(symbol, prices)

        # Generate signal using BOTH indicators
        signal = self.generate_signal(symbol, deviation_data, gp_zones)

        if signal:
            self.last_signal_time[symbol] = datetime.now()
            await self.send_signal_to_srus(signal)
            logger.info(
                f"🚨 {signal['grade']} SIGNAL: {symbol} {signal['side']} @ {signal['entry_price']:.2f}"
            )

    async def process_message(self, message: str):
        """Process incoming WebSocket message"""
        try:
            data = json.loads(message)

            event_type = data.get("e", "")
            symbol = data.get("s", "")

            if not symbol or event_type != "24hrTicker":
                return

            current_price = float(data.get("c", 0))
            volume = float(data.get("v", 0))

            if current_price <= 0:
                return

            # Update price history
            self.price_history[symbol].append(current_price)
            self.volume_history[symbol].append(volume)

            if len(self.price_history[symbol]) > 200:
                self.price_history[symbol].pop(0)
            if len(self.volume_history[symbol]) > 200:
                self.volume_history[symbol].pop(0)

            # Run scan if timer allows
            await self.process_symbol_scan(symbol)

        except Exception as e:
            logger.error(f"❌ Error: {e}")

    async def run(self):
        """Main loop"""
        await self.connect_binance()

        while True:
            try:
                if self.ws is None:
                    await asyncio.sleep(5)
                    await self.connect_binance()
                    continue

                message = await self.ws.recv()
                if isinstance(message, bytes):
                    message = message.decode("utf-8")
                await self.process_message(message)

            except websockets.exceptions.ConnectionClosed:
                logger.warning("⚠️ Reconnecting...")
                await asyncio.sleep(5)
                await self.connect_binance()


async def main():
    """Entry point"""
    logger.info("=" * 60)
    logger.info("🚀 SRUS Signal Streamer Starting...")
    logger.info("📊 Indicators: Tactical Deviation + GPS Pro")
    logger.info(f"⏱️  Scan Timer: Every {SCAN_INTERVAL_MINUTES} minutes")
    logger.info(f"🎯 Min Score: 55/100")
    logger.info("=" * 60)

    streamer = SignalStreamer()

    try:
        await streamer.run()
    except KeyboardInterrupt:
        logger.info("👋 Shutting down...")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
