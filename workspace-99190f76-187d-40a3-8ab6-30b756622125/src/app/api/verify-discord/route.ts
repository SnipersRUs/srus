import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const TREASURY_ADDRESS = '0x9c23d0f34606204202a9b88b2cd8dbba24192ae5'

// In-memory store for verified payments (in production, use Redis/DB)
const verifiedPayments = new Map<string, {
  plan: string
  timestamp: number
  expiresAt: number
  wallet: string
}[]>()

// ERC20 Transfer event signature
const TRANSFER_EVENT = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, txHash } = await request.json()

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
    const existingPayments = verifiedPayments.get(walletAddress.toLowerCase()) || []
    const alreadyUsed = existingPayments.some(p => p.timestamp === Number(receipt.blockNumber))
    
    if (alreadyUsed) {
      return NextResponse.json(
        { error: 'Transaction already used for verification' },
        { status: 400 }
      )
    }

    // Determine plan based on amount (simplified - in production, decode the transfer amount)
    // For now, we'll accept any successful transfer to treasury
    const plan = 'verified'
    const timestamp = Date.now()
    const expiresAt = timestamp + (24 * 60 * 60 * 1000) // 24 hours default

    // Store verification
    const paymentRecord = {
      plan,
      timestamp,
      expiresAt,
      wallet: walletAddress.toLowerCase(),
    }

    existingPayments.push(paymentRecord)
    verifiedPayments.set(walletAddress.toLowerCase(), existingPayments)

    return NextResponse.json({
      success: true,
      verified: true,
      plan,
      expiresAt,
      discordInviteUrl: process.env.DISCORD_INVITE_URL || 'https://discord.gg/2AsntmM93d',
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

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing wallet address' },
        { status: 400 }
      )
    }

    const payments = verifiedPayments.get(walletAddress.toLowerCase()) || []
    const now = Date.now()
    
    // Filter out expired payments
    const validPayments = payments.filter(p => p.expiresAt > now)
    
    // Update stored payments
    if (validPayments.length !== payments.length) {
      verifiedPayments.set(walletAddress.toLowerCase(), validPayments)
    }

    const hasValidPayment = validPayments.length > 0

    return NextResponse.json({
      verified: hasValidPayment,
      payments: validPayments.map(p => ({
        plan: p.plan,
        expiresAt: p.expiresAt,
      })),
      discordInviteUrl: hasValidPayment 
        ? (process.env.DISCORD_INVITE_URL || 'https://discord.gg/2AsntmM93d')
        : null,
    })

  } catch (error) {
    console.error('Check verification error:', error)
    return NextResponse.json(
      { error: 'Check failed' },
      { status: 500 }
    )
  }
}
