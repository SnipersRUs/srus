import { NextResponse } from 'next/server'
import { getGlobalScanStatus } from '@/lib/scan-scheduler'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const scanStatus = getGlobalScanStatus()
    
    return NextResponse.json({
      ...scanStatus,
      message: 'Global scan schedule - same for all users worldwide'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get scan status' },
      { status: 500 }
    )
  }
}
