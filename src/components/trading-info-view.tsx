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
  BarChart3
} from 'lucide-react'

export function TradingInfoView() {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          Trading Guide
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-500 uppercase tracking-widest font-bold">
            How We Trade
          </div>
        </h2>
        <p className="text-gray-500 text-sm italic">Risk management and position sizing strategies</p>
      </div>

      {/* Risk Management Alert */}
      <Alert className="border-amber-500/20 bg-amber-500/5">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <AlertDescription className="text-amber-400 text-xs">
          <strong>Max 3% daily drawdown rule:</strong> If you lose more than 3% in a day, step away and touch grass. 
          Come back tomorrow with a clear head. Need help? Join our Discord: srus.life
        </AlertDescription>
      </Alert>

      {/* Signal Parameters */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Signal Parameters</CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500">
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
                  <span className="text-gray-500">Target:</span>
                  <span className="font-mono text-emerald-400">+2-3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stop Loss:</span>
                  <span className="font-mono text-red-400">-1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Leverage:</span>
                  <span className="font-mono text-white">None (Spot)</span>
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
                  <span className="text-gray-500">Target:</span>
                  <span className="font-mono text-emerald-400">+2-3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stop Loss:</span>
                  <span className="font-mono text-red-400">-1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Leverage:</span>
                  <span className="font-mono text-white">None (Spot)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-blue-500 uppercase">Why These Parameters?</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              We target 2-3% moves with 1% stops for a 2:1 to 3:1 risk/reward ratio. 
              No leverage means you can't get liquidated. Small wins compound over time 
              while limiting downside risk.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Position Sizing */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Position Sizing</CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500">
            How much to risk per trade (1% risk = 1% of account)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-blue-500 uppercase">The Math</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              If you have a $10,000 account and risk 1%, you're risking $100 per trade.
              With a 1% stop loss, your position size would be $10,000 (because $10,000 × 1% = $100).
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Conservative (Recommended)</span>
                <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-500">1% Risk</Badge>
              </div>
              <p className="text-xs text-gray-500">
                Risk 1% of your portfolio per trade. With a 1% stop loss, position size equals your portfolio.
              </p>
              <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded">
                $10,000 account → Risk $100 → Position: $10,000
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Moderate</span>
                <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">2% Risk</Badge>
              </div>
              <p className="text-xs text-gray-500">
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
              <p className="text-xs text-gray-500">
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
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Indicators & Tools</CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500">
            Download our custom TradingView indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          <p className="text-xs text-gray-400 leading-relaxed">
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
          
          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
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
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Scan Schedule</CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500">
            When we look for new opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
              <div className="text-2xl font-black text-purple-400 mb-1">45m</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Short Hunter</div>
              <div className="text-[10px] text-gray-600 mt-1">Scans for short setups</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
              <div className="text-2xl font-black text-emerald-400 mb-1">30m</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Bounty Seeker</div>
              <div className="text-[10px] text-gray-600 mt-1">Scans for long reversals</div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 leading-relaxed">
            Signals remain valid for up to 4 hours after generation. After that, 
            market conditions may have changed. Always check the signal timestamp 
            before entering.
          </p>
        </CardContent>
      </Card>

      {/* Strategy Overview */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Our Strategies</CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500">
            How signals are generated
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <h4 className="text-sm font-bold text-purple-400 mb-2">Short Hunter Strategy</h4>
              <ul className="space-y-1 text-xs text-gray-400">
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
              <ul className="space-y-1 text-xs text-gray-400">
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
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Need Help?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <p className="text-xs text-gray-500 mb-3">
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
      <div className="text-center space-y-3 pt-6 border-t border-white/10">
        <p className="text-[11px] text-white/80 font-bold uppercase tracking-widest">
          NFA (Not Financial Advice) • DYOR (Do Your Own Research)
        </p>
        <p className="text-[11px] text-white/60 leading-relaxed">
          Never blindly follow a trade. Markets are risky. Past performance does not guarantee future results.
        </p>
        <p className="text-[10px] text-white/40 pt-2">
          © 2026 Zoid Signals • Powered by Snipers-R-Us
        </p>
      </div>
    </div>
  )
}
