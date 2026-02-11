import { NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Signal data structure
interface TradingViewSignal {
  symbol: string
  side: 'LONG' | 'SHORT'
  entry_price: number
  stop_loss: number
  take_profit: number
  timeframe: string
  reasons: string[]
  score: number
  timestamp: string
  source: 'tradingview'
  indicator?: string
}

const SIGNALS_FILE = path.join(process.cwd(), 'public', 'data', 'realtime_signals.json')

// GET - Retrieve all signals
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const side = searchParams.get('side')
    const minScore = parseInt(searchParams.get('minScore') || '0')

    // Read existing signals
    let signals: TradingViewSignal[] = []
    if (existsSync(SIGNALS_FILE)) {
      const data = await readFile(SIGNALS_FILE, 'utf-8')
      signals = JSON.parse(data)
    }

    // Filter signals
    let filteredSignals = signals
    if (side) {
      filteredSignals = filteredSignals.filter(s => s.side === side)
    }
    if (minScore > 0) {
      filteredSignals = filteredSignals.filter(s => s.score >= minScore)
    }

    // Sort by timestamp (newest first) and limit
    filteredSignals = filteredSignals
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      signals: filteredSignals,
      count: filteredSignals.length,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching signals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    )
  }
}

// POST - Receive TradingView webhook
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.symbol || !body.side || !body.entry_price) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, side, entry_price' },
        { status: 400 }
      )
    }

    // Create signal object
    const signal: TradingViewSignal = {
      symbol: body.symbol.toUpperCase(),
      side: body.side.toUpperCase() as 'LONG' | 'SHORT',
      entry_price: parseFloat(body.entry_price),
      stop_loss: parseFloat(body.stop_loss) || calculateStopLoss(body.entry_price, body.side),
      take_profit: parseFloat(body.take_profit) || calculateTakeProfit(body.entry_price, body.side),
      timeframe: body.timeframe || '15m',
      reasons: body.reasons || body.message?.split(',') || ['TradingView Alert'],
      score: parseInt(body.score) || 70,
      timestamp: new Date().toISOString(),
      source: 'tradingview',
      indicator: body.indicator || 'GPS Pro'
    }

    // Read existing signals
    let signals: TradingViewSignal[] = []
    if (existsSync(SIGNALS_FILE)) {
      const data = await readFile(SIGNALS_FILE, 'utf-8')
      signals = JSON.parse(data)
    }

    // Add new signal
    signals.push(signal)

    // Keep only last 1000 signals
    if (signals.length > 1000) {
      signals = signals.slice(-1000)
    }

    // Save to file
    await writeFile(SIGNALS_FILE, JSON.stringify(signals, null, 2))

    // Broadcast to WebSocket clients (if signal server is running)
    try {
      await broadcastToSignalServer(signal)
    } catch (wsError) {
      console.log('WebSocket broadcast failed (signal server may not be running):', wsError)
    }

    return NextResponse.json({
      success: true,
      signal,
      message: 'Signal received and broadcasted'
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process signal' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateStopLoss(entryPrice: number, side: string): number {
  const slPercent = side.toUpperCase() === 'LONG' ? 0.02 : 0.02
  return side.toUpperCase() === 'LONG' 
    ? entryPrice * (1 - slPercent)
    : entryPrice * (1 + slPercent)
}

function calculateTakeProfit(entryPrice: number, side: string): number {
  const tpPercent = side.toUpperCase() === 'LONG' ? 0.04 : 0.04
  return side.toUpperCase() === 'LONG'
    ? entryPrice * (1 + tpPercent)
    : entryPrice * (1 - tpPercent)
}

async function broadcastToSignalServer(signal: TradingViewSignal) {
  // Try to broadcast to local signal server
  const SIGNAL_SERVER_URL = process.env.SIGNAL_SERVER_URL || 'http://localhost:3001'
  
  const response = await fetch(`${SIGNAL_SERVER_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'tradingview',
      data: {
        symbol: signal.symbol,
        side: signal.side,
        entry_price: signal.entry_price,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        reasons: signal.reasons,
        score: signal.score,
        timestamp: signal.timestamp
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Signal server responded with ${response.status}`)
  }
}
