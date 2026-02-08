'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWebSocket } from '@/components/websocket-provider'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Clock, Activity, BarChart3, Bell, Zap, Target } from 'lucide-react'

export function SignalsView() {
    const { address } = useAccount()
    const { allTrades, prices, isConnected: socketConnected, lastUpdate } = useWebSocket()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'all' | 'longs' | 'shorts' | 'performance'>('all')
    const [lastScanTime, setLastScanTime] = useState<Date | null>(null)

    // Update loading state
    useEffect(() => {
        setLoading(false)
    }, [socketConnected, lastUpdate])

    // Safety timeout
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 5000)
        return () => clearTimeout(timer)
    }, [])

    // Update last scan time
    useEffect(() => {
        if (lastUpdate) setLastScanTime(new Date(lastUpdate))
    }, [lastUpdate])

    const hunterTrades = allTrades.filter(t => t.source === 'shortHunter')
    const seekerTrades = allTrades.filter(t => t.source === 'bountySeeker')

    const getFilteredTrades = () => {
        switch (activeTab) {
            case 'longs': return allTrades.filter(t => t.side === 'LONG')
            case 'shorts': return allTrades.filter(t => t.side === 'SHORT')
            default: return allTrades
        }
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const renderSignalCard = (trade: any) => {
        const isShort = trade.side === 'SHORT'
        const displaySymbol = trade.symbol.replace('/USDT', '').replace('USDT', '')
        const currentPrice = prices[displaySymbol]
        const entryPrice = trade.entry_price
        
        let priceChangePercent = null
        let pnlColor = 'text-gray-400'
        
        if (currentPrice && entryPrice) {
            const priceChange = isShort 
                ? entryPrice - currentPrice 
                : currentPrice - entryPrice
            priceChangePercent = (priceChange / entryPrice) * 100
            pnlColor = priceChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
        }

        const entryTime = new Date(trade.entry_time)
        const timeAgo = Math.floor((Date.now() - entryTime.getTime()) / (1000 * 60))
        const timeDisplay = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`

        return (
            <div key={trade.id} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-5 hover:border-white/20 transition-all duration-300">
                {/* Glow effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${isShort ? 'from-purple-500/5' : 'from-emerald-500/5'} to-transparent`} />
                
                <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isShort ? 'bg-purple-500/10' : 'bg-emerald-500/10'}`}>
                                {isShort ? (
                                    <TrendingDown className="w-6 h-6 text-purple-400" />
                                ) : (
                                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{displaySymbol}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`text-xs ${isShort ? 'border-purple-500/30 text-purple-400' : 'border-emerald-500/30 text-emerald-400'}`}>
                                        {trade.side}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{timeDisplay}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* P&L Display */}
                        {priceChangePercent !== null && (
                            <div className={`text-right ${pnlColor}`}>
                                <div className="text-2xl font-bold font-mono">
                                    {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                                </div>
                                <div className="text-xs opacity-70">
                                    ${currentPrice?.toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price Levels */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Entry</div>
                            <div className="font-mono font-semibold text-white">${entryPrice.toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Target</div>
                            <div className={`font-mono font-semibold ${isShort ? 'text-emerald-400' : 'text-purple-400'}`}>
                                ${trade.take_profit.toLocaleString()}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Stop</div>
                            <div className="font-mono font-semibold text-red-400">${trade.stop_loss.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Reasons */}
                    {trade.reasons && trade.reasons.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500">Analysis</div>
                            <div className="flex flex-wrap gap-2">
                                {trade.reasons.slice(0, 3).map((reason: string, idx: number) => (
                                    <span key={idx} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-300">
                                        {reason}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Source Badge */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                                {trade.source === 'shortHunter' ? 'Short Hunter' : 'Bounty Seeker'}
                            </span>
                        </div>
                        <a 
                            href={`https://www.tradingview.com/chart/?symbol=${displaySymbol}USDT`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-white transition-colors"
                        >
                            View Chart →
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Status Bar */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${socketConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                            {socketConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>
                    <span className="text-xs text-gray-500">
                        {allTrades.length} active signals
                    </span>
                </div>
                
                {lastScanTime && (
                    <div className="text-xs text-gray-500">
                        Last update: <span className="text-gray-400">{formatTime(lastUpdate || '')}</span>
                    </div>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-2xl font-bold">{allTrades.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Total</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-2xl font-bold text-emerald-400">{allTrades.filter(t => t.side === 'LONG').length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Longs</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-2xl font-bold text-purple-400">{allTrades.filter(t => t.side === 'SHORT').length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Shorts</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-2xl font-bold text-blue-400">{hunterTrades.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Short Hunter</div>
                </div>
            </div>

            {/* Signals List */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/[0.02] p-1 rounded-xl border border-white/5">
                    <TabsTrigger value="all" className="rounded-lg text-xs font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="longs" className="rounded-lg text-xs font-medium data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        Longs
                    </TabsTrigger>
                    <TabsTrigger value="shorts" className="rounded-lg text-xs font-medium data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                        Shorts
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="rounded-lg text-xs font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white">
                        Stats
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3 mt-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-sm text-gray-500">Loading signals...</p>
                        </div>
                    ) : getFilteredTrades().length === 0 ? (
                        <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/5">
                            <Activity className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-400 font-medium">No signals yet</p>
                            <p className="text-xs text-gray-600 mt-2">Waiting for bot scans...</p>
                        </div>
                    ) : (
                        getFilteredTrades().map(renderSignalCard)
                    )}
                </TabsContent>

                <TabsContent value="longs" className="space-y-3 mt-6">
                    {allTrades.filter(t => t.side === 'LONG').length === 0 ? (
                        <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/5">
                            <p className="text-gray-400">No long signals</p>
                        </div>
                    ) : (
                        allTrades.filter(t => t.side === 'LONG').map(renderSignalCard)
                    )}
                </TabsContent>

                <TabsContent value="shorts" className="space-y-3 mt-6">
                    {allTrades.filter(t => t.side === 'SHORT').length === 0 ? (
                        <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/5">
                            <p className="text-gray-400">No short signals</p>
                        </div>
                    ) : (
                        allTrades.filter(t => t.side === 'SHORT').map(renderSignalCard)
                    )}
                </TabsContent>

                <TabsContent value="performance" className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                            <div className="text-4xl font-bold mb-2">{allTrades.length}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Signals</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                            <div className="text-4xl font-bold text-emerald-400 mb-2">{seekerTrades.length}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Bounty Seeker</div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
