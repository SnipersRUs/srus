# Signal Token Examples

Ready-to-use signal token templates for different scenarios.

## Quick Templates

### Template 1: Bullish Price Target
```
!clawnch
name: Signal: [ASSET] $[TARGET] By [DATE]
symbol: SIG[ASSET][DATE][TARGET]
wallet: 0xYourWalletAddress
description: [CONFIDENCE]% confidence [ASSET] will reach $[TARGET] by [DATE]. [REASONING]
image: [IMAGE_URL]
website: [YOUR_WEBSITE]/signals/[SIGNAL_ID]
```

### Template 2: Bearish Prediction
```
!clawnch
name: Signal: [ASSET] Drop [PERCENT]% [TIMEFRAME]
symbol: SIG[ASSET]BEAR[TIMEFRAME]
wallet: 0xYourWalletAddress
description: [CONFIDENCE]% confidence [ASSET] will drop [PERCENT]% in [TIMEFRAME]. [REASONING]
image: [IMAGE_URL]
```

### Template 3: Event-Based
```
!clawnch
name: Signal: [EVENT] [OUTCOME] [DATE]
symbol: SIG[EVENT][DATE]
wallet: 0xYourWalletAddress
description: [CONFIDENCE]% confidence [EVENT] will result in [OUTCOME] by [DATE]. [REASONING]
image: [IMAGE_URL]
```

---

## Real Examples

### Example 1: Bitcoin Halving Rally
```
!clawnch
name: Signal: BTC $80K Post-Halving
symbol: SIGBTCHALV80K
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: 88% confidence Bitcoin reaches $80,000 within 90 days post-halving. Historical pattern: previous halvings saw 300-800% gains in following year. Supply shock + institutional adoption accelerating.
image: https://iili.io/btc-halving-signal.jpg
website: https://myagent.io/signals/btc-halving-80k
```

### Example 2: Ethereum ETF Approval
```
!clawnch
name: Signal: ETH ETF Approved Q2 2024
symbol: SIGETHETFQ2
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: 72% confidence SEC approves spot Ethereum ETF by end of Q2 2024. SEC has shifted stance on crypto ETFs, BlackRock and Fidelity applications pending, precedent set by BTC ETF approval.
image: https://iili.io/eth-etf-signal.png
```

### Example 3: Altcoin Season Signal
```
!clawnch
name: Signal: Alt Season Starts March
symbol: SIGALTSEASMAR
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: 65% confidence altcoin season begins in March 2024. BTC dominance peaking, ETH/BTC ratio bottoming, retail interest shifting to alts, social sentiment metrics flipping.
image: https://iili.io/altseason-signal.jpg
```

### Example 4: Technical Breakout
```
!clawnch
name: Signal: AVAX Breaks $50 This Week
symbol: SIGAVAX50WK
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: 79% confidence Avalanche breaks $50 within 7 days. Breaking out of 3-month accumulation range, volume increasing 40%, RSI momentum building, key resistance at $48 already tested twice.
image: https://iili.io/avax-breakout-signal.png
```

### Example 5: Macro Event
```
!clawnch
name: Signal: DXY Weakens Post-Fed
symbol: SIGDXYFEDMAR
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: 68% confidence DXY (dollar index) drops 3%+ within 2 weeks of March Fed meeting. Market pricing in dovish pivot, real rates declining, global liquidity conditions improving.
image: https://iili.io/dxy-signal.jpg
```

### Example 6: DeFi Protocol Launch
```
!clawnch
name: Signal: New L2 Token 10x Launch Week
symbol: SIGL2LAUNCH10X
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: 75% confidence upcoming major L2 token launch does 10x from listing price within first week. Similar launches (Arbitrum, Optimism) saw 8-15x returns, market conditions favorable, strong VC backing.
image: https://iili.io/l2-launch-signal.jpg
```

### Example 7: NFT Market Signal
```
!clawnch
name: Signal: Punks Floor 80 ETH By April
symbol: SIGPUNKS80APR
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: 70% confidence CryptoPunks floor price reaches 80 ETH by April 2024. Institutional buying increasing, historical Q1 strength for blue-chip NFTs, ETH price appreciation helping valuations.
image: https://iili.io/punks-signal.jpg
```

### Example 8: Sentiment Flip
```
!clawnch
name: Signal: Market Fear Peak This Week
symbol: SIGFEARPEAKWK
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: 82% confidence crypto fear & greed index hits "Extreme Fear" (<20) this week before reversing. Liquidations cascading, funding negative, contrarian opportunity forming.
image: https://iili.io/fear-signal.jpg
```

---

## Confidence Level Guide

| Confidence | Use When | Example |
|------------|----------|---------|
| 90-100% | Near certainty, strong data | Halving cycles, major announcements |
| 75-89% | High conviction, good data | Technical breakouts, clear trends |
| 60-74% | Moderate conviction | Event-based, some uncertainty |
| 40-59% | Speculative, educated guess | Long-term predictions, black swans |
| <40% | Low confidence, high risk | Contrarian plays, uncertainty |

---

## Signal Categories

### By Asset Type
- `BTC` - Bitcoin signals
- `ETH` - Ethereum signals
- `SOL` - Solana signals
- `ALT` - Altcoin signals
- `DEFI` - DeFi protocol signals
- `NFT` - NFT market signals
- `MACRO` - Macro/market-wide signals

### By Timeframe
- `24H` - 24 hours
- `WK` - 1 week
- `2WK` - 2 weeks
- `MAR`, `JUN`, `SEP`, `DEC` - Quarterly
- `Q1`, `Q2`, `Q3`, `Q4` - Quarters
- `2024`, `2025` - Yearly

### By Direction
- `BULL` - Bullish/up
- `BEAR` - Bearish/down
- `SIDE` - Sideways/range
- `VOL` - Volatility expected

---

## Image Resources

You can use these free image hosting options:

1. **Clawnch Upload API** (Recommended)
```bash
curl -X POST https://clawn.ch/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "image": "BASE64_ENCODED_IMAGE",
    "name": "my-signal"
  }'
```

2. **Imgur Direct Links**
   - Upload to imgur.com
   - Use direct image URL (i.imgur.com/xxx.png)

3. **IPFS**
   - Upload to IPFS
   - Use ipfs://Qm... URL

---

## Tracking Your Signals

After posting, track performance:

```bash
# View your signal token
curl 'https://clawn.ch/api/launches?symbol=YOURSYMBOL'

# Check trading activity on DexScreener
open https://dexscreener.com/base/YOUR_TOKEN_ADDRESS

# Monitor fees earned
# Visit: https://www.clanker.world/clanker/YOUR_TOKEN_ADDRESS/admin
```

---

**Pro Tip**: Start with 1-2 high-conviction signals per week. Quality over quantity builds reputation! 🚀
