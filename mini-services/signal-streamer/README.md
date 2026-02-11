# SRUS Signal Streamer

Real-time signal streaming service that connects to OKX WebSocket and sends trading signals directly to the SRUS app.

## Features

- **Real-time Price Monitoring**: Connects to OKX WebSocket for live price data
- **VWAP + Deviation Strategy**: Implements your Pine Script indicators in Python
- **Automatic Signal Generation**: Creates signals when price hits 2σ/3σ deviation zones
- **Direct to App**: No Discord needed - signals appear instantly on srus.life
- **A+/A/B Grading**: Signals graded by deviation severity and confluence

## Setup

1. Install dependencies:
```bash
cd mini-services/signal-streamer
pip install -r requirements.txt
```

2. Set environment variables (optional):
```bash
export SRUS_WEBHOOK_URL="http://localhost:3000/api/webhook/tradingview"
```

3. Run the streamer:
```bash
python signal_streamer.py
```

## How It Works

1. **Connects to OKX WebSocket** for real-time tickers and candles
2. **Calculates VWAP** from price history
3. **Monitors deviation** from VWAP in standard deviations
4. **Generates signals** when price hits 2σ or 3σ zones
5. **POSTs to SRUS webhook** which broadcasts to all connected clients

## Signal Logic

Based on your Pine Script indicators:

- **2σ-3σ Deviation**: Standard LONG/SHORT signals (score 70-95)
- **3σ+ Deviation**: A+ signals with larger targets (score 85-98)
- **Cooldown**: 5 minutes between signals per symbol

## Monitored Symbols

- BTC-USDT
- ETH-USDT
- SOL-USDT
- XRP-USDT
- ADA-USDT
- LINK-USDT
- AVAX-USDT
- DOGE-USDT

## TradingView Integration

To use with TradingView alerts:

1. Create an alert in TradingView
2. Set webhook URL to: `https://srus.life/api/webhook/tradingview`
3. Use this alert message format:
```json
{
  "symbol": "{{ticker}}",
  "side": "LONG",
  "entry_price": "{{close}}",
  "timeframe": "{{interval}}",
  "reasons": ["Golden Pocket Touch", "VWAP Deviation"],
  "score": 85
}
```

## Files

- `signal_streamer.py` - Main streamer service
- `requirements.txt` - Python dependencies
- `README.md` - This file
