'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, TrendingUp, TrendingDown, Zap, Target, Clock, Bot, Brain } from 'lucide-react'

interface BotStatus {
  name: string
  status: 'running' | 'stopped' | 'error'
  lastScan: string | null
  activeSignals: number
  totalSignals: number
  scanInterval: string
}

export function BotsView() {
  const [activeTab, setActiveTab] = useState<'overview' | 'short-hunter' | 'bounty-seeker'>('overview')
  const [botStatuses, setBotStatuses] = useState<Record<string, BotStatus>>({
    shortHunter: {
      name: 'Short Hunter',
      status: 'running',
      lastScan: null,
      activeSignals: 0,
      totalSignals: 0,
      scanInterval: '15 min'
    },
    bountySeeker: {
      name: 'Bounty Seeker',
      status: 'running',
      lastScan: null,
      activeSignals: 0,
      totalSignals: 0,
      scanInterval: '60 min'
    }
  })

  // Fetch bot statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        // Fetch Short Hunter status
        const shResponse = await fetch('/data/active_trades.json')
        if (shResponse.ok) {
          const shData = await shResponse.json()
          setBotStatuses(prev => ({
            ...prev,
            shortHunter: {
              ...prev.shortHunter,
              activeSignals: Object.keys(shData.active_trades || {}).length,
              lastScan: shData.lastUpdated || new Date().toISOString()
            }
          }))
        }

        // Fetch Bounty Seeker status
        const bsResponse = await fetch('/data/bounty_seeker_status.json')
        if (bsResponse.ok) {
          const bsData = await bsResponse.json()
          setBotStatuses(prev => ({
            ...prev,
            bountySeeker: {
              ...prev.bountySeeker,
              activeSignals: (bsData.open_trades || []).length,
              lastScan: bsData.lastUpdated || new Date().toISOString()
            }
          }))
        }
      } catch (error) {
        console.log('Bot status fetch error')
      }
    }

    fetchStatuses()
    const interval = setInterval(fetchStatuses, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const renderBotCard = (bot: BotStatus, type: 'short' | 'long') => {
    const isShort = type === 'short'

    return (
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isShort ? 'bg-purple-500/20' : 'bg-emerald-500/20'}`}>
                {isShort ? <TrendingDown className="w-5 h-5 text-purple-400" /> : <TrendingUp className="w-5 h-5 text-emerald-400" />}
              </div>
              <div>
                <CardTitle className="text-lg font-bold">{bot.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-[10px] ${bot.status === 'running' ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
                    {bot.status === 'running' ? '● RUNNING' : '○ STOPPED'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{bot.activeSignals}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Scan Interval</div>
              <div className="font-semibold text-foreground">{bot.scanInterval}</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Last Scan</div>
              <div className="font-semibold text-foreground">
                {bot.lastScan ? new Date(bot.lastScan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/50">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Strategy</div>
            <div className="text-sm text-muted-foreground">
              {isShort ? (
                <>
                  <span className="text-purple-400 font-medium">Short Opportunities</span>
                  <p className="text-xs text-muted-foreground mt-1">Scans all OKX perpetual futures for short setups using GPS Pro + Tactical Deviation</p>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 font-medium">Long Reversals</span>
                  <p className="text-xs text-muted-foreground mt-1">Hunts extreme bottoms at 2σ/3σ VWAP deviation with liquidation zone analysis</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-500" />
          Trading Bots
        </h2>
        <p className="text-muted-foreground text-sm">Automated signal generation with GPS Pro + Tactical Deviation</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-xl border border-border">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="short-hunter" className="rounded-lg text-xs font-medium data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            Short Hunter
          </TabsTrigger>
          <TabsTrigger value="bounty-seeker" className="rounded-lg text-xs font-medium data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            Bounty Seeker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderBotCard(botStatuses.shortHunter, 'short')}
            {renderBotCard(botStatuses.bountySeeker, 'long')}
          </div>

          {/* Bot Info */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg font-bold">How It Works</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-400">1</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Continuous Scanning</div>
                    <div className="text-xs text-muted-foreground">Bots scan markets every 15-60 minutes for high-probability setups</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-400">2</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Dual Indicator Analysis</div>
                    <div className="text-xs text-muted-foreground">Uses Tactical Deviation (VWAP + σ) + GPS Pro (Golden Pocket zones)</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-400">3</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Signal Grading</div>
                    <div className="text-xs text-muted-foreground">A+ (90-100), A (80-89), B (70-79) based on confluence score</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="short-hunter" className="space-y-4 mt-6">
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-lg font-bold text-foreground">Short Hunter Bot</h3>
                <p className="text-sm text-muted-foreground">Scans all OKX perpetual futures for short opportunities</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="text-sm font-medium text-purple-400 mb-2">Scan Configuration</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Interval:</span> <span className="text-foreground">15 minutes</span></div>
                <div><span className="text-muted-foreground">Markets:</span> <span className="text-foreground">All OKX Futures</span></div>
                <div><span className="text-muted-foreground">Timeframe:</span> <span className="text-foreground">15m candles</span></div>
                <div><span className="text-muted-foreground">Indicators:</span> <span className="text-foreground">GPS Pro + Deviation</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="text-sm font-medium text-purple-400 mb-2">Signal Criteria</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Price at/over Golden Pocket resistance</li>
                <li>• 2σ-3σ deviation above VWAP</li>
                <li>• Confluence score ≥ 55</li>
                <li>• High volume confirmation</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bounty-seeker" className="space-y-4 mt-6">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-foreground">Bounty Seeker Bot</h3>
                <p className="text-sm text-muted-foreground">Hunts extreme bottoms for mean reversion longs</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="text-sm font-medium text-emerald-400 mb-2">Scan Configuration</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Interval:</span> <span className="text-foreground">60 minutes</span></div>
                <div><span className="text-muted-foreground">Markets:</span> <span className="text-foreground">Top 30 by Volume</span></div>
                <div><span className="text-muted-foreground">Focus:</span> <span className="text-foreground">Long Reversals</span></div>
                <div><span className="text-muted-foreground">Indicators:</span> <span className="text-foreground">VWAP Deviation + GPS</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="text-sm font-medium text-emerald-400 mb-2">Signal Criteria</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Price at 2σ-3σ below VWAP (oversold)</li>
                <li>• Near Golden Pocket support zone</li>
                <li>• Liquidation sweep detected</li>
                <li>• Minimum 2:1 reward/risk ratio</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
