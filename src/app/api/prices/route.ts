import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cache prices for 1 second to reduce API load
let cachedPrices: Record<string, number> = {}
let lastCacheTime = 0
const CACHE_TTL = 1000 // 1 second

// Binance US is more reliable for US users
const BINANCE_API = 'https://api.binance.us/api/v3/ticker/price'
const BINANCE_GLOBAL_API = 'https://api.binance.com/api/v3/ticker/price'

export async function GET(request: Request) {
    try {
        const now = Date.now()
        
        // Return cached prices if fresh
        if (now - lastCacheTime < CACHE_TTL && Object.keys(cachedPrices).length > 0) {
            return NextResponse.json(cachedPrices, {
                headers: {
                    'X-Cache': 'HIT',
                    'X-Cache-Age': String(now - lastCacheTime)
                }
            })
        }

        const { searchParams } = new URL(request.url)
        const symbolsParam = searchParams.get('symbols')

        // Default list of popular coins
        const defaultSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT', 'MATIC', 'MANA', 'SAND']
        let requestedSymbols = defaultSymbols

        if (symbolsParam) {
            requestedSymbols = symbolsParam.split(',').map(s => s.replace('USDT', '').trim())
        }

        // Try Binance US first (better for US users)
        let allPrices: any[] = []
        let usingGlobal = false
        
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000)
            
            const response = await fetch(BINANCE_API, { 
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            })
            clearTimeout(timeoutId)
            
            if (!response.ok) throw new Error('US API failed')
            allPrices = await response.json()
        } catch (usError) {
            // Fallback to Binance Global
            try {
                usingGlobal = true
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 3000)
                
                const response = await fetch(BINANCE_GLOBAL_API, { 
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                })
                clearTimeout(timeoutId)
                
                if (!response.ok) throw new Error('Global API failed')
                allPrices = await response.json()
            } catch (globalError) {
                // Return cached prices if available, even if stale
                if (Object.keys(cachedPrices).length > 0) {
                    return NextResponse.json(cachedPrices, {
                        headers: { 'X-Cache': 'STALE' }
                    })
                }
                return NextResponse.json({ error: 'Price fetch failed' }, { status: 503 })
            }
        }

        // Build price map
        const usdtPrices: Record<string, number> = {}
        
        if (Array.isArray(allPrices)) {
            allPrices.forEach((ticker: any) => {
                if (ticker?.symbol?.endsWith('USDT')) {
                    const cleanSymbol = ticker.symbol.replace('USDT', '')
                    const price = parseFloat(ticker.price)
                    if (!isNaN(price) && price > 0) {
                        usdtPrices[cleanSymbol] = price
                    }
                }
            })
        }

        // Try OKX for additional coins not on Binance
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 2000)
            
            const okxResponse = await fetch(
                'https://www.okx.com/api/v5/market/tickers?instType=SWAP',
                { signal: controller.signal }
            )
            clearTimeout(timeoutId)
            
            if (okxResponse.ok) {
                const okxData = await okxResponse.json()
                if (okxData?.data && Array.isArray(okxData.data)) {
                    okxData.data.forEach((ticker: any) => {
                        if (ticker?.instId?.includes('-USDT')) {
                            const symbol = ticker.instId.split('-')[0]
                            // Only add if not already present from Binance
                            if (!usdtPrices[symbol] && ticker.last) {
                                const price = parseFloat(ticker.last)
                                if (!isNaN(price) && price > 0) {
                                    usdtPrices[symbol] = price
                                }
                            }
                        }
                    })
                }
            }
        } catch {
            // OKX is optional, ignore errors
        }

        // Update cache
        cachedPrices = usdtPrices
        lastCacheTime = now

        return NextResponse.json(usdtPrices, {
            headers: {
                'X-Cache': 'MISS',
                'X-Source': usingGlobal ? 'binance-global' : 'binance-us'
            }
        })

    } catch (error) {
        console.error('Price fetch error:', error)
        
        // Return cached prices if available
        if (Object.keys(cachedPrices).length > 0) {
            return NextResponse.json(cachedPrices, {
                headers: { 'X-Cache': 'STALE-ERROR' }
            })
        }
        
        return NextResponse.json(
            { error: 'Failed to fetch prices' },
            { status: 500 }
        )
    }
}
