'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Calculator, AlertTriangle, TrendingUp, DollarSign, Percent } from 'lucide-react'

interface RiskCalculation {
  positionSize: number
  marginRequired: number
  riskAmount: number
  riskPercent: number
  coinQuantity: number
  leverage: number
}

export function RiskCalculator() {
  const [accountBalance, setAccountBalance] = useState(10000)
  const [entryPrice, setEntryPrice] = useState(100)
  const [stopLoss, setStopLoss] = useState(99)
  const [riskPercent, setRiskPercent] = useState(1) // 1% risk per trade
  const [leverage, setLeverage] = useState(10)

  const calculatePosition = (): RiskCalculation => {
    const riskAmount = accountBalance * (riskPercent / 100)
    const priceRiskPercent = Math.abs(entryPrice - stopLoss) / entryPrice
    const positionSize = priceRiskPercent > 0 ? riskAmount / priceRiskPercent : 0
    const marginRequired = positionSize / leverage
    const coinQuantity = positionSize / entryPrice

    return {
      positionSize,
      marginRequired,
      riskAmount,
      riskPercent,
      coinQuantity,
      leverage
    }
  }

  const calc = calculatePosition()
  const isValid = entryPrice > 0 && stopLoss > 0 && entryPrice !== stopLoss

  return (
    <Card className="border-border bg-card">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Risk Calculator</CardTitle>
            <p className="text-xs text-muted-foreground">Plan your trade before you take it</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-5">
        {/* Account Balance */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Account Balance
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value))}
              className="pl-10 font-mono"
              placeholder="10000"
            />
          </div>
        </div>

        {/* Entry & Stop Loss */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Entry Price
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="pl-10 font-mono"
                placeholder="100"
                step="0.01"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Stop Loss
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="pl-10 font-mono"
                placeholder="99"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Risk % Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Risk Per Trade
            </Label>
            <Badge variant="outline" className="font-mono text-blue-400">
              {riskPercent}%
            </Badge>
          </div>
          <Slider
            value={[riskPercent]}
            onValueChange={(value) => setRiskPercent(value[0])}
            min={0.5}
            max={5}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Conservative (0.5%)</span>
            <span>Moderate (1-2%)</span>
            <span>Aggressive (5%)</span>
          </div>
        </div>

        {/* Leverage Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Leverage
            </Label>
            <Badge variant="outline" className="font-mono text-purple-400">
              {leverage}x
            </Badge>
          </div>
          <Slider
            value={[leverage]}
            onValueChange={(value) => setLeverage(value[0])}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        {/* Results */}
        {isValid ? (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase">Position Details</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Position Size</div>
                <div className="text-lg font-bold font-mono text-foreground">
                  ${calc.positionSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Margin Required</div>
                <div className="text-lg font-bold font-mono text-foreground">
                  ${calc.marginRequired.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Risk Amount</div>
                <div className="text-lg font-bold font-mono text-red-400">
                  ${calc.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {calc.riskPercent}% of account
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Coin Quantity</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {calc.coinQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  coins to buy
                </div>
              </div>
            </div>

            {/* Price Risk Display */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Price Distance to Stop</span>
                <span className="font-mono text-sm text-foreground">
                  {((Math.abs(entryPrice - stopLoss) / entryPrice) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-400">
              Enter entry price and stop loss to calculate position size
            </p>
          </div>
        )}

        {/* Formula Note */}
        <div className="p-3 rounded-xl bg-muted/30 text-[10px] text-muted-foreground">
          <strong className="text-foreground">Formula:</strong> Position Size = (Account × Risk%) ÷ (|Entry - Stop| ÷ Entry)
        </div>
      </CardContent>
    </Card>
  )
}
