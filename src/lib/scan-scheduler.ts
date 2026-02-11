// Server-side scan scheduler - runs independently of user sessions
// This ensures all users see the same scan times globally

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
    // Fixed schedule: scans every 45 minutes (00, 45, 30, 15 pattern)
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

// Global scan status that persists across all users
let globalScanStatus = {
  shortHunter: {
    lastScan: SCAN_SCHEDULE.shortHunter.getLastScan(),
    nextScan: SCAN_SCHEDULE.shortHunter.getNextScan(),
    isScanning: false
  },
  bountySeeker: {
    lastScan: SCAN_SCHEDULE.bountySeeker.getLastScan(),
    nextScan: SCAN_SCHEDULE.bountySeeker.getNextScan(),
    isScanning: false
  },
  sniperGuru: {
    lastScan: SCAN_SCHEDULE.sniperGuru.getLastScan(),
    nextScan: SCAN_SCHEDULE.sniperGuru.getNextScan(),
    isScanning: false
  }
}

// Update scan status every second
setInterval(() => {
  const now = new Date()
  
  // Check each bot
  Object.keys(SCAN_SCHEDULE).forEach(botKey => {
    const bot = botKey as keyof typeof SCAN_SCHEDULE
    const schedule = SCAN_SCHEDULE[bot]
    
    // If we've passed the next scan time, update it
    if (now >= globalScanStatus[bot].nextScan) {
      globalScanStatus[bot].lastScan = globalScanStatus[bot].nextScan
      globalScanStatus[bot].nextScan = schedule.getNextScan()
      globalScanStatus[bot].isScanning = false
    }
    
    // Check if we should be scanning (within 30 seconds of scan time)
    const timeToNextScan = globalScanStatus[bot].nextScan.getTime() - now.getTime()
    if (timeToNextScan <= 30000 && timeToNextScan > 0) {
      globalScanStatus[bot].isScanning = true
    }
  })
}, 1000)

export function getGlobalScanStatus() {
  return {
    shortHunter: { ...globalScanStatus.shortHunter },
    bountySeeker: { ...globalScanStatus.bountySeeker },
    sniperGuru: { ...globalScanStatus.sniperGuru },
    serverTime: new Date().toISOString()
  }
}

export function getTimeUntilNextScan(bot: keyof typeof SCAN_SCHEDULE): number {
  const now = new Date()
  const nextScan = globalScanStatus[bot].nextScan
  return Math.max(0, nextScan.getTime() - now.getTime())
}

export { SCAN_SCHEDULE }
