'use client'

import { useEffect, useRef } from 'react'
import { calculateVWAPWithBands, findSwingPoints, calculateGoldenPocket, OHLC } from '@/lib/indicators'

interface TradingChartProps {
  symbol?: string
  height?: number
}

export function TradingChart({ symbol = 'BTC/USDC', height = 400 }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    let chart: any = null

    const initChart = async () => {
      try {
        const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts')

        if (!chartContainerRef.current) return

        if (chartContainerRef.current.clientWidth === 0) {
          // Container not visible yet, wait a tick
          await new Promise(r => setTimeout(r, 100))
          if (!chartContainerRef.current) return
        }

        // Create chart
        chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#6b7280',
          },
          grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
          },
          width: chartContainerRef.current.clientWidth,
          height: height,
          timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            }
          },
          crosshair: {
            mode: CrosshairMode.Normal,
          },
        })

        chartRef.current = chart

        if (!chart) {
          console.error('Chart initialization failed')
          return
        }

        // ==========================
        // 1. Candlestick Series
        // ==========================
        const candleSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444'
        })

        const rawData = await fetchRealData(symbol)

        if (rawData.length === 0) {
          // Fallback if API fails, just empty
          console.warn("No data fetched")
          return
        }

        candleSeries.setData(rawData)

        // ==========================
        // 2. VWAP & Deviation Bands (Tactical Deviation)
        // ==========================
        const vwapData = calculateVWAPWithBands(rawData)

        // VWAP Line (Daily - Green/Sniper Green)
        const vwapSeries = chart.addLineSeries({
          color: '#00E676', // Sniper Green
          lineWidth: 2,
          title: 'VWAP',
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false
        })
        vwapSeries.setData(vwapData.map((d, i) => d ? { time: rawData[i].time, value: d.vwap } : null).filter(Boolean))

        // Upper 2 StDev (Tactical Deviation Zone 2)
        const upper2Series = chart.addLineSeries({
          color: 'rgba(0, 230, 118, 0.3)',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          title: '+2σ'
        })
        upper2Series.setData(vwapData.map((d, i) => d ? { time: rawData[i].time, value: d.upper2 } : null).filter(Boolean))

        // Lower 2 StDev
        const lower2Series = chart.addLineSeries({
          color: 'rgba(0, 230, 118, 0.3)',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          title: '-2σ'
        })
        lower2Series.setData(vwapData.map((d, i) => d ? { time: rawData[i].time, value: d.lower2 } : null).filter(Boolean))

        // Upper 3 StDev (Extreme)
        const upper3Series = chart.addLineSeries({
          color: 'rgba(255, 23, 68, 0.5)', // Red/Danger
          lineWidth: 1,
          title: '+3σ'
        })
        upper3Series.setData(vwapData.map((d, i) => d ? { time: rawData[i].time, value: d.upper3 } : null).filter(Boolean))

        // Lower 3 StDev (Extreme)
        const lower3Series = chart.addLineSeries({
          color: 'rgba(255, 23, 68, 0.5)', // Red/Danger
          lineWidth: 1,
          title: '-3σ'
        })
        lower3Series.setData(vwapData.map((d, i) => d ? { time: rawData[i].time, value: d.lower3 } : null).filter(Boolean))


        // ==========================
        // 3. Golden Pocket Zones (GPS Pro)
        // ==========================
        const { high, low } = findSwingPoints(rawData)
        const gp = calculateGoldenPocket(high, low)

        // For visual clarity, let's use PriceLines on the CandleSeries
        candleSeries.createPriceLine({
          price: gp.high,
          color: '#FFA500', // Gold/Orange
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'GP High (0.618)',
        })

        candleSeries.createPriceLine({
          price: gp.low,
          color: '#FFA500', // Gold/Orange
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'GP Low (0.65)',
        })


        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chart) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
            })
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (chart) {
            chart.remove()
          }
        }

      } catch (err) {
        console.error('Failed to load chart library:', err)
      }
    }

    const cleanupPromise = initChart()

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup())
    }
  }, [height])

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border/50 bg-card/50">
      <div ref={chartContainerRef} style={{ height: `${height}px` }} />
    </div>
  )
}

// Helper to fetch real market data
async function fetchRealData(symbolPair: string): Promise<OHLC[]> {
  const baseAsset = symbolPair.split('/')[0] || 'BTC'

  try {
    const res = await fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${baseAsset}&tsym=USD&limit=200`)
    const json = await res.json()

    if (json.Response === 'Success' && json.Data && json.Data.Data) {
      return json.Data.Data.map((d: any) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volumefrom
      }))
    }
  } catch (e) {
    console.error("Failed to fetch chart data", e)
  }
  return []
}
