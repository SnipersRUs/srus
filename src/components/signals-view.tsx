'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWebSocket } from '@/components/websocket-provider'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Clock, Activity, BarChart3, Bell, Zap, Target, Bot, Trophy, User, Shield, AlertTriangle, Eye } from 'lucide-react'

export function SignalsView() {
    const { address } = useAccount()
    const { allTrades, prices: livePrices, isConnected: socketConnected, lastUpdate } = useWebSocket()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'all' | 'watchlist' | 'bounty-seeker' | 'short-hunter' | 'sniper-guru'>('all')
    const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
    const [sniperGuruStats, setSniperGuruStats] = useState({
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnL: 0,
        activeTrades: 0,
        startingCapital: 10000,
        currentBalance: 10000,
        leverage: 10,
        maxPositions: 3,
        maxDrawdownPerTrade: 1,
        maxDailyDrawdown: 3,
        cooldownHours: 4,
        dailyPnL: 0,
        inCooldown: false,
        cooldownEndTime: null as Date | null,
        nextScanTime: null as Date | null,
        lastScanTime: null as Date | null,
        scanInterval: 45
    })

    // Bot scan status
    const [botScanStatus, setBotScanStatus] = useState({
        shortHunter: {
            lastScan: null as Date | null,
            nextScan: null as Date | null,
            isScanning: false,
            scanInterval: 15 // minutes
        },
        bountySeeker: {
            lastScan: null as Date | null,
            nextScan: null as Date | null,
            isScanning: false,
            scanInterval: 60 // minutes
        }
    })

    // Update loading state
    useEffect(() => {
        setLoading(false)
    }, [socketConnected, lastUpdate])

    // Safety timeout
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 5000)
        return () => clearTimeout(timer)
    }, [])

    // Update last scan time and calculate next scan
    useEffect(() => {
        if (lastUpdate) {
            const lastScan = new Date(lastUpdate)
            setLastScanTime(lastScan)

            // Calculate next scan time (45 minutes from last scan)
            const nextScan = new Date(lastScan.getTime() + 45 * 60 * 1000)
            setSniperGuruStats(prev => ({
                ...prev,
                lastScanTime: lastScan,
                nextScanTime: nextScan
            }))
        }
    }, [lastUpdate])

    // Fetch bot scan status from data files
    useEffect(() => {
        const fetchBotStatus = async () => {
            try {
                // Fetch Short Hunter status
                const shResponse = await fetch('/data/active_trades.json')
                if (shResponse.ok) {
                    const shData = await shResponse.json()
                    // Short Hunter scans every 15 minutes
                    const lastScan = new Date()
                    const nextScan = new Date(lastScan.getTime() + 15 * 60 * 1000)

                    setBotScanStatus(prev => ({
                        ...prev,
                        shortHunter: {
                            ...prev.shortHunter,
                            lastScan,
                            nextScan
                        }
                    }))
                }

                // Fetch Bounty Seeker status
                const bsResponse = await fetch('/data/bounty_seeker_status.json')
                if (bsResponse.ok) {
                    const bsData = await bsResponse.json()
                    const lastScan = bsData.last_scan_time ? new Date(bsData.last_scan_time) : new Date()
                    const nextScan = bsData.next_scan_time ? new Date(bsData.next_scan_time) : new Date(lastScan.getTime() + 60 * 60 * 1000)

                    setBotScanStatus(prev => ({
                        ...prev,
                        bountySeeker: {
                            ...prev.bountySeeker,
                            lastScan,
                            nextScan
                        }
                    }))
                }
            } catch (error) {
                console.log('Bot status fetch error')
            }
        }

        fetchBotStatus()
        const interval = setInterval(fetchBotStatus, 30000) // Update every 30 seconds
        return () => clearInterval(interval)
    }, [])

    // Countdown timer for next scans
    useEffect(() => {
        const timer = setInterval(() => {
            setBotScanStatus(prev => {
                const now = new Date()

                // Update Short Hunter countdown
                let shNextScan = prev.shortHunter.nextScan
                if (shNextScan && shNextScan.getTime() <= now.getTime()) {
                    shNextScan = new Date(now.getTime() + prev.shortHunter.scanInterval * 60 * 1000)
                }

                // Update Bounty Seeker countdown
                let bsNextScan = prev.bountySeeker.nextScan
                if (bsNextScan && bsNextScan.getTime() <= now.getTime()) {
                    bsNextScan = new Date(now.getTime() + prev.bountySeeker.scanInterval * 60 * 1000)
                }

                return {
                    ...prev,
                    shortHunter: {
                        ...prev.shortHunter,
                        nextScan: shNextScan
                    },
                    bountySeeker: {
                        ...prev.bountySeeker,
                        nextScan: bsNextScan
                    }
                }
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Sniper Guru active trades state
    const [sniperGuruTrades, setSniperGuruTrades] = useState<any[]>([])

    // Watchlist state - coins approaching trade zones
    const [watchlist, setWatchlist] = useState<any[]>([])

    // Fetch Sniper Guru stats and trades
    useEffect(() => {
        const fetchSniperGuruData = async () => {
            try {
                const response = await fetch('/data/sniper_guru_trades.json')
                if (response.ok) {
                    const data = await response.json()
                    const trades = data.trades || []

                    // Separate active and closed trades
                    const activeTradesList = trades.filter((t: any) => t.status === 'active')
                    const closedTrades = trades.filter((t: any) => t.status === 'closed')

                    // Use stats from file if available, otherwise calculate
                    const fileStats = data.stats || {}
                    const wins = fileStats.wins ?? closedTrades.filter((t: any) => t.pnl > 0).length
                    const losses = fileStats.losses ?? closedTrades.filter((t: any) => t.pnl < 0).length
                    const totalTrades = fileStats.total_trades ?? closedTrades.length
                    const winRate = fileStats.win_rate ?? (closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0)
                    const totalPnL = fileStats.total_pnl ?? closedTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0)
                    const startingBalance = data.starting_balance ?? 10000
                    const currentBalance = data.equity ?? (startingBalance + totalPnL)

                    // Update active trades with real-time PnL
                    const activeTradesWithPnL = activeTradesList.map((trade: any) => {
                        const symbol = normalizeSymbol(trade.symbol)

                        // Try exact match first, then fuzzy match
                        let currentPrice = livePrices[symbol]

                        // If exact match fails, try adding USDT back for lookup or check keys
                        if (!currentPrice) {
                            // Some feeds store keys as BTCUSDT, some as BTC
                            const usdtSymbol = symbol + 'USDT'
                            if (livePrices[usdtSymbol]) {
                                currentPrice = livePrices[usdtSymbol]
                            } else {
                                // Fuzzy match
                                const priceKeys = Object.keys(livePrices)
                                const matchingKey = priceKeys.find(key =>
                                    key.includes(symbol) || symbol.includes(key)
                                )
                                if (matchingKey) currentPrice = livePrices[matchingKey]
                            }
                        }

                        if (currentPrice && trade.entry_price) {
                            const isShort = trade.side === 'SHORT'
                            const priceChange = isShort
                                ? trade.entry_price - currentPrice
                                : currentPrice - trade.entry_price
                            const pnlPercent = (priceChange / trade.entry_price) * 100

                            return {
                                ...trade,
                                current_price: currentPrice,
                                unrealized_pnl: pnlPercent,
                                unrealized_pnl_pct: pnlPercent,
                                unrealized_pnl_lev: pnlPercent * (trade.leverage || 10),
                                unrealized_pnl_usd: (priceChange / trade.entry_price) * (trade.position_size?.position_value || 0),
                                id: trade.id || `sg-${trade.symbol}-${Date.now()}`,
                                entry_time: trade.entry_time || new Date().toISOString(),
                                source: 'sniperGuru'
                            }
                        }

                        return {
                            ...trade,
                            id: trade.id || `sg-${trade.symbol}-${Date.now()}`,
                            entry_time: trade.entry_time || new Date().toISOString(),
                            source: 'sniperGuru'
                        }
                    })

                    setSniperGuruTrades(activeTradesWithPnL)

                    setSniperGuruStats(prev => ({
                        ...prev,
                        totalTrades: totalTrades,
                        wins,
                        losses,
                        winRate,
                        totalPnL,
                        activeTrades: activeTradesList.length,
                        currentBalance,
                        startingCapital: startingBalance,
                        leverage: fileStats.leverage ?? 10
                    }))
                }
            } catch (error) {
                console.log('Sniper Guru data fetch error')
            }
        }

        fetchSniperGuruData()
        const interval = setInterval(fetchSniperGuruData, 5000) // Update every 5 seconds for real-time PnL
        return () => clearInterval(interval)
    }, [livePrices])

    // Filter trades by bot source
    const hunterTrades = allTrades.filter(t => t.source === 'shortHunter')
    const seekerTrades = allTrades.filter(t => t.source === 'bountySeeker')
    const realtimeTrades = allTrades.filter(t => t.source === 'tradingview')

    const getFilteredTrades = () => {
        switch (activeTab) {
            case 'bounty-seeker': return seekerTrades
            case 'short-hunter': return hunterTrades
            case 'sniper-guru': return realtimeTrades // Will show Sniper Guru's trades
            default: return allTrades
        }
    }

    // Fetch watchlist - coins approaching trade zones
    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                // Fetch from Bounty Seeker watchlist candidates
                const bsResponse = await fetch('/data/bounty_seeker_status.json')
                let watchlistItems: any[] = []
                
                if (bsResponse.ok) {
                    const bsData = await bsResponse.json()
                    const candidates = bsData.watchlist_candidates || []
                    
                    // Convert candidates to watchlist format
                    candidates.forEach((candidate: any) => {
                        const symbol = candidate.symbol?.replace('/USDT:USDT', '').replace('USDT', '') || 'UNKNOWN'
                        const currentPrice = livePrices[symbol] || candidate.price
                        
                        // Determine setup type based on reasons
                        const reasons = candidate.reasons || []
                        let setupType = 'NEUTRAL'
                        let confidence = 50
                        
                        if (reasons.some((r: string) => r.includes('GPS') && r.includes('Short'))) {
                            setupType = 'SHORT_SETUP'
                            confidence = 70
                        } else if (reasons.some((r: string) => r.includes('Support'))) {
                            setupType = 'LONG_SETUP'
                            confidence = 65
                        } else if (reasons.some((r: string) => r.includes('Lower Range'))) {
                            setupType = 'WATCHING'
                            confidence = 45
                        }
                        
                        watchlistItems.push({
                            symbol,
                            price: currentPrice,
                            distance: candidate.distance,
                            reasons: candidate.reasons,
                            setup_type: setupType,
                            confidence,
                            timestamp: new Date().toISOString()
                        })
                    })
                }
                
                // Sort by confidence (highest first)
                watchlistItems.sort((a, b) => b.confidence - a.confidence)
                
                setWatchlist(watchlistItems)
            } catch (error) {
                console.log('Watchlist fetch error')
            }
        }
        
        fetchWatchlist()
        const interval = setInterval(fetchWatchlist, 10000) // Update every 10 seconds
        return () => clearInterval(interval)
    }, [livePrices])

    // Robust symbol normalization
    const normalizeSymbol = (symbol: string) => {
        // Handle formats like "ICP/USDT:USDT", "BTC/USDT", "ETH-USDT"
        const normalized = symbol
            .replace(/:USDT/g, '')
            .replace(/\/USDT/g, '')
            .replace(/-USDT/g, '')
            .replace(/USDT/g, '')
            .trim()
            .toUpperCase()

        return normalized
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Format countdown timer
    const formatCountdown = (targetDate: Date | null) => {
        if (!targetDate) return '--:--'
        const now = new Date()
        const diff = targetDate.getTime() - now.getTime()
        if (diff <= 0) return 'Scanning...'
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // Safe number formatter
    const safeFormat = (num: number | undefined) => {
        if (num === undefined || num === null) return '0'
        return num.toLocaleString()
    }

    // Check if signal is stale (older than 4 hours)
    const isSignalStale = (entryTime: string) => {
        const entry = new Date(entryTime)
        const now = new Date()
        const hoursDiff = (now.getTime() - entry.getTime()) / (1000 * 60 * 60)
        return hoursDiff > 4
    }

    // Force re-render when prices change
    useEffect(() => {
        // This ensures the component re-renders when prices update
    }, [livePrices])

    const renderSignalCard = (trade: any) => {
        const isShort = trade.side === 'SHORT'
        const displaySymbol = normalizeSymbol(trade.symbol)

        // Get current price - robust matching
        let currentPrice: number | undefined = undefined

        // Try exact match first (e.g., BTC)
        if (livePrices[displaySymbol]) {
            currentPrice = livePrices[displaySymbol]
        } else {
            // Try with USDT suffix (e.g., BTCUSDT)
            const usdtSymbol = displaySymbol + 'USDT'
            if (livePrices[usdtSymbol]) {
                currentPrice = livePrices[usdtSymbol]
            } else {
                // Fuzzy match
                const priceKeys = Object.keys(livePrices)
                const matchingKey = priceKeys.find(key =>
                    key === displaySymbol ||
                    key === usdtSymbol ||
                    key.includes(displaySymbol)
                )
                if (matchingKey) {
                    currentPrice = livePrices[matchingKey]
                }
            }
        }

        const entryPrice = trade.entry_price

        let priceChangePercent: number | null = null
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

        // Determine bot name and color
        let botName = 'Signal'
        let botColor = 'text-gray-400'
        if (trade.source === 'shortHunter') {
            botName = 'Short Hunter'
            botColor = 'text-purple-400'
        } else if (trade.source === 'bountySeeker') {
            botName = 'Bounty Seeker'
            botColor = 'text-emerald-400'
        } else if (trade.source === 'tradingview') {
            botName = 'Real-Time'
            botColor = 'text-blue-400'
        }

        return (
            <div key={trade.id} className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 hover:border-border/80 transition-all duration-300">
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
                                <a
                                    href={`https://www.tradingview.com/chart/?symbol=BINANCE:${displaySymbol}USDT`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xl font-bold text-foreground hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                    {displaySymbol}
                                </a>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`text-xs ${isShort ? 'border-purple-500/30 text-purple-400' : 'border-emerald-500/30 text-emerald-400'}`}>
                                        {trade.side}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{timeDisplay}</span>
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
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-muted/50">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Entry</div>
                            <div className="font-mono font-semibold text-foreground">${entryPrice.toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/50">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current</div>
                            <div className="font-mono font-semibold text-blue-400">
                                ${currentPrice ? currentPrice.toLocaleString() : 'Loading...'}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/50">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Target</div>
                            <div className={`font-mono font-semibold ${isShort ? 'text-emerald-400' : 'text-purple-400'}`}>
                                ${trade.take_profit.toLocaleString()}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/50">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Stop</div>
                            <div className="font-mono font-semibold text-red-400">${trade.stop_loss.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Reasons */}
                    {trade.reasons && trade.reasons.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Analysis</div>
                            <div className="flex flex-wrap gap-2">
                                {trade.reasons.slice(0, 3).map((reason: string, idx: number) => (
                                    <span key={idx} className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                                        {reason}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Source Badge */}
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-muted-foreground" />
                            <span className={`text-xs ${botColor}`}>
                                {botName}
                            </span>
                        </div>
                        <a
                            href={`https://www.tradingview.com/chart/?symbol=${displaySymbol}USDT`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            View Chart →
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    const filteredTrades = getFilteredTrades()

    return (
        <div className="space-y-6 pb-32">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <Activity className="w-6 h-6 text-purple-500" />
                    Trading Signals
                </h2>
                <p className="text-muted-foreground text-sm">Live signals from our automated bots</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                    <div className="text-2xl font-bold">{allTrades.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                    <div className="text-2xl font-bold text-emerald-400">{seekerTrades.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Bounty Seeker</div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                    <div className="text-2xl font-bold text-purple-400">{hunterTrades.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Short Hunter</div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                    <div className="text-2xl font-bold text-orange-400">{realtimeTrades.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Real-Time</div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-muted p-1 rounded-xl border border-border">
                    <TabsTrigger value="all" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="watchlist" className="rounded-lg text-xs font-medium data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                        Watchlist
                    </TabsTrigger>
                    <TabsTrigger value="bounty-seeker" className="rounded-lg text-xs font-medium data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        Bounty Seeker
                    </TabsTrigger>
                    <TabsTrigger value="short-hunter" className="rounded-lg text-xs font-medium data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                        Short Hunter
                    </TabsTrigger>
                    <TabsTrigger value="sniper-guru" className="rounded-lg text-xs font-medium data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                        Sniper Guru
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="watchlist" className="space-y-3 mt-6">
                    {/* Watchlist Header */}
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-5 h-5 text-blue-400" />
                            <span className="text-sm font-bold text-blue-400">Potential Trade Zones</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Coins approaching Golden Pocket zones or VWAP deviation levels. These are setting up for potential signals.
                        </p>
                    </div>

                    {watchlist.length === 0 ? (
                        <div className="text-center py-12">
                            <Eye className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <p className="text-muted-foreground">No coins in watchlist</p>
                            <p className="text-muted-foreground text-sm mt-1">Bots are scanning for setups...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {watchlist.map((item: any, index: number) => (
                                <div key={index} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 p-4 hover:border-blue-500/40 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                item.setup_type === 'SHORT_SETUP' ? 'bg-purple-500/20' : 
                                                item.setup_type === 'LONG_SETUP' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                                            }`}>
                                                {item.setup_type === 'SHORT_SETUP' ? (
                                                    <TrendingDown className="w-5 h-5 text-purple-400" />
                                                ) : item.setup_type === 'LONG_SETUP' ? (
                                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                                ) : (
                                                    <Eye className="w-5 h-5 text-blue-400" />
                                                )}
                                            </div>
                                            <div>
                                                <a
                                                    href={`https://www.tradingview.com/chart/?symbol=BINANCE:${item.symbol}USDT`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-lg font-bold text-white hover:text-blue-400 transition-colors cursor-pointer"
                                                >
                                                    {item.symbol}
                                                </a>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className={`text-xs ${
                                                        item.setup_type === 'SHORT_SETUP' ? 'border-purple-500/30 text-purple-400' :
                                                        item.setup_type === 'LONG_SETUP' ? 'border-emerald-500/30 text-emerald-400' :
                                                        'border-blue-500/30 text-blue-400'
                                                    }`}>
                                                        {item.setup_type.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">{item.confidence}% confidence</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-white">
                                                ${item.price?.toLocaleString() || '---'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Distance: {(item.distance * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reasons */}
                                    {item.reasons && item.reasons.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Analysis</div>
                                            <div className="flex flex-wrap gap-2">
                                                {item.reasons.slice(0, 3).map((reason: string, idx: number) => (
                                                    <span key={idx} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-300">
                                                        {reason}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="all" className="space-y-3 mt-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground text-sm">Loading signals...</p>
                        </div>
                    ) : filteredTrades.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No signals yet</p>
                            <p className="text-muted-foreground text-sm mt-1">Bots are scanning for opportunities...</p>
                        </div>
                    ) : (
                        filteredTrades.map(renderSignalCard)
                    )}
                </TabsContent>

                <TabsContent value="bounty-seeker" className="space-y-3 mt-6">
                    {/* Bounty Seeker Scan Status */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs text-muted-foreground">Next Scan</span>
                            </div>
                            <span className="text-xl font-bold font-mono text-emerald-400">
                                {formatCountdown(botScanStatus.bountySeeker.nextScan)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Last scan: {botScanStatus.bountySeeker.lastScan ? botScanStatus.bountySeeker.lastScan.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                            <span>Every 60 min</span>
                        </div>
                    </div>

                    {seekerTrades.length === 0 ? (
                        <div className="text-center py-12">
                            <TrendingUp className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                            <p className="text-muted-foreground">No long signals yet</p>
                            <p className="text-muted-foreground text-sm mt-1">Bounty Seeker hunts for reversal bottoms...</p>
                        </div>
                    ) : (
                        seekerTrades.map(renderSignalCard)
                    )}
                </TabsContent>

                <TabsContent value="short-hunter" className="space-y-3 mt-6">
                    {/* Short Hunter Scan Status */}
                    <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-purple-400" />
                                <span className="text-xs text-muted-foreground">Next Scan</span>
                            </div>
                            <span className="text-xl font-bold font-mono text-purple-400">
                                {formatCountdown(botScanStatus.shortHunter.nextScan)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Last scan: {botScanStatus.shortHunter.lastScan ? botScanStatus.shortHunter.lastScan.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                            <span>Every 15 min</span>
                        </div>
                    </div>

                    {hunterTrades.length === 0 ? (
                        <div className="text-center py-12">
                            <TrendingDown className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                            <p className="text-muted-foreground">No short signals yet</p>
                            <p className="text-muted-foreground text-sm mt-1">Short Hunter scans for overextended tops...</p>
                        </div>
                    ) : (
                        hunterTrades.map(renderSignalCard)
                    )}
                </TabsContent>

                <TabsContent value="sniper-guru" className="space-y-4 mt-6">
                    {/* Sniper Guru Stats Card */}
                    <Card className="border-orange-500/20 bg-orange-500/5">
                        <CardHeader className="p-5 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-foreground">Sniper Guru</CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Live trading performance tracker
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            {/* Account Info */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                                    <div className="text-lg font-bold text-blue-400">${safeFormat(sniperGuruStats.startingCapital)}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Starting Capital</div>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                                    <div className="text-lg font-bold text-purple-400">{sniperGuruStats.leverage}x</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Leverage</div>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                    <div className="text-lg font-bold text-amber-400">{sniperGuruStats.activeTrades}/{sniperGuruStats.maxPositions}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Positions</div>
                                </div>
                            </div>

                            {/* Scan Timer */}
                            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs text-muted-foreground">Next Scan In</span>
                                    </div>
                                    <span className="text-xl font-bold font-mono text-indigo-400">
                                        {formatCountdown(sniperGuruStats.nextScanTime)}
                                    </span>
                                </div>
                                <div className="mt-2 text-[10px] text-muted-foreground">
                                    Scans every 45 minutes for new opportunities
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl bg-muted/50 text-center">
                                    <div className="text-2xl font-bold text-foreground">{sniperGuruStats.totalTrades}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Trades</div>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-center">
                                    <div className="text-2xl font-bold text-emerald-400">{sniperGuruStats.wins}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Wins</div>
                                </div>
                                <div className="p-3 rounded-xl bg-red-500/10 text-center">
                                    <div className="text-2xl font-bold text-red-400">{sniperGuruStats.losses}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Losses</div>
                                </div>
                                <div className="p-3 rounded-xl bg-orange-500/10 text-center">
                                    <div className="text-2xl font-bold text-orange-400">{sniperGuruStats.winRate}%</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</div>
                                </div>
                            </div>

                            {/* Current Balance & Daily P&L */}
                            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Current Balance</span>
                                    <span className={`text-2xl font-bold font-mono ${(sniperGuruStats.currentBalance || 0) >= (sniperGuruStats.startingCapital || 10000) ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ${safeFormat(sniperGuruStats.currentBalance)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">Total P&L</span>
                                    <span className={`text-sm font-bold font-mono ${(sniperGuruStats.totalPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {(sniperGuruStats.totalPnL || 0) >= 0 ? '+' : ''}{(sniperGuruStats.totalPnL || 0).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                    <span className="text-xs text-muted-foreground">Today's P&L</span>
                                    <span className={`text-sm font-bold font-mono ${(sniperGuruStats.dailyPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {(sniperGuruStats.dailyPnL || 0) >= 0 ? '+' : ''}{(sniperGuruStats.dailyPnL || 0).toFixed(2)}%
                                    </span>
                                </div>
                            </div>

                            {/* Risk Management */}
                            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4 text-red-400" />
                                    <span className="text-xs font-bold text-red-400 uppercase">Risk Management</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between p-2 rounded bg-muted">
                                        <span className="text-muted-foreground">Max Loss/Trade</span>
                                        <span className="font-bold text-red-400">{sniperGuruStats.maxDrawdownPerTrade}%</span>
                                    </div>
                                    <div className="flex justify-between p-2 rounded bg-muted">
                                        <span className="text-muted-foreground">Max Daily Loss</span>
                                        <span className="font-bold text-orange-400">{sniperGuruStats.maxDailyDrawdown}%</span>
                                    </div>
                                </div>

                                {/* Cooldown Status */}
                                {sniperGuruStats.inCooldown && (
                                    <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                            <span className="text-xs font-bold text-red-400">COOLDOWN ACTIVE</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Daily drawdown limit reached. Trading paused for {sniperGuruStats.cooldownHours} hours.
                                        </p>
                                        {sniperGuruStats.cooldownEndTime && (
                                            <p className="text-[10px] text-red-400 mt-1">
                                                Resumes at: {sniperGuruStats.cooldownEndTime.toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 p-3 rounded-xl bg-muted/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-orange-400" />
                                    <span className="text-xs font-bold text-orange-400 uppercase">About Sniper Guru</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Sniper Guru is our AI trading agent that executes signals in real-time with
                                    <strong className="text-orange-400"> 10x leverage</strong> and a strict
                                    <strong className="text-orange-400"> max 3 positions</strong> rule. Risk management:
                                    <strong className="text-red-400"> max 1% loss per trade</strong>,
                                    <strong className="text-orange-400"> 3% max daily drawdown</strong> with
                                    <strong className="text-amber-400"> 4-hour cooldown</strong> if hit.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sniper Guru's Active Trades - Max 3 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Active Trades</h3>
                            <span className="text-xs text-orange-400">{sniperGuruTrades.length}/3 Positions</span>
                        </div>

                        {sniperGuruTrades.length === 0 ? (
                            <div className="text-center py-8">
                                <Target className="w-10 h-10 text-orange-600 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">No active trades</p>
                                <p className="text-muted-foreground text-xs mt-1">Waiting for next setup...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sniperGuruTrades.slice(0, 3).map((trade) => {
                                    const isShort = trade.side === 'SHORT'
                                    const displaySymbol = normalizeSymbol(trade.symbol)

                                    // Robust Price Matching (Same as renderSignalCard)
                                    let currentPrice: number | undefined = undefined

                                    // Try exact match first
                                    if (livePrices[displaySymbol]) {
                                        currentPrice = livePrices[displaySymbol]
                                    } else {
                                        // Try with USDT suffix
                                        const usdtSymbol = displaySymbol + 'USDT'
                                        if (livePrices[usdtSymbol]) {
                                            currentPrice = livePrices[usdtSymbol]
                                        } else {
                                            // Fuzzy match
                                            const priceKeys = Object.keys(livePrices)
                                            const matchingKey = priceKeys.find(key =>
                                                key === displaySymbol ||
                                                key === usdtSymbol ||
                                                key.includes(displaySymbol)
                                            )
                                            if (matchingKey) {
                                                currentPrice = livePrices[matchingKey]
                                            }
                                        }
                                    }

                                    const entryPrice = trade.entry_price

                                    // Real-time PnL Calculation
                                    let pnlPercent = 0
                                    let pnlColor = 'text-gray-400'

                                    if (currentPrice && entryPrice) {
                                        const priceChange = isShort
                                            ? entryPrice - currentPrice
                                            : currentPrice - entryPrice
                                        pnlPercent = (priceChange / entryPrice) * 100
                                        pnlColor = pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    } else if (trade.unrealized_pnl) {
                                        // Fallback to bot provided PnL if live price unavailable
                                        pnlPercent = trade.unrealized_pnl
                                        pnlColor = pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    }

                                    return (
                                        <div key={trade.id} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isShort ? 'bg-purple-500/20' : 'bg-emerald-500/20'}`}>
                                                        {isShort ? (
                                                            <TrendingDown className="w-5 h-5 text-purple-400" />
                                                        ) : (
                                                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <a
                                                            href={`https://www.tradingview.com/chart/?symbol=BINANCE:${displaySymbol}USDT`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-lg font-bold text-foreground hover:text-orange-400 transition-colors cursor-pointer"
                                                        >
                                                            {displaySymbol}
                                                        </a>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className={`text-xs ${isShort ? 'border-purple-500/30 text-purple-400' : 'border-emerald-500/30 text-emerald-400'}`}>
                                                                {trade.side}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">10x Lev</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Real-time PnL with Position Size */}
                                                <div className={`text-right ${pnlColor}`}>
                                                    <div className="text-xl font-bold font-mono">
                                                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                                    </div>
                                                    {trade.position_size && (
                                                        <div className="text-[10px] opacity-70">
                                                            Pos: ${trade.position_size.position_value?.toLocaleString()}
                                                        </div>
                                                    )}
                                                    {trade.unrealized_pnl_usd !== undefined && (
                                                        <div className="text-xs font-mono">
                                                            {trade.unrealized_pnl_usd >= 0 ? '+' : ''}${trade.unrealized_pnl_usd.toFixed(2)}
                                                        </div>
                                                    )}
                                                    <div className="text-xs opacity-50">
                                                        ${currentPrice?.toLocaleString() || '---'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price Levels & Position Info */}
                                            <div className="grid grid-cols-4 gap-2 mb-3">
                                                <div className="p-2 rounded-lg bg-muted/50">
                                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Entry</div>
                                                    <div className="font-mono font-semibold text-foreground text-sm">${entryPrice.toLocaleString()}</div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-muted/50">
                                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current</div>
                                                    <div className="font-mono font-semibold text-orange-400 text-sm">${currentPrice?.toLocaleString() || '---'}</div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-muted/50">
                                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Target</div>
                                                    <div className={`font-mono font-semibold ${isShort ? 'text-emerald-400' : 'text-purple-400'} text-sm`}>
                                                        ${trade.take_profit?.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                    <div className="text-[10px] uppercase tracking-wider text-blue-400 mb-1">Position</div>
                                                    <div className="font-mono font-semibold text-blue-400 text-sm">
                                                        {trade.position_size ? `$${trade.position_size.position_value?.toLocaleString()}` : '---'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Position Details & Risk */}
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {trade.position_size && (
                                                    <>
                                                        <div className="p-2 rounded-lg bg-muted/30">
                                                            <div className="text-[10px] text-muted-foreground">Margin Used</div>
                                                            <div className="font-mono text-xs text-foreground">${trade.position_size.margin_required?.toLocaleString()}</div>
                                                        </div>
                                                        <div className="p-2 rounded-lg bg-muted/30">
                                                            <div className="text-[10px] text-muted-foreground">Size</div>
                                                            <div className="font-mono text-xs text-foreground">{trade.position_size.size_coins?.toFixed(4)} coins</div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Stop Loss Warning */}
                                            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                                <span className="text-gray-500">Stop: ${trade.stop_loss?.toLocaleString()}</span>
                                                <span className="text-red-400">Max 1% Risk</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
