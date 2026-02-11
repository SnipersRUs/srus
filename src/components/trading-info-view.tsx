'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  Percent,
  Wallet,
  Info,
  ExternalLink,
  BarChart3,
  Activity,
  Zap,
  BookOpen,
  ArrowRightLeft,
  Bell
} from 'lucide-react'

export function TradingInfoView() {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-500" />
          Trading Guide
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-500 uppercase tracking-widest font-bold">
            Learn to Trade
          </div>
        </h2>
        <p className="text-muted-foreground text-sm italic">Master deviation zones, VWAP trading, and risk management</p>
      </div>

      {/* Risk Management Alert */}
      <Alert className="border-amber-500/20 bg-amber-500/5">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <AlertDescription className="text-amber-400 text-xs">
          <strong>Max 3% daily drawdown rule:</strong> If you lose more than 3% in a day, step away and touch grass.
          Come back tomorrow with a clear head. Need help? Join our Discord: srus.life
        </AlertDescription>
      </Alert>

      {/* What Are Deviation Zones? */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg font-bold">What Are Deviation Zones?</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Understanding VWAP and standard deviation bands
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              <strong className="text-blue-400">VWAP</strong> (Volume Weighted Average Price) is the average price of an asset
              weighted by volume. Think of it as the "fair price" where most trading happened.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              <strong className="text-blue-400">Deviation Zones</strong> are bands above and below VWAP that show
              how far price has moved from fair value. We use <strong>standard deviations (σ)</strong> to measure this:
            </p>

            <div className="grid grid-cols-1 gap-2 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-12 text-center">
                  <span className="text-lg font-bold text-emerald-400">1σ</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">1st Deviation Zone</div>
                  <div className="text-xs text-muted-foreground">Normal price movement - 68% of time spent here</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-12 text-center">
                  <span className="text-lg font-bold text-yellow-400">2σ</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">2nd Deviation Zone</div>
                  <div className="text-xs text-muted-foreground">Extended move - Only 5% of time spent here. <strong className="text-yellow-400">Trade Setup Zone!</strong></div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-orange-500/30">
                <div className="w-12 text-center">
                  <span className="text-lg font-bold text-orange-400">3σ</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">3rd Deviation Zone (EXTREME!)</div>
                  <div className="text-xs text-muted-foreground">Rare occurrence - Only 0.3% of time. <strong className="text-orange-400">High Probability Reversal!</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-purple-500 uppercase">Why This Works</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Price always returns to VWAP eventually. When price reaches 2σ or 3σ zones,
              it means the move is overextended and likely to reverse. We trade FROM these
              extreme zones BACK toward VWAP (the fair price).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How We Trade Deviation Zones */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
            <CardTitle className="text-lg font-bold">Trading From Deviation Zones</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Our exact entry and exit strategy
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-400">LONG Setup (Buying)</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">1.</span>
                  <span className="text-muted-foreground">Wait for price to drop to <strong className="text-emerald-400">-2σ or -3σ</strong> below VWAP</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">2.</span>
                  <span className="text-muted-foreground">Confirm with Golden Pocket support zone alignment</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">3.</span>
                  <span className="text-muted-foreground">Enter LONG position</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">4.</span>
                  <span className="text-muted-foreground">Target: Price returning to VWAP (the fair price)</span>
                </div>
              </div>

              <div className="mt-3 p-2 rounded bg-emerald-500/10 text-xs text-emerald-400">
                <strong>Example:</strong> BTC at $60,000, VWAP at $62,000 (-2σ deviation).
                We buy at $60k expecting it to return to $62k = <strong>3.3% profit</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-bold text-purple-400">SHORT Setup (Selling)</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">1.</span>
                  <span className="text-muted-foreground">Wait for price to pump to <strong className="text-purple-400">+2σ or +3σ</strong> above VWAP</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">2.</span>
                  <span className="text-muted-foreground">Confirm with Golden Pocket resistance zone alignment</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">3.</span>
                  <span className="text-muted-foreground">Enter SHORT position</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">4.</span>
                  <span className="text-muted-foreground">Target: Price returning to VWAP (the fair price)</span>
                </div>
              </div>

              <div className="mt-3 p-2 rounded bg-purple-500/10 text-xs text-purple-400">
                <strong>Example:</strong> BTC at $64,000, VWAP at $62,000 (+2σ deviation).
                We short at $64k expecting it to return to $62k = <strong>3.1% profit</strong>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-500 uppercase">Key Concept: Mean Reversion</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Markets are like rubber bands - they stretch away from fair value (VWAP) but
              <strong className="text-amber-400">always snap back</strong>. The further they stretch (2σ, 3σ),
              the harder they snap back. This is the core principle behind our strategy!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Golden Pocket Explained */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg font-bold">Golden Pocket (GPS Pro)</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Why 61.8% and 65% are magic numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              The <strong className="text-yellow-400">Golden Pocket</strong> is a Fibonacci retracement zone
              between 61.8% and 65%. This is where price often finds support (for longs) or
              resistance (for shorts).
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Think of it like this: If Bitcoin drops from $70k to $60k, the Golden Pocket zone
              would be around $63,800-$64,000. This is where buyers typically step in and price reverses.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs font-bold text-emerald-400 mb-1">For LONGS</div>
                <div className="text-xs text-muted-foreground">We want price IN or NEAR the Golden Pocket zone for support</div>
              </div>

              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-xs font-bold text-purple-400 mb-1">For SHORTS</div>
                <div className="text-xs text-muted-foreground">We want price AT or ABOVE the Golden Pocket zone for resistance</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-blue-500 uppercase">The Power of Confluence</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When <strong>BOTH</strong> indicators align - price at 2σ/3σ deviation AND in Golden Pocket zone -
              that's when we get A+ setups. It's like having two independent systems confirming the same trade.
              This dramatically increases our win rate!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Signal Parameters */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Signal Parameters</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            All signals use these standardized parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-500 uppercase">Longs</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-mono text-emerald-400">+2-3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stop Loss:</span>
                  <span className="font-mono text-red-400">-1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leverage:</span>
                  <span className="font-mono text-foreground">None (Spot)</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-purple-500 uppercase">Shorts</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-mono text-emerald-400">+2-3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stop Loss:</span>
                  <span className="font-mono text-red-400">-1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leverage:</span>
                  <span className="font-mono text-foreground">None (Spot)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-blue-500 uppercase">Why These Parameters?</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We target 2-3% moves with 1% stops for a 2:1 to 3:1 risk/reward ratio.
              No leverage means you can't get liquidated. Small wins compound over time
              while limiting downside risk.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Position Sizing */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Position Sizing</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            How much to risk per trade (1% risk = 1% of account)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-blue-500 uppercase">The Math</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you have a $10,000 account and risk 1%, you're risking $100 per trade.
              With a 1% stop loss, your position size would be $10,000 (because $10,000 × 1% = $100).
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">Conservative (Recommended)</span>
                <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-500">1% Risk</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Risk 1% of your portfolio per trade. With a 1% stop loss, position size equals your portfolio.
              </p>
              <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded">
                $10,000 account → Risk $100 → Position: $10,000
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">Moderate</span>
                <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">2% Risk</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Risk 2% of your portfolio per trade. With a 1% stop loss, position size is 2x your portfolio.
              </p>
              <div className="mt-2 text-xs font-mono text-amber-400 bg-amber-500/10 p-2 rounded">
                $10,000 account → Risk $200 → Position: $20,000
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-red-400">Aggressive (Not Recommended)</span>
                <Badge variant="outline" className="text-[10px] border-red-500 text-red-500">3% Risk</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Risk 3% of your portfolio per trade. Only for experienced traders.
              </p>
              <div className="mt-2 text-xs font-mono text-red-400 bg-red-500/10 p-2 rounded">
                $10,000 account → Risk $300 → Position: $30,000
              </div>
            </div>
          </div>

          <Alert className="border-purple-500/20 bg-purple-500/5">
            <Percent className="w-4 h-4 text-purple-500" />
            <AlertDescription className="text-purple-400 text-xs">
              <strong>Formula:</strong> Position Size = (Account × Risk%) ÷ Stop Loss%
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Indicators & Tools */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Indicators & Tools</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Download our custom TradingView indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our signals are generated using proprietary indicators available on TradingView.
            Use these tools to confirm signals and improve your entries.
          </p>

          <a
            href="https://srus.life/tradingview"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-wider hover:bg-blue-500/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Get TradingView Indicators
          </a>

          {/* TradingView Alert Setup */}
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase">TradingView Alert Setup</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-black/30 font-mono text-[10px] overflow-x-auto">
                <div className="text-muted-foreground mb-2"># Alert Message Format (copy this):</div>
                <div className="text-emerald-400">{'{'}</div>
                <div className="pl-2 text-blue-400">&quot;symbol&quot;: &quot;{'{{ticker}}'}&quot;,</div>
                <div className="pl-2 text-blue-400">&quot;side&quot;: &quot;LONG&quot;,</div>
                <div className="pl-2 text-blue-400">&quot;entry_price&quot;: {'{{close}}'},</div>
                <div className="pl-2 text-blue-400">&quot;stop_loss&quot;: {'{{close}}'} * 0.99,</div>
                <div className="pl-2 text-blue-400">&quot;take_profit&quot;: {'{{close}}'} * 1.03,</div>
                <div className="pl-2 text-blue-400">&quot;timeframe&quot;: &quot;{'{{interval}}'}&quot;,</div>
                <div className="pl-2 text-blue-400">&quot;score&quot;: 85,</div>
                <div className="pl-2 text-blue-400">&quot;reasons&quot;: [&quot;Golden Pocket Touch&quot;, &quot;VWAP Deviation&quot;]</div>
                <div className="text-emerald-400">{'}'}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">1.</span>
                  <span className="text-muted-foreground">Create alert in TradingView (Alt + A)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">2.</span>
                  <span className="text-muted-foreground">Set condition: Indicator → SRUS Signals</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">3.</span>
                  <span className="text-muted-foreground">Paste webhook URL: <span className="text-blue-400">https://srus.life/api/webhook/tradingview</span></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">4.</span>
                  <span className="text-muted-foreground">Copy alert message format above</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">5.</span>
                  <span className="text-muted-foreground">Click Create - Signals will appear instantly!</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>GPS Zones</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Deviation Bands</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Volume Analysis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>RSI Momentum</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Schedule */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Scan Schedule</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            When we look for new opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
              <div className="text-2xl font-black text-purple-400 mb-1">15m</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Short Hunter</div>
              <div className="text-[10px] text-muted-foreground mt-1">Scans for short setups</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
              <div className="text-2xl font-black text-emerald-400 mb-1">60m</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Bounty Seeker</div>
              <div className="text-[10px] text-muted-foreground mt-1">Scans for long reversals</div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Signals remain valid for up to 4 hours after generation. After that,
            market conditions may have changed. Always check the signal timestamp
            before entering.
          </p>
        </CardContent>
      </Card>

      {/* Strategy Overview */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Our Strategies</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            How signals are generated
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <h4 className="text-sm font-bold text-purple-400 mb-2">Short Hunter Strategy</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                  <span>Identifies overextended tops and local resistances</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                  <span>Uses GPS (Golden Pocket) resistance zones</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                  <span>Looks for +3 sigma deviation (overextended)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                  <span>Minimum 70/100 confidence score required</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <h4 className="text-sm font-bold text-emerald-400 mb-2">Bounty Seeker Strategy</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Hunts for reversal opportunities at extreme bottoms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Uses deviation VWAP setups (2σ-3σ zones)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Identifies liquidation cascade zones</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Minimum 40/100 confidence score required</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Need Help?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            Join our Discord community for real-time support, trade discussions,
            and direct access to the SRUS team.
          </p>
          <a
            href="https://srus.life"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-xs uppercase tracking-wider hover:bg-purple-500/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Join Discord: srus.life
          </a>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-center space-y-3 pt-6 border-t border-border">
        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
          NFA (Not Financial Advice) • DYOR (Do Your Own Research)
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Never blindly follow a trade. Markets are risky. Past performance does not guarantee future results.
        </p>
        <p className="text-[10px] text-muted-foreground pt-2">
          © 2026 Zoid Signals • Powered by Snipers-R-Us
        </p>
      </div>
    </div>
  )
}
