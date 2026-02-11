// Server-side scan scheduler - calculates scan times on-demand
// This ensures all users see the same scan times globally
// Works in serverless environments (no setInterval needed)

const SCAN_SCHEDULE = {
  shortHunter: {
    intervalMinutes: 15,
    // Fixed schedule: scans at :00, :15, :30, :45 of every hour
    getNextScan: () => {
      const now = new Date()
      const currentMinute = now.getMinutes()
      const nextQuarter = Math.ceil(currentMinute / 15) * 15
      const nextScan = new Date(now)
      nextScan.setMinutes(nextQuarter)
      nextScan.setSeconds(0)
      nextScan.setMilliseconds(0)
      if (nextQuarter === 60) {
        nextScan.setHours(nextScan.getHours() + 1)
        nextScan.setMinutes(0)
      }
      return nextScan
    },
    getLastScan: () => {
      const next = SCAN_SCHEDULE.shortHunter.getNextScan()
      return new Date(next.getTime() - 15 * 60 * 1000)
    }
  },
  bountySeeker: {
    intervalMinutes: 60,
    // Fixed schedule: scans at the top of every hour
    getNextScan: () => {
      const now = new Date()
      const nextScan = new Date(now)
      nextScan.setHours(nextScan.getHours() + 1)
      nextScan.setMinutes(0)
      nextScan.setSeconds(0)
      nextScan.setMilliseconds(0)
      return nextScan
    },
    getLastScan: () => {
      const next = SCAN_SCHEDULE.bountySeeker.getNextScan()
      return new Date(next.getTime() - 60 * 60 * 1000)
    }
  },
  sniperGuru: {
    intervalMinutes: 45,
    // Fixed schedule: scans every 45 minutes
    getNextScan: () => {
      const now = new Date()
      const currentMinute = now.getMinutes()
      const currentHour = now.getHours()
      
      // 45-minute intervals: 0, 45, 30, 15, 0, 45...
      const intervals = [0, 15, 30, 45]
      const currentTotalMinutes = currentHour * 60 + currentMinute
      const nextIntervalIndex = intervals.findIndex(m => m > currentMinute % 60)
      
      let nextScan = new Date(now)
      if (nextIntervalIndex === -1) {
        // Move to next hour
        nextScan.setHours(nextScan.getHours() + 1)
        nextScan.setMinutes(0)
      } else {
        nextScan.setMinutes(intervals[nextIntervalIndex])
      }
      nextScan.setSeconds(0)
      nextScan.setMilliseconds(0)
      return nextScan
    },
    getLastScan: () => {
      const next = SCAN_SCHEDULE.sniperGuru.getNextScan()
      return new Date(next.getTime() - 45 * 60 * 1000)
    }
  }
}

export function getGlobalScanStatus() {
  const now = new Date()
  
  // Calculate scan status on-demand (no state persistence needed)
  const shortHunterNext = SCAN_SCHEDULE.shortHunter.getNextScan()
  const bountySeekerNext = SCAN_SCHEDULE.bountySeeker.getNextScan()
  const sniperGuruNext = SCAN_SCHEDULE.sniperGuru.getNextScan()
  
  // Check if currently scanning (within 30 seconds of scan time)
  const isScanningShort = shortHunterNext.getTime() - now.getTime() <= 30000 && shortHunterNext.getTime() - now.getTime() > 0
  const isScanningBounty = bountySeekerNext.getTime() - now.getTime() <= 30000 && bountySeekerNext.getTime() - now.getTime() > 0
  const isScanningSniper = sniperGuruNext.getTime() - now.getTime() <= 30000 && sniperGuruNext.getTime() - now.getTime() > 0
  
  return {
    shortHunter: {
      lastScan: SCAN_SCHEDULE.shortHunter.getLastScan().toISOString(),
      nextScan: shortHunterNext.toISOString(),
      isScanning: isScanningShort
    },
    bountySeeker: {
      lastScan: SCAN_SCHEDULE.bountySeeker.getLastScan().toISOString(),
      nextScan: bountySeekerNext.toISOString(),
      isScanning: isScanningBounty
    },
    sniperGuru: {
      lastScan: SCAN_SCHEDULE.sniperGuru.getLastScan().toISOString(),
      nextScan: sniperGuruNext.toISOString(),
      isScanning: isScanningSniper
    },
    serverTime: now.toISOString()
  }
}

export function getTimeUntilNextScan(bot: keyof typeof SCAN_SCHEDULE): number {
  const now = new Date()
  const nextScan = SCAN_SCHEDULE[bot].getNextScan()
  return Math.max(0, nextScan.getTime() - now.getTime())
}

export { SCAN_SCHEDULE }
