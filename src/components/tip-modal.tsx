'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSendTransaction, useWriteContract } from 'wagmi'
import { parseEther, parseUnits } from 'viem'
import { Coffee, Wallet, CheckCircle2 } from 'lucide-react'

const SNIPER_GURU_ADDRESS = '0xCb2982541fbF730d3c01C5Fad486807d34839D01' as `0x${string}`

// Token configurations
const TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true,
  },
  ZOID: {
    symbol: 'ZOID',
    name: 'ZOID Token',
    decimals: 18,
    address: '0xYourZoidTokenAddress' as `0x${string}`, // Replace with actual ZOID token address
    isNative: false,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // Base USDC
    isNative: false,
  },
}

// ERC20 Transfer ABI
const ERC20_ABI = [
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

interface TipModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TipModal({ isOpen, onClose }: TipModalProps) {
  const [selectedToken, setSelectedToken] = useState<keyof typeof TOKENS>('ETH')
  const [amount, setAmount] = useState('0.01')
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { sendTransaction, isPending: isEthPending } = useSendTransaction()
  const { writeContract, isPending: isTokenPending } = useWriteContract()

  const isPending = isEthPending || isTokenPending
  const token = TOKENS[selectedToken]

  const handleTip = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setError(null)

    try {
      if (token.isNative) {
        // Send ETH
        if (!sendTransaction) {
          setError('Wallet not ready. Please try again.')
          return
        }
        
        sendTransaction({
          to: SNIPER_GURU_ADDRESS,
          value: parseEther(amount),
        }, {
          onSuccess: () => {
            setIsSuccess(true)
            setTimeout(() => {
              setIsSuccess(false)
              onClose()
            }, 2000)
          },
          onError: (err: any) => {
            console.error('ETH transfer error:', err)
            setError(err?.message || 'Transaction failed')
          }
        })
      } else {
        // Send ERC20 token
        if (!writeContract) {
          setError('Wallet not ready. Please try again.')
          return
        }
        
        writeContract({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [SNIPER_GURU_ADDRESS, parseUnits(amount, token.decimals)],
        }, {
          onSuccess: () => {
            setIsSuccess(true)
            setTimeout(() => {
              setIsSuccess(false)
              onClose()
            }, 2000)
          },
          onError: (err: any) => {
            console.error('Token transfer error:', err)
            setError(err?.message || 'Transaction failed')
          }
        })
      }
    } catch (err: any) {
      console.error('Tip error:', err)
      setError(err?.message || 'Something went wrong')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coffee className="w-5 h-5 text-amber-500" />
            Tip Sniper Guru
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Show your appreciation by tipping in ETH, ZOID, or USDC
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">Thank You! ☕</p>
              <p className="text-sm text-gray-400">Your tip has been sent successfully</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Token Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Token</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TOKENS).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedToken(key as keyof typeof TOKENS)}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                      selectedToken === key
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {t.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setError(null)
                  }}
                  className="bg-white/5 border-white/10 text-white pr-16"
                  placeholder="0.01"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  {token.symbol}
                </span>
              </div>
              <div className="flex gap-2">
                {['0.01', '0.05', '0.1', '0.5'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setAmount(preset)
                      setError(null)
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Recipient Info */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Wallet className="w-3 h-3" />
                Recipient
              </div>
              <div className="text-xs font-mono text-gray-400 truncate">
                {SNIPER_GURU_ADDRESS}
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleTip}
              disabled={isPending || !amount || parseFloat(amount) <= 0}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-12"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Confirm in wallet...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Coffee className="w-4 h-4" />
                  Send {amount} {token.symbol}
                </span>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
