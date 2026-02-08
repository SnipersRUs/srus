import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

// Changed to force-dynamic to work with output: "export"
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'all'

        // Define paths to bot output files (in public/data)
        const publicDataDir = path.join(process.cwd(), 'public', 'data')
        const hunterPath = path.join(publicDataDir, 'active_trades.json')
        const seekerPath = path.join(publicDataDir, 'bounty_seeker_status.json')

        // Read files concurrently
        // We use fs.readFile instead of fetch to read directly from disk on server
        const [hunterData, seekerData] = await Promise.all([
            fs.readFile(hunterPath, 'utf-8').catch(() => null),
            fs.readFile(seekerPath, 'utf-8').catch(() => null)
        ])

        const safeParse = (data: string | null) => {
            if (!data) return null
            try {
                return JSON.parse(data)
            } catch (e) {
                console.error("JSON parse error for data chunk", e)
                return null
            }
        }

        const responseData = {
            shortHunter: safeParse(hunterData),
            bountySeeker: safeParse(seekerData),
            lastUpdated: new Date().toISOString()
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch signals' },
            { status: 500 }
        )
    }
}
