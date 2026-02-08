'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export interface Trade {
  id: string
  symbol: string
  entry_price: number
  stop_loss: number
  take_profit: number
  entry_time: string
  side: 'LONG' | 'SHORT'
  reasons?: string[]
  status?: 'active' | 'triggered' | 'closed' | 'expired'
  source: 'shortHunter' | 'bountySeeker'
}

export interface SignalData {
  shortHunter: {
    status: string
    active_trades: Record<string, any>
    lastUpdated?: string
  }
  bountySeeker: {
    status: string
    open_trades?: any[]
    signals?: any[]
    market_analysis?: any[]
    lastUpdated?: string
  }
  lastUpdated: string
}

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  signals: SignalData | null
  allTrades: Trade[]
  prices: Record<string, number>
  lastUpdate: string | null
  error: string | null
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  signals: null,
  allTrades: [],
  prices: {},
  lastUpdate: null,
  error: null
})

export function useWebSocket() {
  return useContext(WebSocketContext)
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [signals, setSignals] = useState<SignalData | null>(null)
  const [allTrades, setAllTrades] = useState<Trade[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const processedTrades = useRef<Set<string>>(new Set())

  // Transform raw signal data to unified trade format
  const transformSignalsToTrades = useCallback((data: SignalData): Trade[] => {
    const trades: Trade[] = []

    if (!data) return trades

    // Process Short Hunter signals
    if (data.shortHunter?.active_trades && typeof data.shortHunter.active_trades === 'object') {
      const activeTrades = data.shortHunter.active_trades
      if (activeTrades && Object.keys(activeTrades).length > 0) {
        Object.entries(activeTrades).forEach(([key, signal]: [string, any]) => {
          if (!signal || !signal.entry_price) return

          const symbol = (signal.symbol || key || 'UNKNOWN').replace('USDT', '')
          const tradeId = `sh-${symbol}-${signal.signal_time || Date.now()}`

          if (!processedTrades.current.has(tradeId)) {
            processedTrades.current.add(tradeId)

            trades.push({
              id: tradeId,
              symbol: symbol + '/USDT',
              entry_price: signal.entry_price,
              stop_loss: signal.stop_loss,
              take_profit: signal.take_profit,
              entry_time: signal.signal_time || new Date().toISOString(),
              side: 'SHORT',
              reasons: signal.reasons || [],
              status: signal.status?.toLowerCase() || 'active',
              source: 'shortHunter'
            })
          }
        })
      }
    }

    // Process Short Hunter scan signals (if no active trades)
    if (data.shortHunter?.signals && Array.isArray(data.shortHunter.signals) && data.shortHunter.signals.length > 0) {
      data.shortHunter.signals.forEach((signal: any, index: number) => {
        if (!signal || !signal.entry_price) return

        const symbol = (signal.symbol || 'UNKNOWN').replace('USDT', '')
        const tradeId = `sh-scan-${symbol}-${signal.timestamp || Date.now()}-${index}`

        if (!processedTrades.current.has(tradeId)) {
          processedTrades.current.add(tradeId)

          trades.push({
            id: tradeId,
            symbol: symbol + '/USDT',
            entry_price: signal.entry_price,
            stop_loss: signal.stop_loss,
            take_profit: signal.take_profit,
            entry_time: signal.timestamp || new Date().toISOString(),
            side: 'SHORT',
            reasons: signal.reasons || [],
            status: 'scanning',
            source: 'shortHunter'
          })
        }
      })
    }

    // Process Bounty Seeker signals
    const bountyData = data.bountySeeker
    const rawSeeker = bountyData?.open_trades || bountyData?.signals || []

    if (Array.isArray(rawSeeker) && rawSeeker.length > 0) {
      rawSeeker.forEach((signal: any, index: number) => {
        if (!signal || !signal.entry_price) return

        const symbol = (signal.symbol || 'UNKNOWN/USDT').split('/')[0] + '/USDT'
        const tradeId = `bs-${symbol}-${signal.entry_time || signal.timestamp || Date.now()}-${index}`

        if (!processedTrades.current.has(tradeId)) {
          processedTrades.current.add(tradeId)

          trades.push({
            id: tradeId,
            symbol: symbol,
            entry_price: signal.entry_price,
            stop_loss: signal.stop_loss,
            take_profit: signal.take_profit || signal.take_profit_1,
            entry_time: signal.entry_time || signal.timestamp || new Date().toISOString(),
            side: (signal.direction || signal.side || 'LONG').toUpperCase() as 'LONG' | 'SHORT',
            reasons: signal.reasons || [],
            status: signal.status?.toLowerCase() || 'active',
            source: 'bountySeeker'
          })
        }
      })
    }

    return trades
  }, [])

  // Fetch current prices
  const fetchPrices = useCallback(async () => {
    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT']
      const newPrices: Record<string, number> = {}

      for (const symbol of symbols) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)

          const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            if (data?.price) {
              newPrices[symbol.replace('USDT', '')] = parseFloat(data.price)
            }
          }
        } catch (e) {
          // Skip failed fetches silently
        }
      }

      if (Object.keys(newPrices).length > 0) {
        setPrices(prev => ({ ...prev, ...newPrices }))
      }
    } catch (error) {
      console.log('Price fetch error')
    }
  }, [])

  // WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })

    newSocket.on('connect', () => {
      console.log('✅ WebSocket Provider connected')
      setIsConnected(true)
      setError(null)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket Provider disconnected')
      setIsConnected(false)
    })

    newSocket.on('state-update', (data: SignalData) => {
      console.log('📡 WebSocket Provider received data:', data)

      if (!data || typeof data !== 'object') {
        console.error('Invalid data received')
        return
      }

      setSignals(data)
      setLastUpdate(new Date().toISOString())

      // Transform to trades
      const trades = transformSignalsToTrades(data)
      if (trades.length > 0) {
        setAllTrades(prev => {
          // Merge new trades with existing, avoiding duplicates
          const existingIds = new Set(prev.map(t => t.id))
          const newTrades = trades.filter(t => !existingIds.has(t.id))
          return [...newTrades, ...prev]
        })
      }
    })

    newSocket.on('connect_error', (err) => {
      console.error('❌ WebSocket connection error:', err.message)
      console.error('Error details:', err)
      setError(`Connection failed: ${err.message}`)
    })

    newSocket.on('error', (err) => {
      console.error('❌ WebSocket error:', err)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [transformSignalsToTrades])

  // Fetch prices periodically
  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  const value: WebSocketContextType = {
    socket,
    isConnected,
    signals,
    allTrades,
    prices,
    lastUpdate,
    error
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
