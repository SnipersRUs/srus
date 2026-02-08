import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const TREASURY_ADDRESS = '0x9c23d0f34606204202a9b88b2cd8dbba24192ae5'

// Store paid Discord users (in production, use Redis/DB)
// Map: discordUsername -> {wallet, plan, expiresAt}
const paidDiscordUsers = new Map<string, {
  wallet: string
  plan: string
  planId: string
  timestamp: number
  expiresAt: number
  txHash: string
}>()

// Also store by wallet for lookups
const walletToDiscord = new Map<string, string>()

// ERC20 Transfer event signature
const TRANSFER_EVENT = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, txHash, discordUsername } = await request.json()

    if (!walletAddress || !txHash) {
      return NextResponse.json(
        { error: 'Missing wallet address or transaction hash' },
        { status: 400 }
      )
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      )
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org'),
    })

    // Verify transaction exists and is successful
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    })

    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json(
        { error: 'Transaction not found or failed' },
        { status: 400 }
      )
    }

    // Verify transaction was to treasury
    if (receipt.to?.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
      return NextResponse.json(
        { error: 'Transaction not to treasury address' },
        { status: 400 }
      )
    }

    // Check if this transaction has already been used
    for (const [username, data] of paidDiscordUsers) {
      if (data.txHash === txHash) {
        return NextResponse.json(
          { error: 'Transaction already used for verification' },
          { status: 400 }
        )
      }
    }

    // Determine plan based on amount
    // USDC has 6 decimals, so:
    // $3 = 3000000, $15 = 15000000, $50 = 50000000, $300 = 300000000
    let plan = 'Daily Pass'
    let planId = 'daily'
    let durationHours = 24

    // Get transfer amount from logs
    const transferLog = receipt.logs.find((log: any) => 
      log.topics[0] === TRANSFER_EVENT &&
      log.address.toLowerCase() === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'.toLowerCase() // USDC on Base
    )

    if (transferLog) {
      const amount = parseInt(transferLog.data, 16)
      if (amount >= 300000000) { // $300
        plan = 'Lifetime Pass'
        planId = 'lifetime'
        durationHours = 876000 // 100 years
      } else if (amount >= 50000000) { // $50
        plan = 'Monthly Pass'
        planId = 'monthly'
        durationHours = 720 // 30 days
      } else if (amount >= 15000000) { // $15
        plan = 'Weekly Pass'
        planId = 'weekly'
        durationHours = 168 // 7 days
      } else {
        plan = 'Daily Pass'
        planId = 'daily'
        durationHours = 24
      }
    }

    const timestamp = Date.now()
    const expiresAt = timestamp + (durationHours * 60 * 60 * 1000)

    // Store by Discord username if provided
    if (discordUsername) {
      const normalizedUsername = discordUsername.toLowerCase().trim()
      paidDiscordUsers.set(normalizedUsername, {
        wallet: walletAddress.toLowerCase(),
        plan,
        planId,
        timestamp,
        expiresAt,
        txHash,
      })
      walletToDiscord.set(walletAddress.toLowerCase(), normalizedUsername)
    }

    // Store by wallet (for backward compatibility)
    walletToDiscord.set(walletAddress.toLowerCase(), discordUsername?.toLowerCase().trim() || '')

    return NextResponse.json({
      success: true,
      verified: true,
      plan,
      planId,
      durationHours,
      expiresAt,
      discordUsername: discordUsername || null,
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

// Check if wallet has verified payment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    const discordUsername = searchParams.get('discord')

    // Check by Discord username
    if (discordUsername) {
      const normalizedUsername = discordUsername.toLowerCase().trim()
      const userData = paidDiscordUsers.get(normalizedUsername)
      
      if (userData) {
        const now = Date.now()
        if (userData.expiresAt > now) {
          return NextResponse.json({
            verified: true,
            plan: userData.plan,
            planId: userData.planId,
            expiresAt: userData.expiresAt,
            wallet: userData.wallet,
            discordInviteUrl: process.env.DISCORD_INVITE_URL || 'https://discord.gg/8v3zw8829K',
          })
        } else {
          // Expired - remove from map
          paidDiscordUsers.delete(normalizedUsername)
        }
      }
      
      return NextResponse.json({
        verified: false,
        discordInviteUrl: null,
      })
    }

    // Check by wallet (backward compatibility)
    if (walletAddress) {
      const discordUser = walletToDiscord.get(walletAddress.toLowerCase())
      if (discordUser) {
        const userData = paidDiscordUsers.get(discordUser)
        if (userData && userData.expiresAt > Date.now()) {
          return NextResponse.json({
            verified: true,
            plan: userData.plan,
            planId: userData.planId,
            expiresAt: userData.expiresAt,
            discordUsername: discordUser,
            discordInviteUrl: process.env.DISCORD_INVITE_URL || 'https://discord.gg/8v3zw8829K',
          })
        }
      }
      
      return NextResponse.json({
        verified: false,
        discordInviteUrl: null,
      })
    }

    // Return all paid users (for bot to sync)
    const allPaidUsers: Record<string, any> = {}
    const now = Date.now()
    
    for (const [username, data] of paidDiscordUsers) {
      if (data.expiresAt > now) {
        allPaidUsers[username] = {
          plan: data.plan,
          planId: data.planId,
          expiresAt: data.expiresAt,
          wallet: data.wallet,
        }
      } else {
        paidDiscordUsers.delete(username)
      }
    }

    return NextResponse.json({
      paidUsers: allPaidUsers,
      count: Object.keys(allPaidUsers).length,
    })

  } catch (error) {
    console.error('Check verification error:', error)
    return NextResponse.json(
      { error: 'Check failed' },
      { status: 500 }
    )
  }
}
