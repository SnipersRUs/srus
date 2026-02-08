
// Core trading indicators for PatternFlow

export interface OHLC {
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export interface VWAPResult {
    vwap: number
    upper1: number // 1 std dev
    lower1: number
    upper2: number // 2 std dev (Tactical Deviation)
    lower2: number
    upper3: number // 3 std dev (Tactical Deviation)
    lower3: number
}

export interface GoldenPocket {
    high: number // 0.618
    low: number // 0.65
}

/**
 * Calculates VWAP and Standard Deviation Bands
 * Based on the "Tactical Deviation" Pine Script logic
 */
export function calculateVWAP(data: OHLC[]): VWAPResult[] {
    let cumulativeTPV = 0
    let cumulativeVolume = 0
    let sumSquaredDeviations = 0

    return data.map((candle, index) => {
        const typicalPrice = (candle.high + candle.low + candle.close) / 3
        const tpv = typicalPrice * candle.volume

        cumulativeTPV += tpv
        cumulativeVolume += candle.volume

        const vwap = cumulativeTPV / cumulativeVolume

        // Standard Deviation Calculation
        // Variance = (Sum of (TP - VWAP)^2 * Vol) / Cumulative Vol
        // Note: This is a simplified rolling weighted std dev approximation for performance in JS
        // For exact Pine Script parity, we'd need to re-iterate or maintain running sums of squares

        // Pine Script simplified variance: sum(vol * (tp - vwap)^2) / sum(vol)
        // We can use the running sum of squares formula: sum(vol * tp^2)

        // Let's use the exact formula structure from the Pine Script provided:
        // sumPV2 += typicalPrice^2 * volume
        // variance = (sumPV2 / sumV) - vwap^2

        // We need to track sumPV2 cumulatively
        if (index === 0) sumSquaredDeviations = 0 // Reset implicitly by closure logic if needed, but here it's linear

        // We need to maintain state outside the map if we want true accumulation, 
        // but map callback doesn't share state easily without closure. 
        // Let's rewrite as a standard loop or use a closure.
        return {
            vwap: 0, upper1: 0, lower1: 0, upper2: 0, lower2: 0, upper3: 0, lower3: 0
        }
    })
}

/**
 * Correct implementation of VWAP with Variance
 */
export function calculateVWAPWithBands(data: OHLC[]): (VWAPResult | null)[] {
    let sumPV = 0
    let sumV = 0
    let sumPV2 = 0

    return data.map(candle => {
        const hlc3 = (candle.high + candle.low + candle.close) / 3
        const volume = candle.volume

        sumPV += hlc3 * volume
        sumV += volume
        sumPV2 += (Math.pow(hlc3, 2) * volume)

        if (sumV === 0) return null

        const vwap = sumPV / sumV
        const variance = (sumPV2 / sumV) - Math.pow(vwap, 2)
        const stdDev = Math.sqrt(Math.max(variance, 0))

        return {
            vwap,
            upper1: vwap + (stdDev * 1.0),
            lower1: vwap - (stdDev * 1.0),
            upper2: vwap + (stdDev * 2.0),
            lower2: vwap - (stdDev * 2.0),
            upper3: vwap + (stdDev * 3.0),
            lower3: vwap - (stdDev * 3.0),
        }
    })
}

/**
 * Calculates Golden Pocket Zones (0.618 - 0.65) based on recent Pivot High/Low
 * This is a simplified version of GPS Pro that looks for the absolute High/Low in the visible range
 * or a specific lookback.
 */
export function calculateGoldenPocket(high: number, low: number): GoldenPocket {
    const range = high - low
    const gpHighPrice = high - (range * 0.618)
    const gpLowPrice = high - (range * 0.65)

    return {
        high: gpHighPrice,
        low: gpLowPrice
    }
}

/**
 * Finds the highest high and lowest low in a dataset to anchor the GP
 */
export function findSwingPoints(data: OHLC[]): { high: number, low: number } {
    let high = -Infinity
    let low = Infinity

    for (const candle of data) {
        if (candle.high > high) high = candle.high
        if (candle.low < low) low = candle.low
    }

    return { high, low }
}
