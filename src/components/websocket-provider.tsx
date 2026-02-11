'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

export interface Trade {
  id: string
  symbol: string
  entry_price: number
  stop_loss: number
  take_profit: number
  entry_time: string
  side: 'LONG' | 'SHORT'
  reasons?: string[]
  status?: 'active' | 'triggered' | 'closed' | 'expired' | 'scanning'
  source: 'shortHunter' | 'bountySeeker' | 'tradingview'
}

interface PriceData {
  price: number
  change24h?: number
  timestamp: number
}

interface WebSocketContextType {
  allTrades: Trade[]
  prices: Record<string, number>
  priceData: Record<string, PriceData>
  isConnected: boolean
  lastUpdate: string | null
  priceHistory: Record<string, number[]> // For sparklines
}

const WebSocketContext = createContext<WebSocketContextType>({
  allTrades: [],
  prices: {},
  priceData: {},
  isConnected: false,
  lastUpdate: null,
  priceHistory: {}
})

// Track last fetch to prevent duplicate requests
let lastFetchTime = 0
const MIN_FETCH_INTERVAL = 2000 // 2 seconds minimum

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [allTrades, setAllTrades] = useState<Trade[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({})
  
  // Use refs to track state without triggering re-renders
  const priceHistoryRef = useRef<Record<string, number[]>>({})
  const pendingFetch = useRef(false)

  // Single source of truth for price fetching
  const fetchPrices = useCallback(async () => {
    // Prevent concurrent fetches
    if (pendingFetch.current) return
    
    const now = Date.now()
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) return
    
    pendingFetch.current = true
    lastFetchTime = now

    try {
      const response = await fetch('/api/prices', {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      })
      
      if (response.ok) {
        const newPrices = await response.json()
        
        if (Object.keys(newPrices).length > 0) {
          const now = Date.now()
          
          setPrices(newPrices)
          setIsConnected(true)
          
          // Update price data with timestamps
          setPriceData(prev => {
            const updated: Record<string, PriceData> = {}
            Object.entries(newPrices).forEach(([symbol, price]) => {
              const numPrice = price as number
              const prevData = prev[symbol]
              updated[symbol] = {
                price: numPrice,
                change24h: prevData?.change24h,
                timestamp: now
              }
            })
            return { ...prev, ...updated }
          })
          
          // Update price history for sparklines (keep last 20 points)
          setPriceHistory(prev => {
            const updated: Record<string, number[]> = {}
            Object.entries(newPrices).forEach(([symbol, price]) => {
              const history = prev[symbol] || []
              updated[symbol] = [...history.slice(-19), price as number]
            })
            priceHistoryRef.current = updated
            return updated
          })
        }
      }
    } catch (error) {
      console.log('Price fetch error:', error)
      // Don't set disconnected immediately - allow retry
    } finally {
      pendingFetch.current = false
    }
  }, [])

  // Fetch signals
  const fetchSignals = useCallback(async () => {
    try {
      // Fetch all signal sources in parallel
      const [shResponse, bsResponse, rtResponse] = await Promise.allSettled([
        fetch('/data/active_trades.json', { cache: 'no-store' }),
        fetch('/data/bounty_seeker_status.json', { cache: 'no-store' }),
        fetch('/data/realtime_signals.json', { cache: 'no-store' })
      ])

      const trades: Trade[] = []

      // Process Short Hunter signals
      if (shResponse.status === 'fulfilled' && shResponse.value.ok) {
        const shData = await shResponse.value.json()
        Object.entries(shData.active_trades || {}).forEach(([key, signal]: [string, any]) => {
          trades.push({
            id: `sh-${key}`,
            symbol: (signal.symbol || key).replace('USDT', '') + '/USDT',
            entry_price: signal.entry_price,
            stop_loss: signal.stop_loss,
            take_profit: signal.take_profit,
            entry_time: signal.signal_time || new Date().toISOString(),
            side: 'SHORT',
            reasons: signal.reasons || [],
            status: 'active',
            source: 'shortHunter'
          })
        })
      }

      // Process Bounty Seeker signals
      if (bsResponse.status === 'fulfilled' && bsResponse.value.ok) {
        const bsData = await bsResponse.value.json()
        ;(bsData.open_trades || []).forEach((signal: any, index: number) => {
          trades.push({
            id: `bs-${signal.symbol}-${index}`,
            symbol: signal.symbol,
            entry_price: signal.entry_price,
            stop_loss: signal.stop_loss,
            take_profit: signal.take_profit,
            entry_time: signal.entry_time || new Date().toISOString(),
            side: (signal.direction || 'LONG').toUpperCase() as 'LONG' | 'SHORT',
            reasons: signal.reasons || [],
            status: 'active',
            source: 'bountySeeker'
          })
        })
      }

      // Process Real-time signals
      if (rtResponse.status === 'fulfilled' && rtResponse.value.ok) {
        const rtData = await rtResponse.value.json()
        // Handle both array format (file) and object format (API)
        const rtSignals = Array.isArray(rtData) ? rtData : (rtData.signals || [])
        rtSignals.forEach((signal: any, index: number) => {
          trades.push({
            id: `tv-${signal.symbol}-${index}`,
            symbol: signal.symbol + '/USDT',
            entry_price: signal.entry_price,
            stop_loss: signal.stop_loss,
            take_profit: signal.take_profit,
            entry_time: signal.timestamp || new Date().toISOString(),
            side: signal.side,
            reasons: signal.reasons || [],
            status: 'active',
            source: 'tradingview'
          })
        })
      }

      setAllTrades(trades)
      setLastUpdate(new Date().toISOString())
    } catch (error) {
      console.log('Signal fetch error:', error)
    }
  }, [])

  // Initial fetch and intervals - optimized
  useEffect(() => {
    // Initial fetch
    fetchPrices()
    fetchSignals()

    // Use a single interval for both to sync updates
    const updateInterval = setInterval(() => {
      fetchPrices()
    }, 3000) // 3 seconds for prices

    const signalInterval = setInterval(() => {
      fetchSignals()
    }, 10000) // 10 seconds for signals (less frequent)

    // Visibility API - pause when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - can reduce frequency or pause
        console.log('Tab hidden - reducing update frequency')
      } else {
        // Tab is visible - fetch immediately
        fetchPrices()
        fetchSignals()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(updateInterval)
      clearInterval(signalInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchPrices, fetchSignals])

  return (
    <WebSocketContext.Provider value={{ 
      allTrades, 
      prices, 
      priceData,
      isConnected, 
      lastUpdate,
      priceHistory
    }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  return useContext(WebSocketContext)
}
