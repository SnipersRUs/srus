#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bounty Seeker v5 — Ultimate Reversal Hunter Bot (LONG ONLY)
Focused on: Deviation VWAP setups (2σ/3σ), Liquidation zones, GPS proximity
Strategy: LONGS at extreme bottoms for mean reversion
Paper Trading: $1,000 starting capital, max 3 open trades, max 3 trades per scan
"""

import os
import sys
import json
import time
import fcntl  # For lock file
import traceback
import requests
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import ccxt
import numpy as np

# ====================== CONFIGURATION ======================
SCAN_INTERVAL_SEC = 3600  # 60 minutes for active scanning
CONFIG_PATH = "config.json"
DATA_DIR = "../../public/data"
LOCK_FILE = os.path.join(DATA_DIR, "bounty_seeker.lock")
STATE_FILE = os.path.join(DATA_DIR, "bounty_seeker_status.json")
TRADES_DB = os.path.join(DATA_DIR, "bounty_seeker_trades.db")
os.makedirs(DATA_DIR, exist_ok=True)

# Trading parameters
LEVERAGE = 15
PAPER_CAPITAL = 1000.0  # Starting capital
MAX_OPEN_TRADES = 3
RISK_PERCENT = 2.0  # Risk 2% per trade
MIN_RR_RATIO = 2.0  # Minimum 2:1 reward:risk

# Signal quality - Focused on HIGH QUALITY reversals only
MIN_CONFIDENCE = 6  # 6/10 minimum - Lowered to find more opportunities (was 7)
A_PLUS_CONFIDENCE = 8  # A+ grade minimum (8/10) - High quality reversals

# Technical parameters
ATR_PERIOD = 14
RSI_PERIOD = 14
VOLUME_LOOKBACK = 20
VWAP_LOOKBACK = 200  # For deviation calculations
LIQUIDATION_LOOKBACK = 100

# Deviation VWAP thresholds
DEVIATION_2SIGMA = 2.0  # 2σ deviation
DEVIATION_3SIGMA = 3.0  # 3σ deviation (preferred)

# GPS proximity threshold (percentage)
GPS_PROXIMITY_PCT = 0.5  # Within 0.5% of GPS

# Watchlist settings
# Only scan the top 30 perpetual futures pairs by 24h volume
SCAN_WATCHLIST_SIZE = 30
REPORT_WATCHLIST_SIZE = 3  # Top 3 watchlist coins to report
WATCHLIST_COOLDOWN_SEC = 3600  # 60min cooldown per symbol

# Signal rate limiting
MAX_SIGNALS_PER_HOUR = 3  # Maximum 3 signals per scan (max 3 trades at a time)

# Volume filter
MIN_24H_VOLUME_USD = 300000  # Minimum $300,000 24h volume

# Repeat-trade control
# After taking a trade on a symbol, don't keep retrying different levels.
# Only allow another signal if it's effectively the *same* setup
# (entry/stop nearly identical) OR enough time has passed.
REPEAT_TRADE_COOLDOWN_SEC = 24 * 3600  # 24h cooldown for new levels on same symbol

# Stablecoins to exclude (no stablecoin vs stablecoin trading)
STABLECOINS = {
    "USDT", "USDC", "BUSD", "DAI", "TUSD", "USDP", "USDD", "FDUSD",
    "PYUSD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "NZD"
}

# Gold and Silver related assets to exclude
PRECIOUS_METALS = {
    "XAU", "PAXG", "XAG", "XAUT", "GOLD", "SILVER", "XPD", "XPT", "XDR"
}

# Tokenized stocks to exclude
STOCK_TICKERS = {
    'TSLA', 'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'NFLX', 'DIS',
    'V', 'JPM', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'HD', 'PYPL', 'BAC', 'XOM', 'CVX',
    'ABBV', 'PFE', 'KO', 'AVGO', 'COST', 'PEP', 'TMO', 'ABT', 'MRK', 'CSCO', 'ACN',
    'ADBE', 'NKE', 'TXN', 'CMCSA', 'DHR', 'VZ', 'LIN', 'PM', 'NEE', 'RTX', 'HON',
    'UPS', 'QCOM', 'AMGN', 'T', 'LOW', 'INTU', 'SPGI', 'AMAT', 'DE', 'BKNG', 'C',
    'SBUX', 'AXP', 'ADI', 'ISRG', 'GILD', 'ADP', 'SYK', 'CL', 'MDT', 'TJX', 'ZTS',
    'GE', 'MMC', 'CI', 'APH', 'MO', 'SHW', 'ITW', 'WM', 'ETN', 'ICE', 'KLAC', 'CDNS',
    'SNPS', 'FTNT', 'MCHP', 'NXPI', 'CTAS', 'FAST', 'IDXX', 'PAYX', 'ODFL', 'CTSH',
    'AON', 'ANSS', 'KEYS', 'WDAY', 'ON', 'CDW', 'EXPD', 'FDS', 'BR', 'NDAQ', 'POOL',
    'CPRT', 'MCO', 'TTD', 'ZM', 'DOCN', 'DOCU', 'ROKU', 'PTON', 'SPOT', 'SNAP', 'TWTR',
    'SQ', 'SHOP', 'CRWD', 'OKTA', 'NET', 'DDOG', 'ZS', 'MDB', 'ESTC', 'NOW', 'TEAM',
    'PLTR', 'SNOW', 'RBLX', 'HOOD', 'COIN', 'LCID', 'RIVN', 'F', 'GM', 'FORD',
    'AMD', 'INTC', 'MU', 'LRCX', 'SMCI', 'SOFI', 'UPST', 'IWM', 'QQQ', 'SPY', 'DIA'
}

# Macro coins to exclude (we have a separate bot for these)
MACRO_COINS = {
    "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "AVAX", "DOGE", 
    "TRX", "LINK", "MATIC", "DOT", "UNI", "LTC", "ATOM", "ETC"
}

# Exchange selection (MEXC for altcoins)
PREFERRED_EXCHANGE = "mexc"  # Options: "mexc", "okx", or "kraken"

# Discord webhook
DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1432976746692612147/SLf6oNcxTZfnmt1LmGLv-asGHwi-BnR2T8XIneUr7zM1tTbsSMncMZgzytvTFiAHmpcr"

# ====================== HELPER FUNCTIONS ======================
def calculate_rsi(prices: List[float], period: int = 14) -> float:
    """Calculate RSI indicator"""
    if len(prices) < period + 1:
        return 50.0
    deltas = np.diff(prices[-period-1:])
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    avg_gain = np.mean(gains)
    avg_loss = np.mean(losses)
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def calculate_atr(highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> float:
    """Calculate Average True Range"""
    if len(highs) < period + 1:
        return 0.0
    tr_list = []
    for i in range(-period, 0):
        hi_lo = highs[i] - lows[i]
        hi_cl = abs(highs[i] - closes[i-1]) if i > -len(closes) else hi_lo
        lo_cl = abs(lows[i] - closes[i-1]) if i > -len(closes) else hi_lo
        tr_list.append(max(hi_lo, hi_cl, lo_cl))
    return float(np.mean(tr_list)) if tr_list else 0.0


def calculate_vwap_and_deviation(ohlcv: List) -> Tuple[float, float, float, float, float]:
    """
    Calculate VWAP and deviation bands
    Returns: (vwap, std_dev, upper_2sigma, lower_2sigma, lower_3sigma)
    """
    if len(ohlcv) < 50:
        return None, None, None, None, None

    # Calculate VWAP (Volume Weighted Average Price)
    total_pv = 0.0  # Price * Volume
    total_volume = 0.0
    prices = []
    volumes = []

    for candle in ohlcv:
        price = float(candle[4])  # Close price
        vol = float(candle[5])  # Volume
        total_pv += price * vol
        total_volume += vol
        prices.append(price)
        volumes.append(vol)

    if total_volume == 0:
        return None, None, None, None, None

    vwap = total_pv / total_volume

    # Calculate standard deviation
    variance = 0.0
    for i, price in enumerate(prices):
        weight = volumes[i] / total_volume
        variance += weight * ((price - vwap) ** 2)

    std_dev = np.sqrt(variance) if variance > 0 else 0.0

    # Calculate deviation bands
    upper_2sigma = vwap + (std_dev * DEVIATION_2SIGMA)
    lower_2sigma = vwap - (std_dev * DEVIATION_2SIGMA)
    lower_3sigma = vwap - (std_dev * DEVIATION_3SIGMA)

    return vwap, std_dev, upper_2sigma, lower_2sigma, lower_3sigma


def calculate_gps(high: float, low: float) -> Tuple[float, float]:
    """
    Calculate Golden Pocket (61.8% - 65% Fibonacci retracement)
    Returns: (gp_high, gp_low)
    """
    if high <= low:
        return None, None
    range_size = high - low
    gp_high = high - (range_size * 0.618)  # 61.8% retracement
    gp_low = high - (range_size * 0.65)    # 65% retracement
    return gp_high, gp_low


def detect_liquidation_zones(highs: List[float], lows: List[float], closes: List[float],
                             volumes: List[float], timeframe: str = "1h") -> Dict:
    """
    Detect potential liquidation zones based on volume spikes and wick rejections
    Returns dict with liquidation levels and importance
    """
    if len(highs) < 20:
        return {"levels": [], "importance": []}

    avg_volume = np.mean(volumes[-20:])
    liquidation_levels = []
    importance_scores = []

    # Look for high volume candles with large wicks (liquidation candles)
    for i in range(-min(50, len(highs)), 0):
        vol_ratio = volumes[i] / avg_volume if avg_volume > 0 else 0
        body = abs(closes[i] - (highs[i] + lows[i]) / 2)
        wick_lower = min(closes[i], (highs[i] + lows[i]) / 2) - lows[i]
        wick_upper = highs[i] - max(closes[i], (highs[i] + lows[i]) / 2)
        total_range = highs[i] - lows[i]

        if total_range == 0:
            continue

        wick_ratio = max(wick_lower, wick_upper) / total_range

        # Detect liquidation: high volume + large wick
        if vol_ratio > 2.0 and wick_ratio > 0.4:
            if wick_lower > wick_upper:
                # Long liquidation (bearish wick below)
                level = lows[i]
                importance = min(100, (vol_ratio - 2.0) * 20 + wick_ratio * 30)
            else:
                # Short liquidation (bullish wick above)
                level = highs[i]
                importance = min(100, (vol_ratio - 2.0) * 20 + wick_ratio * 30)

            liquidation_levels.append(level)
            importance_scores.append(importance)

    return {"levels": liquidation_levels, "importance": importance_scores}


def check_proximity_to_liquidation(price: float, liquidation_levels: List[float],
                                   importance_scores: List[float], threshold_pct: float = 1.0) -> Tuple[bool, float]:
    """
    Check if price is near a liquidation zone
    Returns: (is_near, importance_score)
    """
    if not liquidation_levels:
        return False, 0.0

    for level, importance in zip(liquidation_levels, importance_scores):
        distance_pct = abs(price - level) / price * 100
        if distance_pct <= threshold_pct:
            return True, importance

    return False, 0.0


# ====================== DATABASE SETUP ======================
def init_database():
    """Initialize SQLite database for trade tracking"""
    conn = sqlite3.connect(TRADES_DB)
    c = conn.cursor()

    # Trades table
    c.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            exchange TEXT NOT NULL,
            direction TEXT NOT NULL,
            entry_price REAL NOT NULL,
            stop_loss REAL NOT NULL,
            take_profit_1 REAL,
            take_profit_2 REAL,
            take_profit_3 REAL,
            position_size_usd REAL NOT NULL,
            leverage INTEGER NOT NULL,
            confidence INTEGER NOT NULL,
            grade TEXT NOT NULL,
            entry_time TEXT NOT NULL,
            exit_time TEXT,
            exit_price REAL,
            exit_reason TEXT,
            pnl_usd REAL,
            pnl_percent REAL,
            reasons TEXT,
            status TEXT DEFAULT 'open'
        )
    ''')

    # Daily PnL table
    c.execute('''
        CREATE TABLE IF NOT EXISTS daily_pnl (
            date TEXT PRIMARY KEY,
            total_pnl REAL NOT NULL,
            trades_count INTEGER NOT NULL,
            win_count INTEGER NOT NULL,
            loss_count INTEGER NOT NULL,
            win_rate REAL
        )
    ''')

    conn.commit()
    conn.close()


# ====================== CORE BOT CLASS ======================
class BountySeekerV5:
    def __init__(self, webhook_url: str, config_path: str = CONFIG_PATH):
        self.webhook_url = webhook_url
        self.config_path = config_path
        self.state = self.load_state()
        self.config = self.load_config()
        self.paper_balance = self.state.get("paper_balance", PAPER_CAPITAL)

        # Initialize database FIRST before loading trades
        init_database()
        self.open_trades = self.load_open_trades()
        self.watchlist = []

        # Initialize exchange (MEXC, OKX, or Kraken)
        exchange_name = PREFERRED_EXCHANGE.lower()
        if exchange_name == "mexc":
            self.exchange = ccxt.mexc({
                "enableRateLimit": True,
                "options": {"defaultType": "swap"}  # Perpetual futures
            })
            self.exchange_name = "MEXC"
        elif exchange_name == "okx":
            self.exchange = ccxt.okx({
                "enableRateLimit": True,
                "options": {"defaultType": "swap"}  # Perpetual futures
            })
            self.exchange_name = "OKX"
        elif exchange_name == "kraken":
            self.exchange = ccxt.kraken({
                "enableRateLimit": True,
                "options": {"defaultType": "swap"}  # Perpetual futures
            })
            self.exchange_name = "KRAKEN"
        else:
            # Fallback to MEXC
            self.exchange = ccxt.mexc({
                "enableRateLimit": True,
                "options": {"defaultType": "swap"}
            })
            self.exchange_name = "MEXC"

        self.log("🚀 BountySeekerV5 initialized")
        self.log(f"💰 Paper Trading Balance: ${self.paper_balance:.2f}")
        self.log(f"📊 Open Trades: {len(self.open_trades)}/{MAX_OPEN_TRADES}")

        self.load_watchlist()
        self.check_trade_exits()  # Check for stop loss / take profit hits

    # ------------- State & Config -------------
    def load_state(self) -> Dict:
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, "r") as f:
                    return json.load(f)
            except Exception as e:
                self.log(f"⚠️ Could not load state: {e}")
        return {
            "_preview_last": {},
            "scanned_count": 0,
            "paper_balance": PAPER_CAPITAL,
            "last_daily_pnl": None,
            "signals_sent_this_hour": 0,
            "last_signal_hour": None
        }

    def save_state(self):
        try:
            self.state["paper_balance"] = self.paper_balance
            with open(STATE_FILE, "w") as f:
                json.dump(self.state, f, indent=2)
        except Exception as e:
            self.log(f"⚠️ Could not save state: {e}")

    def load_config(self) -> Dict:
        cfg = {
            "AUTO_EXECUTE": True,  # Paper trading mode
            "EXCHANGES": ["mexc"],
            "MIN_VOLUME_24H": 0,
            "EXCLUDED_SYMBOLS": []
        }
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r") as f:
                    cfg.update(json.load(f))
            except Exception as e:
                self.log(f"⚠️ Could not load config: {e}")
        return cfg

    def load_open_trades(self) -> List[Dict]:
        """Load open trades from database"""
        conn = sqlite3.connect(TRADES_DB)
        c = conn.cursor()
        c.execute("SELECT * FROM trades WHERE status = 'open'")
        rows = c.fetchall()
        conn.close()

        trades = []
        for row in rows:
            trades.append({
                "id": row[0],
                "symbol": row[1],
                "exchange": row[2],
                "direction": row[3],
                "entry_price": row[4],
                "stop_loss": row[5],
                "take_profit_1": row[6],
                "take_profit_2": row[7],
                "take_profit_3": row[8],
                "position_size_usd": row[9],
                "leverage": row[10],
                "confidence": row[11],
                "grade": row[12],
                "entry_time": row[13]
            })
        return trades

    # ------------- Logging -------------
    def log(self, msg: str):
        ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{ts}] {msg}", flush=True)

    # ------------- Discord -------------
    def post_to_discord(self, embeds: List[Dict]):
        if not self.webhook_url:
            return
        try:
            for i in range(0, len(embeds), 10):
                chunk = embeds[i:i+10]
                r = requests.post(self.webhook_url, json={"embeds": chunk}, timeout=15,
                                  headers={"User-Agent": "BountySeeker/5"})
                r.raise_for_status()
                time.sleep(1)
        except Exception as e:
            self.log(f"❌ Discord error: {e}")

    # ------------- Watchlist -------------
    def is_stablecoin_pair(self, symbol: str) -> bool:
        """Check if pair is stablecoin vs stablecoin (not valid for trading)"""
        # Extract base asset (before / or :)
        base = symbol.split('/')[0].split(':')[0].upper()
        quote = symbol.split('/')[-1].split(':')[0].upper() if '/' in symbol else "USDT"

        # Check if both base and quote are stablecoins
        base_is_stable = base in STABLECOINS
        quote_is_stable = quote in STABLECOINS

        return base_is_stable and quote_is_stable

    def is_precious_metal_pair(self, symbol: str) -> bool:
        """Check if pair involves gold/silver/precious metals"""
        # Extract base asset (before / or :)
        base = symbol.split('/')[0].split(':')[0].upper()

        # Check if base is a precious metal
        return base in PRECIOUS_METALS

    def is_stock_ticker(self, symbol: str) -> bool:
        """Check if symbol is a tokenized stock (more precise detection)"""
        # Extract base asset (before / or :)
        base = symbol.split('/')[0].split(':')[0].upper()

        # Only exclude if it's EXACTLY a known stock ticker
        # Don't exclude coins that happen to have same letters (e.g., FIL is Filecoin, not a stock)
        if base in STOCK_TICKERS:
            # Additional check: if it has common crypto suffixes, it's probably crypto
            crypto_indicators = ['COIN', 'TOKEN', 'CRYPTO', 'DEFI', 'NFT']
            if any(indicator in symbol.upper() for indicator in crypto_indicators):
                return False
            # Check if it's explicitly a stock token (e.g., TSLASTOCK, AAPLSTOCK)
            if 'STOCK' in symbol.upper() or base.endswith('STOCK'):
                return True
            # Only exclude if it's a known stock ticker AND not a common crypto name
            # Common crypto names that might match stock tickers
            crypto_names = {'FIL': 'Filecoin', 'LINK': 'Chainlink', 'ONE': 'Harmony',
                          'F': 'Fantom', 'C': 'Crypto.com Coin', 'MON': 'Monero'}
            if base in crypto_names:
                return False
            return True

        return False

    def is_macro_coin(self, symbol: str) -> bool:
        """Check if symbol is a macro coin (BTC, ETH, etc.) - we have a separate bot for these"""
        # Extract base asset (before / or :)
        base = symbol.split('/')[0].split(':')[0].upper()
        return base in MACRO_COINS

    def load_watchlist(self):
        """Load perpetual futures pairs - Top N by volume"""
        self.log(f"📋 Loading {self.exchange_name} perpetual futures (Top {SCAN_WATCHLIST_SIZE} by volume)...")
        try:
            self.exchange.load_markets()
            
            # Fetch all tickers efficiently
            self.log("📊 Fetching all tickers...")
            tickers = self.exchange.fetch_tickers()
            
            valid_pairs = []
            
            for symbol, ticker in tickers.items():
                try:
                    # Verify market exists and is active swap
                    market = self.exchange.market(symbol)
                    
                    if not (market.get("type") == "swap" and
                            market.get("quote", "").upper() in ["USDT", "USD"] and
                            market.get("active", True)):
                        continue
                        
                    # Check exclusions
                    if symbol.replace("/", "").replace(":", "").upper() in self.config.get("EXCLUDED_SYMBOLS", []):
                        continue
                    if self.is_stablecoin_pair(symbol):
                        continue
                    if self.is_precious_metal_pair(symbol):
                        continue
                    if self.is_stock_ticker(symbol):
                        continue
                        
                    # Calculate volume in USD to avoid base currency bias
                    # MEXC/OKX quoteVolume may be unreliable or in contracts/base for some pairs
                    volume_usd = 0.0
                    base_vol = float(ticker.get("baseVolume") or 0.0)
                    last_price = float(ticker.get("last") or 0.0)
                    
                    if base_vol > 0 and last_price > 0:
                        volume_usd = base_vol * last_price
                    else:
                        # Fallback to quoteVolume if available and looks reasonable (not trillions for small caps)
                        q_vol = float(ticker.get("quoteVolume") or 0.0)
                        if q_vol > 0:
                            volume_usd = q_vol
                    
                    if volume_usd >= MIN_24H_VOLUME_USD:
                        valid_pairs.append({
                            "symbol": symbol,
                            "volume": volume_usd
                        })
                        
                except Exception as e:
                    continue

            # Sort by volume descending
            valid_pairs.sort(key=lambda x: x["volume"], reverse=True)
            
            # Take top N
            self.watchlist = [p["symbol"] for p in valid_pairs[:SCAN_WATCHLIST_SIZE]]
            
            self.log(f"📊 Selected Top {len(self.watchlist)} pairs by volume:")
            for i, symbol in enumerate(self.watchlist[:10]): # Log top 10
                vol = next(p["volume"] for p in valid_pairs if p["symbol"] == symbol)
                self.log(f"  #{i+1}: {symbol} (${vol:,.0f})")
                
            if len(self.watchlist) == 0:
                self.log("⚠️ WARNING: No pairs found! Check filters or exchange connection.")

        except Exception as e:
            self.log(f"❌ Error loading watchlist: {e}")
            import traceback
            traceback.print_exc()

    # ------------- Market Data -------------
    def fetch_ohlcv(self, symbol: str, timeframe: str = "1h", limit: int = 200) -> Optional[List]:
        try:
            # Add timeout to prevent hanging
            return self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        except Exception as e:
            # Don't log every error to avoid spam - only log occasionally
            return None


    # ------------- Analysis -------------
    def analyze_symbol(self, symbol: str) -> Optional[Dict]:
        """
        Analyze symbol for reversal setup
        Focus: Deviation VWAP (2σ/3σ), Liquidation zones, GPS proximity
        """
        try:
            # Fetch 1h data for main analysis
            ohlcv_1h = self.fetch_ohlcv(symbol, "1h", 200)
            if not ohlcv_1h or len(ohlcv_1h) < 100:
                return None

            closes = [float(x[4]) for x in ohlcv_1h]
            highs = [float(x[2]) for x in ohlcv_1h]
            lows = [float(x[3]) for x in ohlcv_1h]
            volumes = [float(x[5]) for x in ohlcv_1h]
            current_price = closes[-1]

            # Calculate indicators
            rsi = calculate_rsi(closes, RSI_PERIOD)
            atr = calculate_atr(highs, lows, closes, ATR_PERIOD)

            # VWAP and Deviation
            vwap, std_dev, upper_2sigma, lower_2sigma, lower_3sigma = calculate_vwap_and_deviation(ohlcv_1h)
            if vwap is None:
                return None

            # Calculate deviation level (for bottom finding, also check 1σ)
            deviation_pct = ((current_price - vwap) / std_dev) if std_dev > 0 else 0.0
            deviation_level = 0
            lower_1sigma = vwap - (std_dev * 1.0)  # 1σ deviation for bottom finding
            if current_price <= lower_3sigma:
                deviation_level = 3  # 3σ deviation (best)
            elif current_price <= lower_2sigma:
                deviation_level = 2  # 2σ deviation
            elif current_price <= lower_1sigma:
                deviation_level = 1  # 1σ deviation (for bottom finding)

            # GPS Calculation (Daily timeframe)
            ohlcv_daily = self.fetch_ohlcv(symbol, "1d", 50)
            if ohlcv_daily and len(ohlcv_daily) >= 2:
                daily_high = max([float(x[2]) for x in ohlcv_daily[-30:]])
                daily_low = min([float(x[3]) for x in ohlcv_daily[-30:]])
                gp_high, gp_low = calculate_gps(daily_high, daily_low)

                # Check GPS proximity
                near_gps = False
                gps_distance_pct = 0.0
                if gp_high and gp_low:
                    if gp_low <= current_price <= gp_high:
                        near_gps = True
                        gps_distance_pct = 0.0
                    else:
                        # Calculate distance to nearest GPS level
                        dist_to_high = abs(current_price - gp_high) / current_price * 100
                        dist_to_low = abs(current_price - gp_low) / current_price * 100
                        gps_distance_pct = min(dist_to_high, dist_to_low)
                        if gps_distance_pct <= GPS_PROXIMITY_PCT:
                            near_gps = True
            else:
                gp_high, gp_low = None, None
                near_gps = False
                gps_distance_pct = 100.0

            # Liquidation zones detection
            liquidation_data = detect_liquidation_zones(highs, lows, closes, volumes, "1h")
            near_liquidation, liq_importance = check_proximity_to_liquidation(
                current_price, liquidation_data["levels"], liquidation_data["importance"], threshold_pct=1.0
            )

            # Volume analysis
            avg_volume = np.mean(volumes[-VOLUME_LOOKBACK:]) if len(volumes) >= VOLUME_LOOKBACK else volumes[-1]
            volume_ratio = volumes[-1] / avg_volume if avg_volume > 0 else 1.0

            # Signal generation - ULTIMATE BOTTOM FINDER (reversal at lowest support)
            signals = []

            # BOTTOM FINDER CRITERIA - Finding coins at their lowest support ready for squeeze:
            # 1. Price at 2σ or 3σ deviation (oversold) - REQUIRED
            # 2. Near GPS or liquidation zone (strong bonus, but not required)
            # 3. RSI oversold (the more oversold, the better)
            # 4. Seller exhaustion (volume patterns, wicks, price stabilization)
            # 5. Price at or near recent lows (support level)
            # 6. Accumulation patterns (volume increasing while price holds)

            # BOTTOM FINDER: Accept 1σ, 2σ, or 3σ deviations (more lenient)
            if deviation_level >= 1:  # At least 1σ deviation for bottom finding
                confidence = 4  # Very low base - focus on finding ALL bottoms
                reasons = []

                # Deviation bonus (stronger weight for extreme oversold)
                if deviation_level == 3:
                    confidence += 4  # 3σ is extreme - very strong bottom signal
                    reasons.append("3σ deviation (EXTREME oversold - rare bottom)")
                elif deviation_level == 2:
                    confidence += 3
                    reasons.append("2σ deviation (oversold - strong bottom signal)")
                else:  # 1σ
                    confidence += 2
                    reasons.append("1σ deviation (approaching oversold - potential bottom)")

                # GPS proximity OR Liquidation zone - STRONG BONUS (not required, but adds confidence)
                if near_gps:
                    confidence += 3  # GPS is very strong support level
                    reasons.append(f"Near GPS support ({gps_distance_pct:.2f}% away) - KEY LEVEL")

                if near_liquidation:
                    confidence += 3  # Liquidation zone is strong support
                    reasons.append(f"Near liquidation zone (importance: {liq_importance:.1f}%) - SELLER EXHAUSTION")

                # Price at or near recent lows (support level detection)
                if len(lows) >= 20:
                    recent_low_20 = min(lows[-20:])
                    recent_low_10 = min(lows[-10:])
                    current_low = lows[-1]

                    # Check if price is at or very close to recent lows
                    distance_to_low_20 = abs(current_price - recent_low_20) / current_price * 100
                    distance_to_low_10 = abs(current_price - recent_low_10) / current_price * 100

                    if distance_to_low_20 < 1.0:  # Within 1% of 20-period low
                        confidence += 2
                        reasons.append(f"At/near 20-period low (${recent_low_20:.6f}) - STRONG SUPPORT")
                    elif distance_to_low_10 < 0.5:  # Within 0.5% of 10-period low
                        confidence += 1
                        reasons.append(f"At/near 10-period low (${recent_low_10:.6f}) - Support level")

                    # Check if making new lows (potential exhaustion)
                    if current_low <= recent_low_20 * 0.99:  # New low (1% below previous)
                        confidence += 1
                        reasons.append("Making new lows - potential exhaustion point")

                # RSI oversold (the more oversold, the better for bottom finding)
                if rsi < 25:
                    confidence += 3  # Extremely oversold - very strong bottom signal
                    reasons.append(f"RSI EXTREMELY oversold ({rsi:.1f}) - RARE BOTTOM")
                elif rsi < 30:
                    confidence += 2  # Very oversold
                    reasons.append(f"RSI very oversold ({rsi:.1f}) - Strong bottom signal")
                elif rsi < 35:
                    confidence += 1.5
                    reasons.append(f"RSI oversold ({rsi:.1f}) - Good bottom signal")
                elif rsi < 40:
                    confidence += 1
                    reasons.append(f"RSI approaching oversold ({rsi:.1f})")

                # Volume patterns for bottom finding
                # High volume = seller exhaustion, Low volume = accumulation
                if volume_ratio > 2.5:
                    confidence += 2  # Very high volume - seller exhaustion
                    reasons.append(f"Very high volume ({volume_ratio:.2f}x) - SELLER EXHAUSTION")
                elif volume_ratio > 2.0:
                    confidence += 1.5
                    reasons.append(f"Strong volume surge ({volume_ratio:.2f}x) - Exhaustion signal")
                elif volume_ratio > 1.5:
                    confidence += 1
                    reasons.append(f"Volume surge ({volume_ratio:.2f}x)")
                elif volume_ratio > 1.2:
                    confidence += 0.5
                    reasons.append(f"Above average volume ({volume_ratio:.2f}x)")

                # Accumulation pattern: volume increasing while price holds/consolidates
                if len(volumes) >= 5:
                    recent_volumes = volumes[-5:]
                    volume_trend = sum(1 for i in range(1, len(recent_volumes)) if recent_volumes[i] > recent_volumes[i-1])
                    price_range = (max(highs[-5:]) - min(lows[-5:])) / current_price * 100

                    if volume_trend >= 3 and price_range < 2.0:  # Volume up, price tight
                        confidence += 2
                        reasons.append("Accumulation pattern - Volume up, price consolidating")

                # SELLER EXHAUSTION DETECTION (Critical for bottom finding)
                recent_low = min(lows[-5:])
                recent_close = closes[-1]
                wick_size = recent_close - recent_low
                body_size = abs(closes[-1] - (highs[-1] + lows[-1]) / 2)

                # Large lower wick (strong rejection - buyers stepping in)
                if body_size > 0 and wick_size > body_size * 2.5:
                    confidence += 3  # Very strong rejection
                    reasons.append("MASSIVE lower wick - STRONG buyer rejection of lower prices")
                elif body_size > 0 and wick_size > body_size * 2.0:
                    confidence += 2
                    reasons.append("Very large lower wick - Strong seller exhaustion")
                elif body_size > 0 and wick_size > body_size * 1.5:
                    confidence += 1.5
                    reasons.append("Large lower wick - Seller exhaustion signal")

                # Price rejection pattern (hammer, doji, etc.) - reversal candles
                recent_candle_range = highs[-1] - lows[-1]
                if recent_candle_range > 0:
                    lower_wick_pct = wick_size / recent_candle_range
                    upper_wick = highs[-1] - max(closes[-1], (highs[-1] + lows[-1]) / 2)
                    upper_wick_pct = upper_wick / recent_candle_range

                    if lower_wick_pct > 0.7:  # More than 70% lower wick - hammer
                        confidence += 2
                        reasons.append("Hammer pattern - Strong price rejection at bottom")
                    elif lower_wick_pct > 0.6:
                        confidence += 1
                        reasons.append("Price rejection pattern - Buyers defending level")

                    # Doji pattern (indecision at bottom = potential reversal)
                    body_pct = body_size / recent_candle_range if recent_candle_range > 0 else 0
                    if body_pct < 0.2 and recent_candle_range > 0:
                        confidence += 1
                        reasons.append("Doji pattern - Indecision at support (potential reversal)")

                # Price stabilization at support (accumulation)
                if len(lows) >= 10:
                    recent_lows = lows[-10:]
                    price_range_pct = (max(highs[-10:]) - min(recent_lows)) / current_price * 100
                    if price_range_pct < 1.5:  # Tight range - price holding
                        confidence += 1.5
                        reasons.append("Price stabilization - Holding at support level")

                    # Check for downtrend exhaustion (making lower lows then stopping)
                    lower_lows_count = sum(1 for i in range(1, len(recent_lows)) if recent_lows[i] < recent_lows[i-1])
                    if lower_lows_count >= 5:  # Making lower lows
                        # But if price is now holding, it's exhaustion
                        if price_range_pct < 2.0:
                            confidence += 2
                            reasons.append("Downtrend exhaustion - Lower lows stopped, price holding")
                        else:
                            confidence += 1
                            reasons.append("Downtrend structure - Potential reversal point")

                # Volume exhaustion (volume decreasing after selloff = sellers done)
                if len(volumes) >= 5:
                    recent_vols = volumes[-5:]
                    volume_decreasing = sum(1 for i in range(1, len(recent_vols)) if recent_vols[i] < recent_vols[i-1])
                    if volume_decreasing >= 3 and volume_ratio < 1.0:  # Volume drying up
                        confidence += 1.5
                        reasons.append("Volume exhaustion - Sellers running out of steam")

                # Convert confidence to integer for grading
                confidence_int = int(round(confidence))

                # Only A (8+) and A+ (9+) setups
                if confidence_int >= MIN_CONFIDENCE:
                    grade = "A+" if confidence_int >= A_PLUS_CONFIDENCE else "A"

                    # Calculate entry, stop, targets
                    entry = current_price
                    stop = recent_low - (atr * 0.5)  # Stop below recent low
                    risk = max(entry - stop, entry * 0.001)  # Minimum 0.1% risk

                    # Take profit levels (2:1, 3:1, 4.5:1 RR)
                    tp1 = entry + (risk * 2.0)
                    tp2 = entry + (risk * 3.0)
                    tp3 = entry + (risk * 4.5)

                    rr_ratio = (tp2 - entry) / risk

                    if rr_ratio >= MIN_RR_RATIO:
                        signals.append({
                            "exchange": self.exchange_name.lower(),
                            "symbol": symbol,
                            "direction": "LONG",
                            "confidence": min(confidence_int, 10),
                            "grade": grade,
                            "entry": entry,
                            "stop": stop,
                            "tp1": tp1,
                            "tp2": tp2,
                            "tp3": tp3,
                            "risk_reward": f"{rr_ratio:.2f}",
                            "reasons": reasons,
                            "rsi": rsi,
                            "volume_ratio": volume_ratio,
                            "deviation_level": deviation_level,
                            "deviation_pct": deviation_pct,
                            "near_gps": near_gps,
                            "gps_distance_pct": gps_distance_pct,
                            "near_liquidation": near_liquidation,
                            "liq_importance": liq_importance,
                            "vwap": vwap,
                            "lower_2sigma": lower_2sigma,
                            "lower_3sigma": lower_3sigma,
                            "_closes": closes,
                            "_highs": highs,
                            "_lows": lows
                        })

            return signals[0] if signals else None

        except Exception as e:
            self.log(f"⚠️ Analysis error for {symbol}: {e}")
            return None

    # ------------- Trade Management -------------
    def calculate_position_size(self, entry: float, stop: float, risk_percent: float = RISK_PERCENT) -> float:
        """Calculate position size based on risk"""
        risk_amount = self.paper_balance * (risk_percent / 100)
        risk_per_contract = abs(entry - stop)
        if risk_per_contract == 0:
            return 0.0
        position_size = risk_amount / risk_per_contract
        return min(position_size, self.paper_balance * 0.33)  # Max 33% per trade

    def open_paper_trade(self, signal: Dict) -> bool:
        """Open a paper trade"""
        if len(self.open_trades) >= MAX_OPEN_TRADES:
            self.log(f"⚠️ Max open trades reached ({MAX_OPEN_TRADES})")
            return False

        # Check if we already have this symbol
        for trade in self.open_trades:
            if trade["symbol"] == signal["symbol"]:
                self.log(f"⚠️ Already have open trade for {signal['symbol']}")
                return False

        # Calculate position size
        position_size = self.calculate_position_size(signal["entry"], signal["stop"])
        if position_size < 10:  # Minimum $10 position
            self.log(f"⚠️ Position size too small: ${position_size:.2f}")
            return False

        # Record trade in database
        conn = sqlite3.connect(TRADES_DB)
        c = conn.cursor()
        c.execute('''
            INSERT INTO trades (symbol, exchange, direction, entry_price, stop_loss,
                              take_profit_1, take_profit_2, take_profit_3, position_size_usd,
                              leverage, confidence, grade, entry_time, reasons, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
        ''', (
            signal["symbol"],
            signal["exchange"],
            signal["direction"],
            signal["entry"],
            signal["stop"],
            signal["tp1"],
            signal["tp2"],
            signal["tp3"],
            position_size,
            LEVERAGE,
            signal["confidence"],
            signal["grade"],
            datetime.utcnow().isoformat(),
            ", ".join(signal["reasons"])
        ))
        trade_id = c.lastrowid
        conn.commit()
        conn.close()

        # Update open trades list
        self.open_trades.append({
            "id": trade_id,
            "symbol": signal["symbol"],
            "exchange": signal["exchange"],
            "direction": signal["direction"],
            "entry_price": signal["entry"],
            "stop_loss": signal["stop"],
            "take_profit_1": signal["tp1"],
            "take_profit_2": signal["tp2"],
            "take_profit_3": signal["tp3"],
            "position_size_usd": position_size,
            "leverage": LEVERAGE,
            "confidence": signal["confidence"],
            "grade": signal["grade"],
            "entry_time": datetime.utcnow().isoformat()
        })

        self.log(f"✅ Opened paper trade: {signal['symbol']} {signal['direction']} @ ${signal['entry']:.6f}")
        self.send_trade_entry_alert(signal, position_size, trade_id)
        return True

    def send_trade_entry_alert(self, signal: Dict, position_size: float, trade_id: int):
        """Send Discord alert for trade entry"""
        embed = {
            "title": f"🟢 Trade OPENED: {signal['symbol']} | #{trade_id}",
            "description": (
                f"**Direction:** LONG\n"
                f"**Grade:** {signal['grade']} | **Confidence:** {int(signal['confidence'])}/10\n"
                f"**Entry:** ${signal['entry']:.6f}\n"
                f"**Stop Loss:** ${signal['stop']:.6f}\n"
                f"**Take Profits:**\n"
                f"  TP1: ${signal['tp1']:.6f} (2:1 RR)\n"
                f"  TP2: ${signal['tp2']:.6f} (3:1 RR)\n"
                f"  TP3: ${signal['tp3']:.6f} (4.5:1 RR)\n"
                f"**Position Size:** ${position_size:.2f}\n"
                f"**Leverage:** {LEVERAGE}x\n"
                f"**Reasons:** {', '.join(signal['reasons'][:2])}\n\n"
                f"*Paper Trading - Not Financial Advice*"
            ),
            "color": 0x0ecb81,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.post_to_discord([embed])

    def check_trade_exits(self):
        """Check if any open trades hit stop loss or take profit"""
        if not self.open_trades:
            return

        updated_trades = []
        for trade in self.open_trades:
            try:
                # Fetch current price
                ticker = self.exchange.fetch_ticker(trade["symbol"])
                current_price = float(ticker["last"])

                exit_reason = None
                exit_price = None
                pnl_usd = 0.0
                pnl_percent = 0.0

                # LONG TRADE EXITS (LONG ONLY)
                # Check stop loss
                if current_price <= trade["stop_loss"]:
                    exit_reason = "Stop Loss"
                    exit_price = trade["stop_loss"]
                    pnl_usd = (exit_price - trade["entry_price"]) * (trade["position_size_usd"] / trade["entry_price"]) * LEVERAGE
                    pnl_percent = ((exit_price - trade["entry_price"]) / trade["entry_price"]) * 100 * LEVERAGE
                    self.send_stop_loss_alert(trade, current_price)

                # Check take profits
                elif current_price >= trade["take_profit_3"]:
                    exit_reason = "Take Profit 3"
                    exit_price = trade["take_profit_3"]
                    pnl_usd = (exit_price - trade["entry_price"]) * (trade["position_size_usd"] / trade["entry_price"]) * LEVERAGE
                    pnl_percent = ((exit_price - trade["entry_price"]) / trade["entry_price"]) * 100 * LEVERAGE
                    self.send_take_profit_alert(trade, "TP3", current_price, pnl_usd)

                elif current_price >= trade["take_profit_2"]:
                    exit_reason = "Take Profit 2"
                    exit_price = trade["take_profit_2"]
                    pnl_usd = (exit_price - trade["entry_price"]) * (trade["position_size_usd"] / trade["entry_price"]) * LEVERAGE
                    pnl_percent = ((exit_price - trade["entry_price"]) / trade["entry_price"]) * 100 * LEVERAGE
                    self.send_take_profit_alert(trade, "TP2", current_price, pnl_usd)

                elif current_price >= trade["take_profit_1"]:
                    exit_reason = "Take Profit 1"
                    exit_price = trade["take_profit_1"]
                    pnl_usd = (exit_price - trade["entry_price"]) * (trade["position_size_usd"] / trade["entry_price"]) * LEVERAGE
                    pnl_percent = ((exit_price - trade["entry_price"]) / trade["entry_price"]) * 100 * LEVERAGE
                    self.send_take_profit_alert(trade, "TP1", current_price, pnl_usd)

                # Close trade if exit condition met
                if exit_reason:
                    # Update database
                    conn = sqlite3.connect(TRADES_DB)
                    c = conn.cursor()
                    c.execute('''
                        UPDATE trades
                        SET exit_time = ?, exit_price = ?, exit_reason = ?,
                            pnl_usd = ?, pnl_percent = ?, status = 'closed'
                        WHERE id = ?
                    ''', (
                        datetime.utcnow().isoformat(),
                        exit_price,
                        exit_reason,
                        pnl_usd,
                        pnl_percent,
                        trade["id"]
                    ))
                    conn.commit()
                    conn.close()

                    # Update paper balance
                    self.paper_balance += pnl_usd
                    self.save_state()

                    # Send alert
                    self.send_trade_exit_alert(trade, exit_reason, exit_price, pnl_usd, pnl_percent)

                    self.log(f"🔔 Trade closed: {trade['symbol']} - {exit_reason} @ ${exit_price:.6f} | PnL: ${pnl_usd:.2f} ({pnl_percent:+.2f}%)")
                else:
                    updated_trades.append(trade)

            except Exception as e:
                self.log(f"⚠️ Error checking trade {trade['symbol']}: {e}")
                updated_trades.append(trade)

        self.open_trades = updated_trades

    def send_stop_loss_alert(self, trade: Dict, current_price: float):
        """Send Discord alert when stop loss is hit"""
        embed = {
            "title": f"🛑 Stop Loss HIT: {trade['symbol']} | #{trade['id']}",
            "description": (
                f"**Direction:** {trade['direction']}\n"
                f"**Entry:** ${trade['entry_price']:.6f}\n"
                f"**Stop Loss:** ${trade['stop_loss']:.6f}\n"
                f"**Current Price:** ${current_price:.6f}\n"
                f"**Position Size:** ${trade['position_size_usd']:.2f}\n\n"
                f"*Trade will be closed - Paper Trading*"
            ),
            "color": 0xFF0000,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.post_to_discord([embed])

    def send_take_profit_alert(self, trade: Dict, tp_level: str, current_price: float, pnl_usd: float):
        """Send Discord alert when take profit is hit"""
        color = 0x00FF00
        emoji_emoji = ["", "🎯", "🎯🎯", "🎯🎯🎯"]
        emoji = emoji_emoji[int(tp_level[-1])] if tp_level[-1].isdigit() else "🎯"

        embed = {
            "title": f"{emoji} Take Profit {tp_level[-1]} HIT: {trade['symbol']} | #{trade['id']}",
            "description": (
                f"**Direction:** {trade['direction']}\n"
                f"**Entry:** ${trade['entry_price']:.6f}\n"
                f"{tp_level}: ${current_price:.6f}\n"
                f"**PnL:** ${pnl_usd:.2f}\n"
                f"**Position Size:** ${trade['position_size_usd']:.2f}\n\n"
                f"*Trade will be closed - Paper Trading*"
            ),
            "color": color,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.post_to_discord([embed])

    def send_trade_exit_alert(self, trade: Dict, exit_reason: str, exit_price: float, pnl_usd: float, pnl_percent: float):
        """Send Discord alert for trade exit"""
        color = 0x00FF00 if pnl_usd > 0 else 0xFF0000
        emoji = "✅" if pnl_usd > 0 else "❌"

        embed = {
            "title": f"{emoji} Trade CLOSED: {trade['symbol']} | #{trade['id']}",
            "description": (
                f"**Exit Reason:** {exit_reason}\n"
                f"**Direction:** {trade['direction']}\n"
                f"**Grade:** {trade['grade']} | **Confidence:** {int(trade['confidence'])}/10\n"
                f"**Entry:** ${trade['entry_price']:.6f}\n"
                f"**Exit:** ${exit_price:.6f}\n"
                f"**Stop Loss:** ${trade['stop_loss']:.6f}\n"
                f"**Take Profits:**\n"
                f"  TP1: ${trade['take_profit_1']:.6f}\n"
                f"  TP2: ${trade['take_profit_2']:.6f}\n"
                f"  TP3: ${trade['take_profit_3']:.6f}\n"
                f"**PnL:** ${pnl_usd:.2f} ({pnl_percent:+.2f}%)\n"
                f"**Position Size:** ${trade['position_size_usd']:.2f}\n"
                f"**New Balance:** ${self.paper_balance:.2f}\n\n"
                f"*Paper Trading - Not Financial Advice*"
            ),
            "color": color,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.post_to_discord([embed])

    # ------------- Signal Cards -------------
    def _get_base_asset(self, symbol: str) -> str:
        """Extract base asset from symbol (e.g., BTC/USDT:USDT -> BTC)"""
        if '/' in symbol:
            return symbol.split('/')[0]
        return symbol

    def _preview_key(self, s: Dict) -> str:
        return f"{s.get('exchange','')}::{s.get('symbol','')}::{s.get('direction','')}"

    def _should_preview(self, s: Dict, cooldown_sec: int = WATCHLIST_COOLDOWN_SEC) -> bool:
        key = self._preview_key(s)
        last = self.state.get("_preview_last", {}).get(key, 0.0)
        now = time.time()
        if now - last < cooldown_sec:
            return False
        self.state.setdefault("_preview_last", {})[key] = now
        return True

    # ------------- Repeat Trade Control -------------
    def _is_same_trade_setup(self, previous: Dict, current: Dict, threshold_pct: float = 0.1) -> bool:
        """
        Check if two trade setups are effectively the same.
        Treat as same trade if entry and stop are within threshold_pct difference.
        """
        try:
            prev_entry = float(previous.get("entry", 0))
            prev_stop = float(previous.get("stop", 0))
            cur_entry = float(current.get("entry", 0))
            cur_stop = float(current.get("stop", 0))
        except Exception:
            return False

        if prev_entry <= 0 or prev_stop <= 0 or cur_entry <= 0 or cur_stop <= 0:
            return False

        entry_diff_pct = abs(cur_entry - prev_entry) / prev_entry * 100
        stop_diff_pct = abs(cur_stop - prev_stop) / prev_stop * 100

        return entry_diff_pct <= threshold_pct and stop_diff_pct <= threshold_pct

    def _should_allow_new_trade_for_symbol(self, signal: Dict) -> bool:
        """
        Prevent the bot from repeatedly retrying the same coin at
        new/broken levels. Only allow:
        - the first trade for a symbol, or
        - a new signal that is effectively the *same* setup (entry/SL nearly identical), or
        - a different setup after a cooldown period.
        """
        symbol = signal.get("symbol")
        if not symbol:
            return True

        levels_state = self.state.setdefault("_last_signal_levels", {})
        prev = levels_state.get(symbol)
        now_ts = time.time()

        # No previous trade recorded for this symbol -> allow
        if not prev:
            return True

        # If setup is effectively the same (levels unchanged), allow retry
        if self._is_same_trade_setup(prev, signal):
            return True

        # Otherwise enforce cooldown before allowing a *different* setup
        last_ts = float(prev.get("ts", 0))
        if last_ts > 0 and now_ts - last_ts < REPEAT_TRADE_COOLDOWN_SEC:
            self.log(f"🚫 Skipping repeat trade on {symbol} (levels changed, within cooldown window).")
            return False

        return True

    def _mark_trade_signal_sent(self, signal: Dict):
        """Record last levels for a symbol when we actually send a trade signal."""
        symbol = signal.get("symbol")
        if not symbol:
            return

        levels_state = self.state.setdefault("_last_signal_levels", {})
        levels_state[symbol] = {
            "entry": float(signal.get("entry", 0.0)),
            "stop": float(signal.get("stop", 0.0)),
            "ts": time.time(),
        }

    def _build_combined_signals_card(self, signals: List[Dict]) -> Dict:
        """Build a single Discord embed card with LONG ONLY signals"""
        if not signals:
            return None

        # LIMIT TO 3 SIGNALS max 3 trades at a time
        MAX_DISPLAY_SIGNALS = 3

        # Sort by confidence
        sorted_signals = sorted(signals, key=lambda x: x.get("confidence", 0), reverse=True)
        display_signals = sorted_signals[:MAX_DISPLAY_SIGNALS]

        omitted_count = len(signals) - len(display_signals)

        # LONG ONLY - green color
        color = 0x0ecb81

        # Dynamic header
        total_found = len(signals)
        desc_lines = [
            f"**🎯 Found {total_found} LONG Setup{'s' if total_found > 1 else ''}**",
            ""
        ]
            
        if omitted_count > 0:
            desc_lines.append(f"*(Showing top {MAX_DISPLAY_SIGNALS} of {total_found} signals)*")
            desc_lines.append("")

        for i, signal in enumerate(display_signals, 1):
            # Visual separator for each coin
            desc_lines.append(f"**━━━━━━━━━━━━━━━━━━━━━━━━**")
            direction_emoji = "🟢" if signal.get("direction") == "LONG" else "🔴"
            desc_lines.append(f"**{i}. {direction_emoji} {signal.get('symbol','-')}** | **{signal.get('direction', 'LONG')}** | **{signal.get('grade','-')} Grade**")
            
            # Entry details - Condensed
            desc_lines.append(f"Entry: `${float(signal.get('entry',0)):.4f}` | SL: `${float(signal.get('stop',0)):.4f}` | TP1: `${float(signal.get('tp1',0)):.4f}`")
            
            # Key factors - Condensed
            reasons = signal.get("reasons", [])[:2]
            if reasons:
                desc_lines.append(f"✨ {', '.join(reasons)}")

            # TradingView link
            base_symbol = signal.get('symbol','').replace('/','').replace(':USDT','').replace(':USD','').replace('-SWAP','').replace('-PERP','')
            exchange_name_tv = self.exchange_name.upper()
            tv = f"https://www.tradingview.com/chart/?symbol={exchange_name_tv}:{base_symbol}"
            desc_lines.append(f"[📊 Chart]({tv})")

            # Add spacing between coins (except last one)
            if i < len(display_signals):
                desc_lines.append("")

        desc_lines.append("")
        desc_lines.append("**━━━━━━━━━━━━━━━━━━━━━━━━**")
        desc_lines.append("*Always DYOR - Not Financial Advice*")

        # Dynamic title based on signal types
        title = f"🎯 Market Scan Results - {total_found} Setup{'s' if total_found > 1 else ''} Found"
        
        return {
            "title": title,
            "description": "\n".join(desc_lines),
            "color": color,
            "timestamp": datetime.utcnow().isoformat()
        }

    def _build_signal_card(self, signal: Dict, is_watchlist: bool = False) -> Dict:
        """Build Discord embed card for signal (legacy - now using combined card)"""
        color = 0xFFA500 if is_watchlist else 0xFFFFFF  # White for long signals
        title_prefix = "👀 WATCHLIST" if is_watchlist else "🎯 TRADE SIGNAL"

        # Educational explanations
        explanations = []
        if signal.get("deviation_level") == 3:
            explanations.append("**3σ Deviation:** Price is extremely oversold (3 standard deviations below VWAP). This is a rare event indicating potential reversal.")
        elif signal.get("deviation_level") == 2:
            explanations.append("**2σ Deviation:** Price is oversold (2 standard deviations below VWAP). Statistical mean reversion opportunity.")

        if signal.get("near_gps"):
            explanations.append(f"**GPS Proximity:** Price is near the Golden Pocket (61.8%-65% Fibonacci retracement), a key support level where reversals often occur.")

        if signal.get("near_liquidation"):
            explanations.append(f"**Liquidation Zone:** Price is near a recent liquidation level (importance: {signal.get('liq_importance', 0):.1f}%). This suggests seller exhaustion.")

        desc_lines = [
            f"**Direction:** {signal.get('direction','-')}   |   **Grade:** {signal.get('grade','-')}   |   **Confidence:** {int(signal.get('confidence',0))}/10",
            "",
            f"**Entry:** ${float(signal.get('entry',0)):.6f}",
            f"**Stop Loss:** ${float(signal.get('stop',0)):.6f}",
            f"**Take Profits:**",
            f"  TP1: ${float(signal.get('tp1',0)):.6f} (2:1 RR)",
            f"  TP2: ${float(signal.get('tp2',0)):.6f} (3:1 RR)",
            f"  TP3: ${float(signal.get('tp3',0)):.6f} (4.5:1 RR)",
            "",
            f"**Risk:Reward:** {signal.get('risk_reward','-')}",
            f"**Leverage:** {LEVERAGE}x",
            f"**RSI:** {signal.get('rsi',0):.1f}",
            f"**Volume:** {signal.get('volume_ratio',0):.2f}x avg",
            "",
            "**Setup Reasons:**",
        ]

        for reason in signal.get("reasons", [])[:6]:
            desc_lines.append(f"  • {reason}")

        if explanations:
            desc_lines.append("")
            desc_lines.append("**Educational Notes:**")
            for exp in explanations:
                desc_lines.append(exp)

        base_symbol = signal.get('symbol','').replace('/','').replace(':USDT','').replace(':USD','').replace('-SWAP','').replace('-PERP','').split(':')[0]
        exchange_name_tv = self.exchange_name.upper()
        tv = f"https://www.tradingview.com/chart/?symbol={exchange_name_tv}:{base_symbol}"
        desc_lines.append(f"\n[📊 View Chart]({tv})")
        desc_lines.append("\n*Always DYOR - Not Financial Advice*")

        return {
            "title": f"{title_prefix} - {signal.get('symbol','')} on {self.exchange_name}",
            "description": "\n".join(desc_lines),
            "color": color,
            "timestamp": datetime.utcnow().isoformat()
        }


    def _build_watchlist_card(self, watchlist_signals: List[Dict]) -> Dict:
        """Build watchlist card (orange)"""
        desc_lines = [
            f"**Top {len(watchlist_signals)} coins approaching setup zones:**",
            ""
        ]

        for i, sig in enumerate(watchlist_signals[:REPORT_WATCHLIST_SIZE], 1):
            desc_lines.append(f"**{i}. {sig['symbol']}** - ${sig['entry']:.6f}")
            desc_lines.append(f"   • Deviation: {sig.get('deviation_level', 0)}σ")
            if sig.get("near_gps"):
                desc_lines.append(f"   • GPS Distance: {sig.get('gps_distance_pct', 0):.2f}%")
            if sig.get("near_liquidation"):
                desc_lines.append(f"   • Near Liquidation Zone")
            desc_lines.append("")

        desc_lines.append("*These coins are approaching deviation VWAP or liquidation zones. Monitor for A/A+ setups.*")
        desc_lines.append("\n*Always DYOR - Not Financial Advice*")

        return {
            "title": "👀 Watchlist - Approaching Setup Zones",
            "description": "\n".join(desc_lines),
            "color": 0xFFA500,  # Orange
            "timestamp": datetime.utcnow().isoformat()
        }

    # ------------- Daily PnL Report -------------
    def generate_daily_pnl(self):
        """Generate and send daily PnL report"""
        today = datetime.utcnow().date().isoformat()

        # Check if we already sent today's report
        if self.state.get("last_daily_pnl") == today:
            return

        conn = sqlite3.connect(TRADES_DB)
        c = conn.cursor()

        # Get today's trades
        c.execute('''
            SELECT COUNT(*), SUM(pnl_usd),
                   SUM(CASE WHEN pnl_usd > 0 THEN 1 ELSE 0 END) as wins,
                   SUM(CASE WHEN pnl_usd < 0 THEN 1 ELSE 0 END) as losses
            FROM trades
            WHERE DATE(exit_time) = ? AND status = 'closed'
        ''', (today,))

        row = c.fetchone()
        trades_count = row[0] or 0
        total_pnl = row[1] or 0.0
        wins = row[2] or 0
        losses = row[3] or 0
        win_rate = (wins / trades_count * 100) if trades_count > 0 else 0.0

        conn.close()

        if trades_count > 0:
            embed = {
                "title": "📊 Daily PnL Report",
                "description": (
                    f"**Date:** {today}\n"
                    f"**Total PnL:** ${total_pnl:.2f}\n"
                    f"**Trades:** {trades_count}\n"
                    f"**Wins:** {wins} | **Losses:** {losses}\n"
                    f"**Win Rate:** {win_rate:.1f}%\n"
                    f"**Current Balance:** ${self.paper_balance:.2f}\n\n"
                    f"*Paper Trading - Not Financial Advice*"
                ),
                "color": 0x00FF00 if total_pnl > 0 else 0xFF0000,
                "timestamp": datetime.utcnow().isoformat()
            }
            self.post_to_discord([embed])

        self.state["last_daily_pnl"] = today
        self.save_state()

    def generate_4hourly_status(self):
        """Generate 4-hourly status report with all trades"""
        now = datetime.utcnow()
        current_hour_block = f"{now.year}-{now.month}-{now.day}-{now.hour//4}"
        last_hour_block = self.state.get("last_4hourly_block")

        if last_hour_block == current_hour_block:
            return

        conn = sqlite3.connect(TRADES_DB)
        c = conn.cursor()

        # Get stats for all time
        c.execute('SELECT COUNT(*) FROM trades WHERE status = "closed"')
        trades_count = c.fetchone()[0] or 0

        c.execute('SELECT SUM(CASE WHEN pnl_usd > 0 THEN 1 ELSE 0 END) FROM trades WHERE status = "closed"')
        wins = c.fetchone()[0] or 0

        c.execute('SELECT SUM(CASE WHEN pnl_usd <= 0 THEN 1 ELSE 0 END) FROM trades WHERE status = "closed"')
        losses = c.fetchone()[0] or 0

        c.execute('SELECT SUM(pnl_usd) FROM trades WHERE status = "closed"')
        total_pnl = c.fetchone()[0] or 0.0

        c.execute('SELECT COUNT(*) FROM trades WHERE status = "open"')
        open_trades = c.fetchone()[0] or 0

        conn.close()

        win_rate = (wins / trades_count * 100) if trades_count > 0 else 0.0

        embed = {
            "title": f"📊 4-Hourly Status Report - {now.strftime('%Y-%m-%d %H:%M UTC')}",
            "description": (
                f"**All-Time Performance:**\n"
                f"**Total Trades:** {trades_count} ({wins}W / {losses}L)\n"
                f"**Win Rate:** {win_rate:.1f}%\n"
                f"**Total PnL:** ${total_pnl:.2f}\n\n"
                f"**Current Status:**\n"
                f"**Open Trades:** {open_trades}/{MAX_OPEN_TRADES}\n"
                f"**Paper Balance:** ${self.paper_balance:.2f}\n\n"
                f"*Paper Trading - Not Financial Advice*"
            ),
            "color": 0x3498db,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.post_to_discord([embed])

        self.state["last_4hourly_block"] = current_hour_block
        self.save_state()

    # ------------- Main Scan Loop -------------
    def collect_signals(self) -> Tuple[List[Dict], List[Dict]]:
        """Collect A/A+ signals and watchlist candidates"""
        signals = []
        watchlist_candidates = []

        self.log(f"🔍 Scanning {len(self.watchlist)} {self.exchange_name} pairs for bottoms...")
        scanned = 0
        errors = 0

        for symbol in self.watchlist:
            try:
                s = self.analyze_symbol(symbol)
                if s:
                    if s["confidence"] >= MIN_CONFIDENCE:
                        signals.append(s)
                    elif s["confidence"] >= 5:  # Watchlist candidates (approaching setup) - lowered
                        watchlist_candidates.append(s)
            except Exception as e:
                errors += 1
                if errors <= 5:  # Only log first 5 errors to avoid spam
                    self.log(f"⚠️ Error analyzing {symbol}: {e}")

            scanned += 1
            if scanned % 50 == 0:
                self.log(f"  ... scanned {scanned}/{len(self.watchlist)} (errors: {errors})")
        
        self.log(f"✅ Scan complete: {scanned}/{len(self.watchlist)} pairs scanned, {errors} errors")

        # Sort by confidence
        signals.sort(key=lambda x: x.get("confidence", 0), reverse=True)
        watchlist_candidates.sort(key=lambda x: x.get("confidence", 0), reverse=True)

        # Remove duplicate symbols - keep only highest confidence signal for each ticker
        seen_symbols = set()
        unique_signals = []
        for signal in signals:
            symbol = signal.get("symbol", "")
            if symbol not in seen_symbols:
                seen_symbols.add(symbol)
                unique_signals.append(signal)
        signals = unique_signals

        self.state["scanned_count"] = self.state.get("scanned_count", 0) + scanned
        self.save_state()

        return signals, watchlist_candidates

    def run_scan_loop(self):
        """Main scanning loop"""
        self.log("🎯 Starting Bounty Seeker V5...")
        self.log("📌 Strategy: Long reversals at bottoms (Deviation VWAP + Liquidation zones + GPS)")
        self.log("📌 Only A and A+ grade setups")
        self.log("📌 Paper Trading: $1,000 starting capital")

        while True:
            try:
                start_t = time.time()
                self.log("=" * 60)
                self.log(f"🌍 SCAN - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
                self.log("=" * 60)

                # Check trade exits first
                self.check_trade_exits()

                # Collect signals
                signals, watchlist_candidates = self.collect_signals()

                # Filter to A/A+ only
                trade_signals = [s for s in signals if s.get("confidence", 0) >= MIN_CONFIDENCE]

                # Filter out signals for symbols already in open trades (no duplicate tickers)
                open_symbols = {t["symbol"] for t in self.open_trades}
                before_filter = len(trade_signals)
                trade_signals = [s for s in trade_signals if s["symbol"] not in open_symbols]
                after_filter = len(trade_signals)

                if before_filter > after_filter:
                    filtered_symbols = {s["symbol"] for s in signals if s["symbol"] in open_symbols}
                    self.log(f"🚫 Filtered {before_filter - after_filter} signals for symbols already in trades: {', '.join(filtered_symbols)}")

                self.log(f"📊 Results: {len(signals)} total signals")
                self.log(f"  🎯 A/A+ Trade Signals: {len(trade_signals)}")
                self.log(f"  👀 Watchlist Candidates: {len(watchlist_candidates)}")
                self.log(f"  💰 Open Trades: {len(self.open_trades)}/{MAX_OPEN_TRADES}")
                self.log(f"  💵 Paper Balance: ${self.paper_balance:.2f}")

                # Build Discord embeds (no summary - only send signals)
                embeds = []

                # Watchlist (orange) - top 3 approaching setup zones
                if watchlist_candidates:
                    watchlist_top = watchlist_candidates[:REPORT_WATCHLIST_SIZE]
                    embeds.append(self._build_watchlist_card(watchlist_top))

                # Trade signals - combined into one card, max 3 per hour
                current_hour = datetime.utcnow().strftime("%Y-%m-%d-%H")
                last_hour = self.state.get("last_signal_hour")

                # Reset counter if new hour
                if last_hour != current_hour:
                    self.state["signals_sent_this_hour"] = 0
                    self.state["last_signal_hour"] = current_hour
                    self.save_state()

                signals_sent = self.state.get("signals_sent_this_hour", 0)
                remaining_slots = MAX_SIGNALS_PER_HOUR - signals_sent

                if trade_signals and remaining_slots > 0:
                    # Get top signals up to remaining slots
                    signals_to_send = trade_signals[:min(remaining_slots, len(trade_signals))]

                    # Filter by Discord preview cooldown
                    filtered_signals = [s for s in signals_to_send if self._should_preview(s)]

                    # Filter out "repeat trades" on the same symbol where levels have changed
                    filtered_signals = [s for s in filtered_signals if self._should_allow_new_trade_for_symbol(s)]

                    # CRITICAL: Remove any duplicate symbols AND duplicate base assets (different tickers only)
                    seen_symbols = set()
                    seen_base_assets = set()
                    unique_filtered = []
                    for signal in filtered_signals:
                        symbol = signal.get("symbol", "")
                        base_asset = self._get_base_asset(symbol)
                        if symbol not in seen_symbols and base_asset not in seen_base_assets:
                            seen_symbols.add(symbol)
                            seen_base_assets.add(base_asset)
                            unique_filtered.append(signal)

                    filtered_signals = unique_filtered

                    # CRITICAL: Also filter out any signals for symbols/base assets already in open trades (again, just to be safe)
                    open_symbols = {t["symbol"] for t in self.open_trades}
                    open_base_assets = {self._get_base_asset(t["symbol"]) for t in self.open_trades}
                    filtered_signals = [s for s in filtered_signals if s["symbol"] not in open_symbols and self._get_base_asset(s["symbol"]) not in open_base_assets]

                    # Final limit to MAX_OPEN_TRADES (max 3 trades)
                    filtered_signals = filtered_signals[:MAX_OPEN_TRADES]

                    if filtered_signals:
                        self.log(f"✅ Preparing to send {len(filtered_signals)} unique signals: {', '.join([s['symbol'] for s in filtered_signals])}")

                        # Build combined card
                        combined_card = self._build_combined_signals_card(filtered_signals)
                        if combined_card:
                            embeds.append(combined_card)

                            # Update signal count and remember last levels for each symbol
                            self.state["signals_sent_this_hour"] = signals_sent + len(filtered_signals)
                            for s in filtered_signals:
                                self._mark_trade_signal_sent(s)
                            self.save_state()

                            # Auto-open paper trades if enabled
                            if self.config.get("AUTO_EXECUTE", False):
                                for signal in filtered_signals:
                                    if len(self.open_trades) < MAX_OPEN_TRADES:
                                        self.open_paper_trade(signal)

                elif trade_signals and remaining_slots == 0:
                    self.log(f"⚠️ Rate limit reached: {MAX_SIGNALS_PER_HOUR} signals already sent this hour")


                # Send scan update to Discord
                scan_time = time.time() - start_t
                scan_embed = {
                    "title": "🔍 Scan Update",
                    "description": (
                        f"**Scanned:** {len(self.watchlist)} coins\n"
                        f"**Signals Found:** {len(trade_signals)} LONG setups\n"
                        f"**Watchlist:** {len(watchlist_candidates)} coins approaching zones\n"
                        f"**Open Trades:** {len(self.open_trades)}/{MAX_OPEN_TRADES}\n"
                        f"**Balance:** ${self.paper_balance:.2f}\n"
                        f"**Scan Time:** {scan_time:.1f}s"
                    ),
                    "color": 0x3498db,  # Blue
                    "timestamp": datetime.utcnow().isoformat(),
                    "footer": {"text": f"Next scan in {SCAN_INTERVAL_SEC//60} minutes"}
                }
                
                # Only send embeds if there are actual signals or watchlist items
                if embeds:
                    embeds.insert(0, scan_embed)  # Add scan update first
                    self.post_to_discord(embeds)
                else:
                    # Send scan update alone
                    self.post_to_discord([scan_embed])

                # Generate daily PnL report (once per day)
                self.generate_daily_pnl()

                # Generate 4-hourly status report
                self.generate_4hourly_status()

                self.log(f"✅ Scan complete. Next scan in {SCAN_INTERVAL_SEC}s ({SCAN_INTERVAL_SEC//60} minutes)")

            except KeyboardInterrupt:
                self.log("🛑 Shutting down gracefully...")
                self.save_state()
                break
            except Exception as e:
                self.log(f"❌ CRITICAL ERROR: {e}")
                traceback.print_exc()
                self.log("⚠️ Continuing despite error...")

            if "--once" in sys.argv:
                self.log("🛑 One-time scan complete. Exiting.")
                break

            time.sleep(SCAN_INTERVAL_SEC)


# ====================== ENTRY POINT ======================
if __name__ == "__main__":
    # 1. Acquire Lock to prevent multiple instances
    lock_fd = open(LOCK_FILE, 'w')
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except IOError:
        print("❌ Another instance is already running. Exiting.")
        sys.exit(1)

    webhook = os.getenv("DISCORD_WEBHOOK", DISCORD_WEBHOOK)
    if not webhook or webhook == "YOUR_DISCORD_WEBHOOK_HERE":
        print("⚠️ WARNING: No Discord webhook configured!")
        print("Set DISCORD_WEBHOOK environment variable")
        print("Continuing without Discord notifications...\n")

    bot = BountySeekerV5(webhook_url=webhook)
    bot.run_scan_loop()
