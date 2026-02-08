'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Copy, Zap, Calendar, Star, Gem } from 'lucide-react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (plan: typeof PLANS[0], txHash?: string) => void
    walletAddress: string | null
}

const TREASURY_ADDRESS = '0x9c23d0f34606204202a9b88b2cd8dbba24192ae5' // Snipers-R-Us Treasury

const erc20Abi = [
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const

const PLANS = [
    {
        id: 'daily',
        name: 'Day Pass',
        priceUSDC: 3.00,
        priceZOID: 2.25,  // 25% off
        icon: <Zap className="w-5 h-5 text-purple-500" />,
        desc: '24-Hour Access',
        save: ''
    },
    {
        id: 'weekly',
        name: 'Weekly',
        priceUSDC: 15.00,
        priceZOID: 11.25,  // 25% off
        icon: <Calendar className="w-5 h-5 text-blue-500" />,
        desc: '7-Day Access',
        save: 'SAVE 30%'
    },
    {
        id: 'monthly',
        name: 'Monthly',
        priceUSDC: 50.00,
        priceZOID: 37.50,  // 25% off
        icon: <Star className="w-5 h-5 text-purple-500" />,
        desc: '30-Day Access',
        save: 'SAVE 45%'
    },
    {
        id: 'lifetime',
        name: 'Lifetime',
        priceUSDC: 300.00,
        priceZOID: 225.00,  // 25% off
        icon: <Gem className="w-5 h-5 text-amber-500" />,
        desc: 'Permanent Access',
        save: 'BEST VALUE'
    }
]

const TOKENS = [
    {
        id: 'USDC',
        name: 'USDC',
        icon: '💵',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
        decimals: 6,
        priceUsd: 1.00  // USDC = $1.00
    },
    {
        id: 'ZOID',
        name: '$ZOID',
        icon: '🐙',
        address: '0x5cd3fc996de7eef558ed1e8df5ab261dec361c5a',
        decimals: 18,
        priceUsd: 0.0000001  // ~30M ZOID = $3
    },
    {
        id: 'CLAWNCH',
        name: '$CLAWNCH',
        icon: '🦞',
        address: '0xa1F72459dfA10BAD200Ac160eCd78C6b77a747be',
        decimals: 18,
        priceUsd: 0.00006608  // From DexScreener
    }
]

export function PaymentModal({ isOpen, onClose, onSuccess, walletAddress }: PaymentModalProps) {
    const [selectedPlan, setSelectedPlan] = useState(PLANS[0])
    const [selectedToken, setSelectedToken] = useState(TOKENS[0])
    const [isProcessing, setIsProcessing] = useState(false)
    const [step, setStep] = useState<'plan' | 'payment' | 'processing' | 'success'>('plan')
    const [error, setError] = useState<string | null>(null)
    const { writeContractAsync, data: hash } = useWriteContract()

    const { isLoading: isWaiting, isSuccess, isError: isConfirmError } = useWaitForTransactionReceipt({
        hash,
    })

    const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({
        'ZOID': 0.0000001,      // ~30M ZOID = $3
        'CLAWNCH': 0.00006608   // From DexScreener real-time
    })

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                // Fetch CLAWNCH price from DexScreener
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000)
                
                const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/0xa1F72459dfA10BAD200Ac160eCd78C6b77a747be', {
                    signal: controller.signal
                })
                
                clearTimeout(timeoutId)
                
                if (!response.ok) {
                    console.log('Price fetch failed, using defaults')
                    return
                }
                
                const data = await response.json()

                const prices: Record<string, number> = {}
                if (data && data.pairs && Array.isArray(data.pairs) && data.pairs.length > 0) {
                    // Use first pair price (highest liquidity)
                    const priceUsd = parseFloat(data.pairs[0].priceUsd)
                    if (!isNaN(priceUsd) && priceUsd > 0) {
                        prices['CLAWNCH'] = priceUsd
                        console.log('CLAWNCH price updated:', priceUsd)
                    }
                }
                
                if (Object.keys(prices).length > 0) {
                    setTokenPrices(prev => ({ ...prev, ...prices }))
                }
            } catch (e) {
                console.log('Price fetch error:', e)
            }
        }

        fetchPrices()
        const interval = setInterval(fetchPrices, 60000) // Update every minute
        return () => clearInterval(interval)
    }, [])

    // Get token price
    const getTokenPrice = () => {
        if (selectedToken.id === 'USDC') return 1.00
        return tokenPrices[selectedToken.id] || TOKENS.find(t => t.id === selectedToken.id)?.priceUsd || 0.0000001
    }

    // Calculate USD amount (ZOID gets 25% discount)
    const usdAmount = selectedToken.id === 'ZOID'
        ? (selectedPlan.priceZOID || selectedPlan.priceUSDC * 0.75)
        : selectedPlan.priceUSDC

    // Calculate exact token amount
    const tokenPrice = getTokenPrice()
    const tokenAmount = usdAmount / tokenPrice

    // Format for display
    const formatTokenAmount = () => {
        if (selectedToken.id === 'USDC') {
            return usdAmount.toFixed(2)
        }
        // For small price tokens, show in millions/billions
        if (tokenAmount >= 1000000000) {
            return `${(tokenAmount / 1000000000).toFixed(2)}B`
        } else if (tokenAmount >= 1000000) {
            return `${(tokenAmount / 1000000).toFixed(2)}M`
        } else if (tokenAmount >= 1000) {
            return `${(tokenAmount / 1000).toFixed(2)}K`
        }
        return tokenAmount.toFixed(0)
    }

    useEffect(() => {
        if (isSuccess && hash) {
            setStep('success')
            setTimeout(() => {
                onSuccess(selectedPlan, hash)
                handleClose()
            }, 3000)
        }
    }, [isSuccess, hash])

    useEffect(() => {
        if (isConfirmError) {
            setError("Transaction failed on-chain. Please check your balance and try again.")
            setIsProcessing(false)
            setStep('payment')
        }
    }, [isConfirmError])

    const handlePayment = async () => {
        if (!walletAddress) return
        setError(null)
        setIsProcessing(true)
        setStep('processing')

        try {
            // Calculate exact token amount based on USD price
            // Use discounted ZOID price if paying with ZOID
            const usdAmount = selectedToken.id === 'ZOID' 
                ? (selectedPlan.priceZOID || selectedPlan.priceUSDC * 0.75)
                : selectedPlan.priceUSDC
            const tokenPrice = getTokenPrice()
            const exactTokenAmount = usdAmount / tokenPrice
            
            await writeContractAsync({
                address: selectedToken.address as `0x${string}`,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [
                    TREASURY_ADDRESS as `0x${string}`,
                    parseUnits(exactTokenAmount.toString(), selectedToken.decimals),
                ],
            })
        } catch (e: any) {
            console.error("Payment error full:", e)

            // Extract the most useful error message
            let errorMessage = "Transaction failed. Please try again."

            if (e?.message) {
                if (e.message.includes('User rejected')) {
                    errorMessage = "User rejected signal."
                } else if (e.message.includes('Insufficient funds')) {
                    errorMessage = "Insufficient funds for gas + value."
                } else {
                    // Start with simple message, append details if available
                    errorMessage = e.shortMessage || e.details || e.message.slice(0, 100)
                }
            }

            setError(errorMessage)
            setStep('payment')
            setIsProcessing(false)
        }
    }

    const handleClose = () => {
        if (step === 'processing' || isWaiting) return
        setStep('plan')
        setIsProcessing(false)
        onClose()
    }

    const copyAddress = () => {
        navigator.clipboard.writeText(selectedToken.address)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md bg-[#050505] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight">
                        UPGRADE TO PRO
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 font-medium">
                        Unlock real-time neural signals and structural market intel.
                    </DialogDescription>
                </DialogHeader>

                {step === 'plan' && (
                    <div className="space-y-3 py-4">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.id}
                                className={`
                            relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                            ${selectedPlan.id === plan.id
                                        ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                        : 'border-border bg-card hover:border-purple-500/50 hover:bg-muted/50'}
                        `}
                                onClick={() => setSelectedPlan(plan)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-background border border-border">
                                        {plan.icon}
                                    </div>
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            {plan.name}
                                            {plan.save && (
                                                <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 text-[9px] h-4 px-1.5">
                                                    {plan.save}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{plan.desc}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-bold text-lg">${plan.priceUSDC}</div>
                                    <div className="text-[10px] text-purple-500 font-bold uppercase tracking-tighter">
                                        ${plan.priceZOID?.toFixed(2)} w/ $ZOID
                                    </div>
                                    <div className="text-[9px] text-gray-500 font-medium">25% OFF</div>
                                </div>

                                {selectedPlan.id === plan.id && (
                                    <div className="absolute top-0 right-0 p-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="mt-4">
                            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setStep('payment')}>
                                Continue to Payment
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'payment' && (
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex justify-between items-center">
                            <span className="text-sm font-medium">Selected Plan: {selectedPlan.name}</span>
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setStep('plan')}>Change</Button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <p className="text-sm text-muted-foreground">Select Payment Method:</p>
                            {TOKENS.map((token) => {
                                // Calculate USD amount (ZOID gets 25% discount)
                                const usdAmount = token.id === 'ZOID' 
                                    ? (selectedPlan.priceZOID || selectedPlan.priceUSDC * 0.75)
                                    : selectedPlan.priceUSDC
                                
                                // Calculate token amount
                                const tokenPrice = token.id === 'USDC' ? 1.00 : (tokenPrices[token.id] || token.priceUsd)
                                const tokenAmount = usdAmount / tokenPrice
                                
                                // Format display amount
                                const displayAmount = token.id === 'USDC' 
                                    ? `$${usdAmount.toFixed(2)}`
                                    : tokenAmount >= 1000000 
                                        ? `${(tokenAmount / 1000000).toFixed(1)}M ${token.id}`
                                        : tokenAmount >= 1000
                                            ? `${(tokenAmount / 1000).toFixed(1)}K ${token.id}`
                                            : `${tokenAmount.toFixed(0)} ${token.id}`
                                
                                return (
                                    <div
                                        key={token.id}
                                        className={`
                                flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                                ${selectedToken.id === token.id
                                                ? 'border-purple-500 bg-purple-500/5'
                                                : 'border-border bg-card hover:border-muted'}
                            `}
                                        onClick={() => setSelectedToken(token)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{token.icon}</span>
                                            <div>
                                                <span className="font-medium">{token.name}</span>
                                                {token.id === 'ZOID' && (
                                                    <div className="text-[10px] text-emerald-500 font-bold">25% OFF</div>
                                                )}
                                                <div className="text-[10px] text-gray-500">
                                                    ${token.id === 'USDC' ? '1.00' : tokenPrice.toExponential(2)} / token
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-bold text-sm">{displayAmount}</div>
                                            <div className="text-[10px] text-gray-500">= ${usdAmount.toFixed(2)} USD</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-xs">
                            <p className="mb-2 text-muted-foreground">Contract Address ({selectedToken.name}):</p>
                            <div className="flex items-center justify-between font-mono bg-background p-2 rounded border border-border">
                                <span className="truncate mr-2">{selectedToken.address}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.2)] mt-2"
                            onClick={handlePayment}
                            disabled={isProcessing}
                        >
                            Pay {formatTokenAmount()} {selectedToken.name} (${usdAmount.toFixed(2)})
                        </Button>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold">Confirming Transaction...</h3>
                            <p className="text-sm text-muted-foreground">Please wait while we verify your payment.</p>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="w-10 h-10 text-purple-500" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-2xl font-black text-purple-500 tracking-tight">ACCESS GRANTED</h3>
                            <p className="text-sm text-gray-400 font-medium italic">Welcome to Zoid Intelligence</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
