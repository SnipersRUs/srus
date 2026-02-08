#!/usr/bin/env python3
"""
Short Hunter Bot - Headless Discord Alert Bot
Scans for exhausted tops and sends Discord webhook alerts for short opportunities.
"""

import time
import logging
import requests
import json
import os
import signal
import sys
from datetime import datetime, timedelta, timezone
from collections import deque
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field

# ==========================================
# CONFIGURATION
# ==========================================
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1444925694290300938/ACddvkCxvrMz6I_LqbH7l4TOyhicCMh67g-kAtal8YPi0F-AZbXnZpYe7vzrQihJKo5X"
SIGNAL_SERVER_URL = "http://localhost:3001/webhook"
EXCHANGE = "OKX"
OKX_INSTRUMENTS_URL = "https://www.okx.com/api/v5/public/instruments"
OKX_CANDLES_URL = "https://www.okx.com/api/v5/market/candles"
OKX_INST_TYPE = "SWAP"
OKX_SETTLE = "USDT"
OKX_CANDLE_BAR = "15m"
OKX_CANDLE_LIMIT = 100
OKX_LOOKBACK = 96  # ~24h of 15m candles
TRADES_FILE = "/Users/bishop/Desktop/output/workspace-99190f76-187d-40a3-8ab6-30b756622125/public/data/active_trades.json"

# Global market data cache
market_data_cache: Dict[str, Dict] = {}

DEFAULT_ASSETS = [
    {"s": "BTCUSDT", "n": "Bitcoin"},
    {"s": "ETHUSDT", "n": "Ethereum"},
    {"s": "SOLUSDT", "n": "Solana"},
    {"s": "ARBUSDT", "n": "Arbitrum"},
    {"s": "OPUSDT", "n": "Optimism"},
    {"s": "PEPEUSDT", "n": "Pepe (Volatile)"},
    {"s": "WIFUSDT", "n": "dogwifhat"},
    {"s": "FETUSDT", "n": "Fetch.ai"},
]

# Trade limits
MAX_TRADES_PER_HOUR = 2  # Max 2 signals per hour
MAX_ACTIVE_TRADES = 3
SCAN_INTERVAL = 45  # Scan every 45 minutes
SCAN_MINUTE = 0  # Scan at the top of the hour (used for scheduling)
CARD_COLOR = 0x9B59B6  # Purple

# JSON feed for website
SIGNALS_JSON_FILE = "/Users/bishop/Desktop/github/SnipersRUs/public/signals.json"
MAX_JSON_SIGNALS = 10  # Keep last 10 signals

# Signal validity (how long signals stay on site)
SIGNAL_VALIDITY_MINUTES = 60  # Signals valid for 1 hour

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(), logging.FileHandler("short_hunter_bot.log")],
)
logger = logging.getLogger(__name__)

# Debug logging (NDJSON)
DEBUG_LOG_PATH = os.path.join(os.path.dirname(__file__), "debug.log")


def _debug_log(hypothesis_id: str, location: str, message: str, data: Dict):
    try:
        payload = {
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
        with open(DEBUG_LOG_PATH, "a") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass


def _ensure_single_instance(pid_file: str):
    # #region agent log
    _debug_log(
        "H6",
        "short_hunter_bot.py:83",
        "ensure_single_instance start",
        {
            "pid_file": pid_file,
            "pid_exists": os.path.exists(pid_file),
        },
    )
    # #endregion
    if os.path.exists(pid_file):
        try:
            with open(pid_file, "r") as f:
                pid_str = f.read().strip()
            if pid_str.isdigit():
                existing_pid = int(pid_str)
                if existing_pid != os.getpid():
                    try:
                        os.kill(existing_pid, 0)
                        # #region agent log
                        _debug_log(
                            "H6",
                            "short_hunter_bot.py:99",
                            "existing instance detected",
                            {"existing_pid": existing_pid},
                        )
                        # #endregion
                        logger.error(
                            f"❌ Bot already running (PID: {existing_pid}). Exiting."
                        )
                        raise SystemExit(1)
                    except OSError:
                        pass
        except Exception:
            pass
    try:
        with open(pid_file, "w") as f:
            f.write(str(os.getpid()))
    except Exception:
        pass


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
# JSON FEED FOR WEBSITE
# ==========================================
def save_signals_to_json(signals: List[Signal]):
    """Save signals to JSON file for website display. Appends new signals, keeps existing valid ones."""
    try:
        # Load existing signals
        existing_signals = []
        if os.path.exists(SIGNALS_JSON_FILE):
            try:
                with open(SIGNALS_JSON_FILE, "r") as f:
                    existing_signals = json.load(f)
            except:
                existing_signals = []

        # Filter out old signals (older than 60 minutes)
        now = datetime.now()
        valid_existing = []
        for sig in existing_signals:
            # Skip placeholder signals
            if sig.get("time") == "Waiting for bot...":
                continue
            # Check if signal is still valid (created within last 60 minutes)
            try:
                # Try to parse the timestamp if it exists
                sig_time = sig.get("timestamp", 0)
                if isinstance(sig_time, (int, float)):
                    age_minutes = (now.timestamp() - sig_time) / 60
                    if age_minutes < SIGNAL_VALIDITY_MINUTES:
                        valid_existing.append(sig)
                else:
                    # If no timestamp, keep it (fallback)
                    valid_existing.append(sig)
            except:
                valid_existing.append(sig)

        # Create new signal entries with timestamps
        new_signals = []
        current_timestamp = now.timestamp()
        for signal in signals:
            signal_entry = {
                "id": int(current_timestamp) + hash(signal.symbol) % 1000,
                "pair": signal.symbol,
                "type": "SHORT",
                "entry": f"{signal.price:.2f}",
                "target": f"{signal.take_profit:.2f}",
                "stop": f"{signal.stop_loss:.2f}",
                "confidence": min(100, signal.score),
                "time": now.strftime("%H:%M"),
                "timestamp": current_timestamp,
                "status": "ACTIVE",
                "source": "Short Hunter",
                "reasons": signal.reasons,
            }
            new_signals.append(signal_entry)

        # Combine: new signals first, then valid existing ones
        all_signals = new_signals + valid_existing
        all_signals = all_signals[:MAX_JSON_SIGNALS]  # Keep max 10

        # Save
        os.makedirs(os.path.dirname(SIGNALS_JSON_FILE), exist_ok=True)
        with open(SIGNALS_JSON_FILE, "w") as f:
            json.dump(all_signals, f, indent=2)

        logger.info(
            f"✅ Saved {len(new_signals)} new signals, {len(valid_existing)} existing kept, total: {len(all_signals)}"
        )

        # Send webhook to signal server
        send_webhook({"type": "signals_update", "signals": all_signals})

        return True
    except Exception as e:
        logger.error(f"❌ Error saving signals to JSON: {e}")
        return False


def send_webhook(data: Dict):
    """Send data to local signal server"""
    try:
        payload = {"source": "short_hunter", "data": data}
        requests.post(SIGNAL_SERVER_URL, json=payload, timeout=1)
    except Exception:
        # Fail silently if signal server is down
        pass


@dataclass
class ActiveTrade:
    symbol: str
    entry_price: float
    stop_loss: float
    take_profit: float
    signal_time: datetime
    reasons: List[str]
    score: int
    status: str = "ACTIVE"  # ACTIVE, CLOSED_TP, CLOSED_SL


# ==========================================
# TRADE PERSISTENCE
# ==========================================
class TradeTracker:
    """Track active trades and assign sequential numbers"""

    def __init__(self):
        self.active_trades: Dict[str, ActiveTrade] = {}
        self.trade_counter = 0
        self._load_trades()

    def _load_trades(self):
        """Load trades from file, filtering out closed trades"""
        if os.path.exists(TRADES_FILE):
            try:
                with open(TRADES_FILE, "r") as f:
                    data = json.load(f)
                    closed_count = 0
                    for symbol, trade_data in data.get("active_trades", {}).items():
                        status = trade_data.get("status", "ACTIVE")
                        # Only load ACTIVE trades, skip closed ones
                        if status == "ACTIVE":
                            self.active_trades[symbol] = ActiveTrade(
                                symbol=symbol,
                                entry_price=trade_data["entry_price"],
                                stop_loss=trade_data["stop_loss"],
                                take_profit=trade_data["take_profit"],
                                signal_time=datetime.fromisoformat(
                                    trade_data["signal_time"]
                                ),
                                reasons=trade_data["reasons"],
                                score=trade_data["score"],
                                status=status,
                            )
                        else:
                            closed_count += 1
                    self.trade_counter = data.get("trade_counter", 0)
                    if closed_count > 0:
                        logger.info(
                            f"📂 Loaded {len(self.active_trades)} active trades from disk (skipped {closed_count} closed trades)"
                        )
                        # Save cleaned up version
                        self._save_trades()
                    else:
                        logger.info(
                            f"📂 Loaded {len(self.active_trades)} active trades from disk"
                        )
            except Exception as e:
                logger.warning(f"⚠️  Failed to load trades: {e}")

    def _save_trades(self):
        """Save trades to file"""
        data = {"active_trades": {}, "trade_counter": self.trade_counter}
        for symbol, trade in self.active_trades.items():
            data["active_trades"][symbol] = {
                "entry_price": trade.entry_price,
                "stop_loss": trade.stop_loss,
                "take_profit": trade.take_profit,
                "signal_time": trade.signal_time.isoformat(),
                "reasons": trade.reasons,
                "score": trade.score,
                "status": trade.status,
            }
        try:
            with open(TRADES_FILE, "w") as f:
                json.dump(data, f, indent=2)

            # Send webhook update
            send_webhook(
                {"type": "active_trades_update", "active_trades": data["active_trades"]}
            )

        except Exception as e:
            logger.error(f"❌ Failed to save trades: {e}")

    def add_trade(self, signal: Signal, trade_number: int) -> bool:
        """Add a new active trade"""
        # #region agent log
        _debug_log(
            "H4",
            "short_hunter_bot.py:156",
            "add_trade called",
            {
                "symbol": signal.symbol,
                "trade_number": trade_number,
                "active_count": len(self.active_trades),
                "max_active": MAX_ACTIVE_TRADES,
            },
        )
        # #endregion
        if len(self.active_trades) >= MAX_ACTIVE_TRADES:
            logger.warning(
                f"⚠️  Max active trades ({MAX_ACTIVE_TRADES}) reached. Cannot add {signal.symbol}"
            )
            return False

        self.trade_counter = trade_number
        self.active_trades[signal.symbol] = ActiveTrade(
            symbol=signal.symbol,
            entry_price=signal.price,
            stop_loss=signal.stop_loss,
            take_profit=signal.take_profit,
            signal_time=datetime.now(),
            reasons=signal.reasons,
            score=signal.score,
            status="ACTIVE",
        )
        self._save_trades()
        logger.info(
            f"📝 Trade #{trade_number}: {signal.symbol} @ {signal.price:.2f} (SL: {signal.stop_loss:.2f}, TP: {signal.take_profit:.2f})"
        )
        return True

    def update_trade_status(
        self, symbol: str, status: str, current_price: float
    ) -> bool:
        """Update trade status based on price"""
        if symbol not in self.active_trades:
            return False

        trade = self.active_trades[symbol]
        closed = False

        if status == "CLOSED_TP" or (
            status == "ACTIVE" and current_price <= trade.take_profit
        ):
            trade.status = "CLOSED_TP"
            closed = True
            logger.info(
                f"🎯 Trade #{self.trade_counter}: {symbol} CLOSED AT TP ({current_price:.2f})"
            )
        elif status == "CLOSED_SL" or (
            status == "ACTIVE" and current_price >= trade.stop_loss
        ):
            trade.status = "CLOSED_SL"
            closed = True
            logger.info(
                f"🛑 Trade #{self.trade_counter}: {symbol} CLOSED AT SL ({current_price:.2f})"
            )

        if closed:
            # Remove closed trades from active list to free up slots
            if symbol in self.active_trades:
                del self.active_trades[symbol]
            self._save_trades()
            return True
        return False

    def get_trade_number(self, symbol: str) -> int:
        """Get the assigned trade number for a symbol"""
        if symbol in self.active_trades:
            return self.trade_counter
        return 0

    def remove_trade(self, symbol: str):
        """Remove a trade from tracking"""
        if symbol in self.active_trades:
            trade = self.active_trades[symbol]
            logger.info(f"🗑️  Removing {symbol} from tracking (status: {trade.status})")
            del self.active_trades[symbol]
            self._save_trades()

    def get_active_trades_count(self) -> int:
        return len(self.active_trades)

    def get_closed_trades_count(self) -> int:
        return self.trade_counter - len(self.active_trades)

    def _cleanup_closed_trades(self):
        """Remove any closed trades from active list (safety check)"""
        closed_symbols = []
        for symbol, trade in list(self.active_trades.items()):
            if trade.status in ["CLOSED_TP", "CLOSED_SL"]:
                closed_symbols.append(symbol)
                del self.active_trades[symbol]

        if closed_symbols:
            logger.info(
                f"🧹 Cleaned up {len(closed_symbols)} closed trade(s): {', '.join(closed_symbols)}"
            )
            self._save_trades()

    def get_next_trade_number(self) -> int:
        return self.trade_counter + 1


# ==========================================
# OKX API FUNCTIONS
# ==========================================
def _normalize_okx_symbol(inst_id: str) -> Optional[str]:
    if not inst_id.endswith("-SWAP"):
        return None
    parts = inst_id.split("-")
    if len(parts) != 3:
        return None
    base, quote, _ = parts
    if quote != "USDT":
        return None
    return f"{base}{quote}"


def load_okx_perps(
    limit: Optional[int] = None, retries: int = 3
) -> List[Dict[str, str]]:
    """Load OKX perpetuals with retry logic"""
    for attempt in range(retries):
        try:
            params = {"instType": OKX_INST_TYPE}
            resp = requests.get(OKX_INSTRUMENTS_URL, params=params, timeout=15)
            resp.raise_for_status()
            payload = resp.json()
            data = payload.get("data", [])
            symbols: List[Dict[str, str]] = []
            for item in data:
                if item.get("instType") != OKX_INST_TYPE:
                    continue
                if item.get("settleCcy") != OKX_SETTLE:
                    continue
                sym = _normalize_okx_symbol(item.get("instId", ""))
                if not sym:
                    continue
                # Skip stablecoin pairs (can't trade stablecoin vs stablecoin)
                base = sym.replace("USDT", "")
                stablecoins = [
                    "USDC",
                    "DAI",
                    "TUSD",
                    "FDUSD",
                    "PYUSD",
                    "USDE",
                    "EURT",
                    "USDD",
                    "BUSD",
                    "USDP",
                    "WBTC",
                    "CBETH",
                    "STETH",
                    "WETH",
                    "USDT",
                ]
                if (
                    base in stablecoins
                    or sym.startswith("USDC")
                    or sym.startswith("USDT")
                ):
                    logger.debug(f"Skipping stablecoin/wrapped pair: {sym}")
                    continue
                symbols.append({"s": sym, "n": base})
            symbols = sorted(symbols, key=lambda x: x["s"])
            if limit is not None and len(symbols) > limit:
                symbols = symbols[:limit]
            logger.info(
                f"📊 Loaded {len(symbols)} OKX perps"
                + (f" (limited to {limit})" if limit else "")
            )
            return symbols
        except requests.exceptions.RequestException as e:
            if attempt < retries - 1:
                wait_time = (attempt + 1) * 2
                logger.warning(
                    f"Retry {attempt + 1}/{retries} loading OKX perps after {wait_time}s: {e}"
                )
                time.sleep(wait_time)
            else:
                logger.error(
                    f"❌ Failed to load OKX perps after {retries} attempts: {e}"
                )
                return []
        except Exception as exc:
            logger.error(f"❌ Failed to load OKX perps: {exc}")
            return []
    return []


def tradingview_symbol(symbol: str) -> str:
    """Format symbol for TradingView OKX perp charts: OKX:BTCUSDT.P"""
    return f"OKX:{symbol}.P"


def _symbol_to_okx_inst(symbol: str) -> Optional[str]:
    if not symbol.endswith("USDT"):
        return None
    base = symbol[:-4]
    return f"{base}-USDT-SWAP"


def _compute_rsi(closes: List[float], period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    gains = []
    losses = []
    for i in range(1, period + 1):
        delta = closes[-i] - closes[-i - 1]
        if delta >= 0:
            gains.append(delta)
        else:
            losses.append(abs(delta))
    avg_gain = sum(gains) / period if gains else 0.0
    avg_loss = sum(losses) / period if losses else 0.0
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


# ==========================================
# MARKET DATA ENGINE (OKX LIVE)
# ==========================================
class MarketEngine:
    def __init__(self, assets: List[Dict[str, str]]):
        self.assets = assets
        self.session = requests.Session()
        self.trade_tracker = TradeTracker()

    def _fetch_candles(self, inst_id: str, retries: int = 3) -> List[List[float]]:
        """Fetch candles with retry logic for network resilience"""
        for attempt in range(retries):
            try:
                params = {
                    "instId": inst_id,
                    "bar": OKX_CANDLE_BAR,
                    "limit": OKX_CANDLE_LIMIT,
                }
                resp = self.session.get(OKX_CANDLES_URL, params=params, timeout=15)
                resp.raise_for_status()
                payload = resp.json()
                data = payload.get("data", [])
                candles = []
                for row in data:
                    try:
                        # [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
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
                    wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                    logger.debug(
                        f"Retry {attempt + 1}/{retries} for {inst_id} after {wait_time}s: {e}"
                    )
                    time.sleep(wait_time)
                else:
                    logger.warning(
                        f"Failed to fetch candles for {inst_id} after {retries} attempts: {e}"
                    )
                    return []
            except Exception as e:
                logger.warning(f"Unexpected error fetching candles for {inst_id}: {e}")
                return []
        return []

    def tick(self) -> Dict[str, Dict]:
        """Fetch real OKX 15m candles and build market snapshot"""
        data: Dict[str, Dict] = {}

        for asset in self.assets:
            symbol = asset["s"]
            inst_id = _symbol_to_okx_inst(symbol)
            if not inst_id:
                continue

            try:
                candles = self._fetch_candles(inst_id)
                if not candles or len(candles) < OKX_LOOKBACK:
                    logger.debug(
                        f"Not enough candles for {symbol}: {len(candles) if candles else 0}"
                    )
                    continue

                lookback = (
                    candles[-OKX_LOOKBACK:] if len(candles) >= OKX_LOOKBACK else candles
                )
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
                vwap = (
                    sum(t * v for t, v in zip(typicals, vols)) / vol_sum
                    if vol_sum > 0
                    else last_c
                )

                # Deviation (std dev of closes)
                mean_close = sum(closes) / len(closes)
                variance = sum((c - mean_close) ** 2 for c in closes) / len(closes)
                std_dev = variance**0.5 if variance > 0 else 1.0
                dev = round((last_c - vwap) / std_dev, 2) if std_dev > 0 else 0.0

                # RSI
                rsi = _compute_rsi(closes, 14)

                # Liquidity sweep (break + reject)
                prev_high = (
                    max([c[1] for c in candles[-21:-1]]) if len(candles) > 21 else high
                )
                is_sweep = last_h > prev_high and last_c < prev_high

                # Volume spikes (20-period MA + std dev)
                vol_slice = vols[-20:] if len(vols) >= 20 else vols
                vol_ma = sum(vol_slice) / len(vol_slice)
                vol_var = sum((v - vol_ma) ** 2 for v in vol_slice) / len(vol_slice)
                vol_std = vol_var**0.5
                dynamic_threshold = vol_ma + vol_std * 2.0
                extreme_threshold = vol_ma + vol_std * 3.5
                is_abnormal_volume = last_v > dynamic_threshold
                is_extreme_volume = last_v > extreme_threshold

                # Check if trade should be closed
                if symbol in self.trade_tracker.active_trades:
                    current_price = last_c
                    self.trade_tracker.update_trade_status(
                        symbol, "ACTIVE", current_price
                    )

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

        return data


# ==========================================
# STRATEGY LOGIC (SHORT HUNTER)
# ==========================================
def analyze_market(
    market_data: Dict[str, Dict], trade_tracker: TradeTracker, trades_this_hour: int
):
    """Analyze market data for short opportunities and build watchlist

    Returns:
        signals: List[Signal] that qualify as full short setups
        watchlist: List[Tuple[symbol, distance_pct, gp_resist, price]]
    """
    signals: List[Signal] = []
    watch_candidates = []

    # Trade limit check
    if trades_this_hour >= MAX_TRADES_PER_HOUR:
        logger.info(
            f"⚠️  Hourly trade limit ({MAX_TRADES_PER_HOUR}/{MAX_TRADES_PER_HOUR}) reached. Skipping new signals."
        )
        return signals

    for symbol, coin in market_data.items():
        # Skip if already have active trade (unless closed)
        if symbol in trade_tracker.active_trades:
            continue

        reasons = []
        score = 0

        # 1. GPS Resistance Logic
        range_val = coin["high"] - coin["low"]
        gp_resist = coin["low"] + (range_val * 0.65)

        price = coin["price"]
        # Distance from resistance in %
        dist_pct = ((gp_resist - price) / gp_resist) * 100 if gp_resist > 0 else 0.0

        if price >= gp_resist:
            score += 30
            reasons.append(f"Price at GPS Resistance Zone ({gp_resist:.2f})")
        else:
            # Collect for watchlist if within 5% below resistance
            if 0 <= dist_pct <= 5:
                watch_candidates.append((symbol, dist_pct, gp_resist, price))

        # 2. Deviation Zones (Overextension)
        if coin["dev"] > 2.5:
            score += 40
            reasons.append("Deviation +3 Sigma Zone (Overextended)")
        elif coin["dev"] > 2.0:
            score += 20
            reasons.append("Deviation +2 Sigma Zone")

        # 3. Bearish Divergence
        price_above_vwap = coin["price"] > coin["vwap"]
        rsi_weak = coin["rsi"] < 55

        if price_above_vwap and rsi_weak:
            score += 20
            reasons.append("Bearish Divergence (Price Up, RSI Exhausted)")

        # 4. Liquidity Sweep / SFP
        if coin["is_sweep"]:
            score += 15
            reasons.append("Liquidity Sweep (SFP High)")

        # 5. Exhausted Volume
        if coin["dev"] > 2.0 and rsi_weak:
            score += 10
            reasons.append("Buyer Exhaustion Detected")

        # 6. 15m Abnormal Volume Spike (Potential Reversal)
        if coin["is_extreme_volume"]:
            score += 25
            reasons.append("15m Extreme Volume Spike (Potential Reversal)")
        elif coin["is_abnormal_volume"]:
            score += 15
            reasons.append("15m Abnormal Volume Spike (Potential Reversal)")

        # Final decision
        if score >= 70:
            signals.append(
                Signal(
                    symbol=symbol,
                    price=price,
                    score=score,
                    reasons=reasons,
                    stop_loss=price * 1.01,  # 1% SL above
                    take_profit=price * 0.98,  # 2% TP below (scalping target)
                )
            )

    # Build top-3 watchlist by closest distance to resistance
    watchlist = sorted(watch_candidates, key=lambda x: x[1])[:3]
    return signals, watchlist


# ==========================================
# DISCORD WEBHOOK INTEGRATION
# ==========================================

# State persistence for notification rate limiting
STATE_FILE = "bot_state.json"
_last_notification_time = 0  # Initialize globally first


def _load_state():
    global _last_notification_time
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                state = json.load(f)
                _last_notification_time = state.get("last_notification_time", 0)
        except Exception:
            _last_notification_time = 0
    else:
        _last_notification_time = 0


def _save_state():
    try:
        with open(STATE_FILE, "w") as f:
            json.dump({"last_notification_time": _last_notification_time}, f)
    except Exception:
        pass


_load_state()


def send_twitter_alert(signals: List[Signal], trade_tracker: TradeTracker) -> bool:
    """Send Twitter alert for short signals via bird CLI"""
    if not signals:
        return True

    try:
        # Format tweet for best signal
        best_signal = signals[0]  # Take highest score signal
        symbol_clean = best_signal.symbol.replace("USDT", "")

        # Create tweet content
        tweet = f"🔴 SHORT SIGNAL: {symbol_clean}\n\n"
        tweet += f"Price: ${best_signal.price:.2f}\n"
        tweet += f"Stop: ${best_signal.stop_loss:.2f}\n"
        tweet += f"Target: ${best_signal.take_profit:.2f}\n\n"
        tweet += f"Score: {best_signal.score}/100\n"
        tweet += f"Strategy: GPS + Deviation\n\n"
        tweet += f"via Short Hunter 🤖 | @brypto_sniper"

        # Post via bird CLI
        result = subprocess.run(
            ["bird", "tweet", tweet], capture_output=True, text=True, timeout=30
        )

        if result.returncode == 0:
            logger.info(f"✅ Twitter alert sent for {best_signal.symbol}")
            return True
        else:
            logger.error(f"❌ Twitter alert failed: {result.stderr}")
            return False

    except Exception as e:
        logger.error(f"❌ Error sending Twitter alert: {e}")
        return False


def send_discord_alert(
    signals: List[Signal], trade_tracker: TradeTracker, watchlist=None
) -> bool:
    """Send Discord webhook alert for short signals - all on one card, plus watchlist"""
    global _last_notification_time

    # Rate limiting: max 1 notification per hour
    current_time = time.time()
    if current_time - _last_notification_time < MIN_NOTIFICATION_INTERVAL:
        logger.info(
            f"⏳ Notification rate limited. Last sent {(current_time - _last_notification_time) / 60:.1f} min ago. Skipping."
        )
        return False

    _last_notification_time = current_time
    _save_state()

    try:
        # #region agent log
        _debug_log(
            "H5",
            "short_hunter_bot.py:388",
            "send_discord_alert start",
            {
                "signals_count": len(signals),
                "active_trades": trade_tracker.get_active_trades_count(),
            },
        )
        # #endregion
        # Format trade lines for Discord content
        trade_lines = []
        for i, signal in enumerate(signals, 1):
            trade_num = trade_tracker.get_next_trade_number() + i - 1
            tv_url = f"https://www.tradingview.com/chart/?symbol={tradingview_symbol(signal.symbol)}"

            # Format as clickable TradingView link
            trade_lines.append(f"**#{trade_num}:** **[{signal.symbol}]({tv_url})**")
            trade_lines.append(
                f"Entry: `{signal.price:.4f}` | SL: `{signal.stop_loss:.4f}` | TP: `{signal.take_profit:.4f}`"
            )
            trade_lines.append(
                f"Score: `{signal.score}/100` | RSI: `{market_data_cache.get(signal.symbol, {}).get('rsi', 0):.1f}` | Dev: `{market_data_cache.get(signal.symbol, {}).get('dev', 0):.1f}σ`"
            )
            trade_lines.append(f"— {', '.join(signal.reasons)}")

        trade_lines_text = "\n".join(trade_lines)

        # Build watchlist block (top 3 coins approaching resistance)
        watchlist_lines = []
        if watchlist:
            watchlist_lines.append("───────────────────")
            watchlist_lines.append(
                "🔭 **3-COIN WATCHLIST – Approaching GPS Resistance**"
            )
            for symbol, dist_pct, gp_resist, price in watchlist:
                tv_url = f"https://www.tradingview.com/chart/?symbol={tradingview_symbol(symbol)}"
                watchlist_lines.append(
                    f"• **[{symbol}]({tv_url})** | Price: `{price:.4g}` | GP: `{gp_resist:.4g}` | `{dist_pct:.2f}%` away"
                )
        watchlist_text = "\n".join(watchlist_lines) if watchlist_lines else ""

        # Create Discord embed - ORANGE COLOR
        embed = {
            "title": f"🔴 SHORT HUNTER: {len(signals)} NEW TRADE{'S' if len(signals) > 1 else ''}",
            "description": (
                f"**TOPS HUNTED - SHORT OPPORTUNIT{'Y' if len(signals) > 1 else 'IES'} DETECTED**\n\n"
                f"{trade_lines_text}"
                + ("\n\n" + watchlist_text if watchlist_text else "")
            ),
            "color": CARD_COLOR,  # Orange
            "fields": [
                {
                    "name": f"📝 Active Trades: {trade_tracker.get_active_trades_count()}/{MAX_ACTIVE_TRADES}",
                    "value": f"Closed Today: {trade_tracker.get_closed_trades_count()}",
                    "inline": True,
                },
                {
                    "name": "⏰ Signal Time",
                    "value": f"<t:{int(time.time())}:F>",
                    "inline": True,
                },
            ],
            "footer": {
                "text": "Short Hunter | GPS + Deviation Top Reversal Strategy | OKX 15m Candles"
            },
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }

        payload = {
            "username": "Short Hunter",
            "embeds": [embed],
            "content": f"🚨 **SHORT ALERT{'S' if len(signals) > 1 else ''}** 🚨\n\n{len(signals)} new trade{'s' if len(signals) > 1 else ''} detected! Pin this card! 📌",
        }

        try:
            response = requests.post(
                DISCORD_WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Network error sending Discord alert: {e}")
            return False

        # #region agent log
        _debug_log(
            "H5",
            "short_hunter_bot.py:451",
            "send_discord_alert response",
            {
                "status_code": response.status_code,
                "signals_count": len(signals),
            },
        )
        # #endregion

        if response.status_code in (200, 201, 204):
            logger.info(f"✅ Discord alert sent for {len(signals)} signal(s)")
            return True
        else:
            logger.error(
                f"❌ Failed to send Discord alert: {response.status_code} - {response.text}"
            )
            return False

    except Exception as e:
        logger.error(f"❌ Error sending Discord alert: {e}")
        return False


# ==========================================
# MAIN BOT LOOP
# ==========================================
class ShortHunterBot:
    def __init__(self):
        self.running = True
        self.assets = load_okx_perps()
        if len(self.assets) < 100:
            logger.warning(
                f"⚠️  OKX perps load returned {len(self.assets)} symbols. Falling back to defaults."
            )
            if not self.assets:
                logger.warning("⚠️  Using default assets as fallback")
                self.assets = DEFAULT_ASSETS
        self.engine = MarketEngine(self.assets)
        self.trade_tracker = TradeTracker()
        self.trades_this_hour = 0
        self.current_hour = datetime.now().hour
        self.last_scan_time = 0  # Timestamp of last successful scan
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        logger.info("🚀 Short Hunter Bot initialized")

    def _signal_handler(self, signum, frame):
        """Handle termination signals gracefully"""
        logger.info(f"🛑 Received signal {signum}. Shutting down gracefully...")
        self.running = False

    def reset_hourly_limits(self):
        """Reset trade limits on new hour"""
        now = datetime.now()
        if now.hour != self.current_hour:
            self.current_hour = now.hour
            self.trades_this_hour = 0
            logger.info(
                f"⏰ Hour {self.current_hour:02d} started. Trade limit reset (0/{MAX_TRADES_PER_HOUR})"
            )

    def should_scan(self) -> bool:
        """Check if it's time to scan based on SCAN_INTERVAL"""
        current_time = time.time()
        # Initial scan or enough time has passed
        should = (current_time - self.last_scan_time) >= (SCAN_INTERVAL * 60)

        # Log periodically to show heartbeat
        now = datetime.now()
        if now.second == 0 and now.minute % 5 == 0:
            next_scan = self.last_scan_time + (SCAN_INTERVAL * 60)
            wait_min = max(0, (next_scan - current_time) / 60)
            logger.info(
                f"⏳ Heartbeat: Next scan in {wait_min:.1f} min | Active: {self.trade_tracker.get_active_trades_count()}/{MAX_ACTIVE_TRADES}"
            )

        return should

    def run_scan(self):
        """Run market scan and send alerts"""
        global market_data_cache
        self.last_scan_time = time.time()
        now = datetime.now()
        logger.info(
            f"🔍 Scanning for short opportunities at {now.strftime('%H:%M:%S')} (Interval: {SCAN_INTERVAL}m)..."
        )

        # #region agent log
        _debug_log(
            "H1",
            "short_hunter_bot.py:560",
            "run_scan start",
            {
                "time": now.strftime("%H:%M:%S"),
                "trades_this_hour": self.trades_this_hour,
                "active_trades": self.trade_tracker.get_active_trades_count(),
            },
        )
        # #endregion

        # Update market data
        market_data_cache = self.engine.tick()
        # #region agent log
        _debug_log(
            "H2",
            "short_hunter_bot.py:571",
            "market_data_cache fetched",
            {
                "pairs_count": len(market_data_cache),
            },
        )
        # #endregion

        # #region agent log
        _debug_log(
            "H3",
            "short_hunter_bot.py:578",
            "pre market_data check",
            {
                "market_data_cache_empty": len(market_data_cache) == 0,
                "market_data_defined": "market_data" in globals(),
            },
        )
        # #endregion
        if not market_data_cache:
            logger.warning("⚠️  No market data returned from OKX. Skipping scan.")
            return

        # Log current market state
        logger.info(f"📈 Market data updated for {len(market_data_cache)} pairs")

        # Analyze for signals + watchlist
        signals, watchlist = analyze_market(
            market_data_cache, self.trade_tracker, self.trades_this_hour
        )
        # #region agent log
        _debug_log(
            "H2",
            "short_hunter_bot.py:593",
            "signals computed",
            {
                "signals_count": len(signals),
                "active_trades": self.trade_tracker.get_active_trades_count(),
            },
        )
        # #endregion

        if signals:
            total_found = len(signals)
            logger.info(f"📊 Found {total_found} potential signal(s)!")

            # Add all trades first (sequential numbering)
            added_signals = []
            for signal in signals:
                trade_num = self.trade_tracker.get_next_trade_number()
                if not self.trade_tracker.add_trade(signal, trade_num):
                    logger.warning(
                        f"⚠️  Could not add trade {signal.symbol} (max active: {MAX_ACTIVE_TRADES})"
                    )
                    continue
                self.trades_this_hour += 1
                added_signals.append(signal)

            # Send single Discord alert with all trades + watchlist
            if added_signals:
                logger.info(
                    f"📤 Sending Discord alert for {len(added_signals)} signal(s)"
                )
                # We always send the watchlist along with signals
                if send_discord_alert(added_signals, self.trade_tracker, watchlist):
                    logger.info(
                        f"✅ Discord alert sent! Trades this hour: {self.trades_this_hour}/{MAX_TRADES_PER_HOUR}"
                    )
                else:
                    logger.error("❌ Failed to send Discord alert")

                # Save signals to JSON for website
                save_signals_to_json(added_signals)

                # Also send Twitter alert
                logger.info(f"🐦 Sending Twitter alert...")
                if send_twitter_alert(added_signals, self.trade_tracker):
                    logger.info(f"✅ Twitter alert sent!")
                else:
                    logger.warning(
                        "⚠️ Twitter alert failed (rate limited or auth issue)"
                    )
            elif watchlist:
                logger.info(
                    f"✓ No new trades added (limit reached or already active). Watchlist: {[w[0] for w in watchlist]}"
                )
            else:
                logger.info("✓ No new signals or watchlist items.")
        else:
            logger.info(
                f"✓ No short signals detected (Active: {self.trade_tracker.get_active_trades_count()}/{MAX_ACTIVE_TRADES}, Trades/hour: {self.trades_this_hour}/{MAX_TRADES_PER_HOUR})"
            )

    def run(self):
        """Main bot loop"""
        logger.info("🎯 Short Hunter Bot started!")
        logger.info(f"📅 Scan schedule: Every {SCAN_INTERVAL} minutes")
        sample = ", ".join([a["s"] for a in self.assets[:15]])
        logger.info(f"📊 Monitoring {len(self.assets)} OKX perps (sample: {sample})")
        logger.info(f"🔔 Discord webhook: Configured")
        logger.info(f"🐦 Twitter alerts: Configured (@_sniperguru)")
        logger.info(
            f"📝 Max active trades: {MAX_ACTIVE_TRADES} | Trade persistence: {TRADES_FILE}"
        )

        # Clean up any closed trades that might have been loaded
        self.trade_tracker._cleanup_closed_trades()

        last_scan_minute = -1
        last_scan_hour = -1

        while self.running:
            try:
                now = datetime.now()

                # Reset hourly limits
                self.reset_hourly_limits()

                # Check if it's scan time
                if self.should_scan():
                    logger.info(f"⏰ Scan time reached: {now.strftime('%H:%M:%S')}")
                    # #region agent log
                    _debug_log(
                        "H1",
                        "short_hunter_bot.py:631",
                        "scan trigger",
                        {
                            "minute": now.minute,
                            "second": now.second,
                        },
                    )
                    # #endregion
                    self.run_scan()

                # Sleep briefly to avoid CPU spike

                # Sleep until next second (check running flag frequently)
                for _ in range(10):
                    if not self.running:
                        break
                    time.sleep(0.1)

            except KeyboardInterrupt:
                logger.info("🛑 Bot stopped by user")
                self.running = False
                break
            except SystemExit:
                logger.info("🛑 Bot exiting")
                self.running = False
                break
            except Exception as e:
                logger.error(f"❌ Error in bot loop: {e}", exc_info=True)
                import traceback

                logger.error(traceback.format_exc())
                # Wait before retrying, but don't crash
                if self.running:
                    logger.info("⏳ Waiting 10 seconds before retrying...")
                    for _ in range(100):  # Check running flag during wait
                        if not self.running:
                            break
                        time.sleep(0.1)

        logger.info("👋 Bot shutdown complete")


# ==========================================
# ENTRY POINT
# ==========================================
if __name__ == "__main__":
    try:
        _ensure_single_instance("short_hunter_bot.pid")
        bot = ShortHunterBot()
        bot.run()
    except SystemExit:
        # Clean exit
        pass
    except Exception as e:
        logger.critical(f"💥 Fatal error: {e}", exc_info=True)
        sys.exit(1)
    finally:
        # Cleanup PID file on exit
        pid_file = "short_hunter_bot.pid"
        if os.path.exists(pid_file):
            try:
                with open(pid_file, "r") as f:
                    pid_str = f.read().strip()
                if pid_str.isdigit() and int(pid_str) == os.getpid():
                    os.remove(pid_file)
            except Exception:
                pass
