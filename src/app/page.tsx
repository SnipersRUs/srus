'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, Activity, Target, Clock, Lock, Wallet, Zap, AlertTriangle, CheckCircle2, XCircle, BrainCircuit, Mail, MessageCircle, ExternalLink, LayoutDashboard, LineChart, Crosshair, User, Signal } from 'lucide-react'
import { PaymentModal } from '@/components/payment-modal'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { TradingInfoView } from '@/components/trading-info-view'
import { AlertsDropdown } from '@/components/alerts-dropdown'
import { TipModal } from '@/components/tip-modal'
import { SignalLauncherView } from '@/components/signal-launcher-view'
import { SignalsView } from '@/components/signals-view'
import { BotsView } from '@/components/bots-view'
import { ThemeToggle } from '@/components/theme-toggle'
import { RiskCalculator } from '@/components/risk-calculator'

// Nav Button Component
function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${active
        ? 'text-foreground bg-accent'
        : 'text-muted-foreground hover:text-foreground'
        }`}
    >
      <div className={`${active ? 'text-purple-400' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

// Discord Redirect Modal
function DiscordRedirectModal({ isOpen, onClose, plan }: { isOpen: boolean; onClose: () => void; plan: any }) {
  if (!isOpen) return null

  const discordInviteUrl = "https://discord.gg/8v3zw8829K" // SRUS Discord - Instant Access

  // Fallback values if plan is null/undefined
  const planName = plan?.name || 'Pass'
  const planDuration = plan?.duration || '24 hours'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border p-8 text-center overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-purple-500/5 blur-3xl" />

        <div className="relative">
          {/* Discord Icon */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center mb-6 shadow-lg shadow-[#5865F2]/25">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>

          <h3 className="text-2xl font-black tracking-tighter mb-3">
            Payment Successful!
          </h3>

          <p className="text-muted-foreground mb-2">
            Welcome to <span className="text-purple-400 font-bold">ZOID Alpha</span>
          </p>

          <div className="p-4 rounded-2xl bg-muted border border-border mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              <span className="text-emerald-400 font-bold">✓</span> {planName} Pass Activated
            </p>
            <p className="text-xs text-muted-foreground">
              Duration: {planDuration}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Join our Discord server to access your bots:
            </p>

            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white font-bold hover:from-[#4752C4] hover:to-[#3a45a0] transition-all shadow-lg shadow-[#5865F2]/25"
            >
              <MessageCircle className="w-5 h-5" />
              Join Discord & Get Bot Access
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Auto-assigned trial role on join</p>
              <p>• Access to Bounty Seeker & Short Hunter</p>
              <p>• Role expires after {planDuration}</p>
            </div>

            <p className="text-[10px] text-muted-foreground mt-4">
              ⚠️ All passes are non-refundable
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Account View Component
function AccountView({ plan, onExtend, walletAddress }: { plan: any; onExtend: () => void; walletAddress: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>('Calculated...')

  useEffect(() => {
    if (!plan || !plan.purchaseTime) {
      setTimeLeft('No Active Plan')
      return
    }

    const durationMs = plan.durationHours * 60 * 60 * 1000
    const expiryTime = plan.purchaseTime + durationMs

    const updateTimer = () => {
      const now = Date.now()
      const diff = expiryTime - now

      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [plan])

  // Expiration date display
  const expirationDate = plan && plan.purchaseTime
    ? new Date(plan.purchaseTime + (plan.durationHours * 60 * 60 * 1000)).toLocaleDateString()
    : 'N/A'

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          Account Status
        </h2>
        <p className="text-muted-foreground text-sm">Manage your subscription and settings</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-bold">Your Membership</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm font-bold text-foreground mb-1">
                  {plan ? plan.name : 'Free Tier'}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${plan ? 'border-emerald-500 text-emerald-500' : 'border-muted-foreground text-muted-foreground'}`}>
                    {plan ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
              </div>
              {plan && (
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Expires</div>
                  <div className="font-mono text-sm text-purple-400">{expirationDate}</div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-purple-500/20">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Time Remaining:</span>
                <span className="font-mono text-sm text-foreground font-bold">{timeLeft}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onExtend}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            {plan ? 'Extend Access' : 'Purchase Access'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg font-bold">Connected Wallet</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 text-sm text-muted-foreground break-all font-mono">
          <ConnectButton showBalance={false} accountStatus="address" />
        </CardContent>
      </Card>

      {/* Risk Calculator */}
      <RiskCalculator />

      {/* Community Access Card - Only show if user has an active plan */}
      {plan && plan.purchaseTime && timeLeft !== 'Expired' && (
        <Card className="border-[#5865F2]/30 bg-[#5865F2]/5">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-lg font-bold">Community Access</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Join our community for support, discussion, and more alpha. This is optional - you can see all signals directly in this app!
            </p>

            <a
              href="https://discord.gg/8v3zw8829K"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Join Discord Server
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Exclusive trading community</p>
              <p>✓ Direct support from team</p>
              <p>✓ Share setups with other members</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ZoidApp() {
  const { address, isConnected } = useAccount()

  const [activeTab, setActiveTab] = useState<'analysis' | 'signals' | 'account' | 'public-signals'>('account')

  // Payment modal state
  const [packetModalOpen, setPaymentModalOpen] = useState(false)
  const [discordModalOpen, setDiscordModalOpen] = useState(false)
  const [purchasedPlan, setPurchasedPlan] = useState<any>(null)

  // Discord username collection state
  const [discordUsername, setDiscordUsername] = useState<string>('')
  const [discordInputModalOpen, setDiscordInputModalOpen] = useState(false)
  const [isVerifyingDiscord, setIsVerifyingDiscord] = useState(false)

  // Tip modal state
  const [tipModalOpen, setTipModalOpen] = useState(false)

  // Load purchased plan from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPlan = localStorage.getItem('zoid_purchased_plan')
      if (savedPlan) {
        try {
          const planData = JSON.parse(savedPlan)
          // Check if plan is still valid (not expired)
          const expiryTime = planData.purchaseTime + (planData.durationHours * 60 * 60 * 1000)
          if (Date.now() < expiryTime) {
            setPurchasedPlan(planData)
            console.log('✅ Restored plan from storage:', planData.name)
          } else {
            console.log('⏰ Plan expired, clearing storage')
            localStorage.removeItem('zoid_purchased_plan')
          }
        } catch (e) {
          console.error('Failed to parse saved plan:', e)
          localStorage.removeItem('zoid_purchased_plan')
        }
      }
    }
  }, [])

  // Save purchased plan to localStorage whenever it changes
  useEffect(() => {
    if (purchasedPlan && typeof window !== 'undefined') {
      localStorage.setItem('zoid_purchased_plan', JSON.stringify(purchasedPlan))
    }
  }, [purchasedPlan])

  const handlePaymentSuccess = async (plan: any, txHash?: string) => {
    // Map plan IDs to durations in hours
    const durationMap: Record<string, number> = {
      'daily': 24,           // 1 day
      'weekly': 168,         // 7 days
      'monthly': 720,        // 30 days
      'lifetime': 876000     // 100 years (effectively lifetime)
    }

    const durationHours = durationMap[plan.id] || 24

    // Capture purchase time
    const purchaseTime = Date.now()

    // Store the purchased plan with duration
    const planData = {
      ...plan,
      purchaseTime,
      durationHours,
      duration: plan.id === 'lifetime' ? 'Lifetime' :
        plan.id === 'monthly' ? '30 days' :
          plan.id === 'weekly' ? '7 days' : '24 hours',
      txHash,
      walletAddress: address
    }

    setPurchasedPlan(planData)

    // Close payment modal and switch to signals tab (Skip Discord linking)
    setPaymentModalOpen(false)
    setActiveTab('signals')
  }

  const handleDiscordUsernameSubmit = async () => {
    if (!discordUsername.trim()) {
      console.log('Missing username')
      return
    }

    if (!purchasedPlan || !purchasedPlan.txHash) {
      console.log('Missing purchasedPlan or txHash:', purchasedPlan)
      // Still allow user to continue to Discord even without verification
      const fallbackPlan = purchasedPlan || {
        name: 'Pass',
        duration: '24 hours',
        purchaseTime: Date.now(),
        durationHours: 24
      }
      const updatedPlan = {
        ...fallbackPlan,
        discordUsername: discordUsername.trim(),
        verified: false
      }
      setPurchasedPlan(updatedPlan)
      localStorage.setItem('zoid_purchased_plan', JSON.stringify(updatedPlan))
      setDiscordInputModalOpen(false)
      setDiscordModalOpen(true)
      return
    }

    setIsVerifyingDiscord(true)

    try {
      // Send Discord username + txHash to API
      const response = await fetch('/api/verify-discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          txHash: purchasedPlan.txHash,
          discordUsername: discordUsername.trim(),
        }),
      })

      const data = await response.json()
      console.log('API response:', data)

      // Store Discord username with plan regardless of API response
      const updatedPlan = {
        ...purchasedPlan,
        discordUsername: discordUsername.trim(),
        verified: data.success || false
      }
      setPurchasedPlan(updatedPlan)
      localStorage.setItem('zoid_purchased_plan', JSON.stringify(updatedPlan))

      // Close input modal and show Discord invite
      setDiscordInputModalOpen(false)
      setDiscordModalOpen(true)

      if (!data.success) {
        console.log('API verification warning:', data.error)
      }
    } catch (error) {
      console.error('Discord verification error:', error)
      // Still show Discord modal even if API fails
      const updatedPlan = {
        ...purchasedPlan,
        discordUsername: discordUsername.trim(),
        verified: false
      }
      setPurchasedPlan(updatedPlan)
      localStorage.setItem('zoid_purchased_plan', JSON.stringify(updatedPlan))
      setDiscordInputModalOpen(false)
      setDiscordModalOpen(true)
    } finally {
      setIsVerifyingDiscord(false)
    }
  }

  // Render content based on active tab
  const renderContent = () => {
    // Check if plan is active
    const isPlanActive = !!purchasedPlan

    switch (activeTab) {
      case 'analysis':
        return <TradingInfoView />
      case 'signals':
        return isPlanActive ? <SignalsView /> : renderPaywall()
      case 'public-signals':
        return <SignalLauncherView />
      case 'account':
        return <AccountView plan={purchasedPlan} onExtend={() => setPaymentModalOpen(true)} walletAddress={address ?? null} />
      default:
        return isPlanActive ? <SignalsView /> : renderPaywall()
    }
  }

  // Main Paywall View (Logged out or No Plan)
  const renderPaywall = () => (
    <div className="max-w-md mx-auto pb-24">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black tracking-tight mb-2">
          Unlock Bot Access
        </h2>
        <p className="text-muted-foreground text-sm">
          Get instant access to AI trading bots via Discord
        </p>
      </div>

      {/* Free Signal Launcher Promo - MOVED TO TOP */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Signal className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg text-orange-400 mb-2">🚀 Launch Your Own Signals</div>
            <div className="text-sm text-muted-foreground mb-4">
              Create tradeable prediction tokens and earn <span className="text-orange-400 font-bold">80% of trading fees</span> when others trade on your calls. Completely free - no subscription required!
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">✓ Free to Use</span>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">✓ 80% Fee Share</span>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">✓ Build Reputation</span>
            </div>
            <Button
              onClick={() => setActiveTab('public-signals')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold h-11 shadow-lg shadow-orange-500/25"
            >
              <Signal className="w-4 h-4 mr-2" />
              Launch Signals
            </Button>
          </div>
        </div>
      </div>

      {/* Paywall Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-8 text-center mb-8">
        <div className="absolute inset-0 bg-purple-500/5 blur-3xl" />

        <div className="relative">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25">
            <img src="/logo.png" alt="Zoid Logo" className="w-12 h-12 object-contain" />
          </div>

          <h3 className="text-2xl font-black tracking-tighter mb-3">
            ZOID ALPHA
          </h3>

          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Get real-time signals from Short Hunter & Bounty Seeker bots via Discord.
            Instant access after payment.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Short Hunter Bot
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-2" />
              Bounty Seeker Bot
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-2" />
              Sniper Guru Scanner
            </div>

            <Button
              onClick={() => setPaymentModalOpen(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-400 hover:to-blue-400 rounded-full font-bold h-12 shadow-lg shadow-purple-500/25"
            >
              Get Access
            </Button>

            <p className="text-xs text-muted-foreground">
              Starting from $3.00 • Non-refundable
            </p>
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="space-y-3">
        <h4 className="text-xs font-black tracking-widest text-muted-foreground uppercase text-center mb-4">
          What You Get
        </h4>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="font-bold text-sm">Short Hunter Bot</div>
              <div className="text-xs text-muted-foreground">Scans every 45 min for short opportunities</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-sm">Bounty Seeker Bot</div>
              <div className="text-xs text-muted-foreground">Scans every 30 min for long opportunities</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-bold text-sm">Sniper Guru Scanner</div>
              <div className="text-xs text-muted-foreground">Real-time setup alerts (80+ score only)</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#5865F2]" />
            </div>
            <div>
              <div className="font-bold text-sm">Discord Community</div>
              <div className="text-xs text-muted-foreground">Trade with other snipers, get support</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-8 p-6 rounded-2xl bg-card border border-border">
        <h4 className="text-xs font-black tracking-widest text-muted-foreground uppercase text-center mb-4">
          How It Works
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-400">1</span>
            </div>
            <div>
              <div className="text-sm font-bold">Pay</div>
              <div className="text-xs text-muted-foreground">Choose your pass duration</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-400">2</span>
            </div>
            <div>
              <div className="text-sm font-bold">Unlock Access</div>
              <div className="text-xs text-muted-foreground">Instant access to signals directly in this app</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-400">3</span>
            </div>
            <div>
              <div className="text-sm font-bold">Trade</div>
              <div className="text-xs text-muted-foreground">View real-time signals in the dashboard</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-400">4</span>
            </div>
            <div>
              <div className="text-sm font-bold">Community (Optional)</div>
              <div className="text-xs text-muted-foreground">Join Discord for support & chat</div>
            </div>
          </div>
        </div>
      </div>

      {/* Non-refundable notice */}
      <div className="mt-6 text-center">
        <p className="text-[10px] text-muted-foreground">
          ⚠️ All passes are non-refundable • Access expires after duration
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-purple-500/30">
      <PaymentModal
        isOpen={packetModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        walletAddress={address ? (address as string) : null}
      />

      {/* Discord Username Input Modal */}
      {discordInputModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-card border border-border p-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-purple-500/5 blur-3xl" />
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center mb-6 shadow-lg shadow-[#5865F2]/25">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter mb-3">
                Link Your Discord
              </h3>
              <p className="text-muted-foreground mb-6">
                Enter your Discord username to get automatic role assignment
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  placeholder="username#1234 or username"
                  className="w-full p-4 rounded-2xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-muted-foreground">
                  This links your payment to your Discord account for automatic role assignment
                </p>
                <Button
                  onClick={() => {
                    console.log('Continue to Discord clicked')
                    handleDiscordUsernameSubmit()
                  }}
                  disabled={!discordUsername.trim() || isVerifyingDiscord}
                  className="w-full bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white font-bold h-12 hover:from-[#4752C4] hover:to-[#3a45a0] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingDiscord ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Linking...
                    </span>
                  ) : (
                    'Continue to Discord'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DiscordRedirectModal
        isOpen={discordModalOpen}
        onClose={() => setDiscordModalOpen(false)}
        plan={purchasedPlan || { name: 'Trial', duration: '24 hours' }}
      />

      <TipModal
        isOpen={tipModalOpen}
        onClose={() => setTipModalOpen(false)}
      />

      {/* Modern Trading App Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <img src="/logo.png" alt="Zoid Logo" className="w-full h-full object-contain" onError={(e) => {
                e.currentTarget.style.display = 'none'
              }} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none">ZOID</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alpha</span>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Buy ZOID Button */}
            <a
              href="https://srus.life/zoid"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 border border-border transition-colors mr-1"
            >
              <img src="/logo.png" alt="ZOID" className="w-4 h-4 object-contain" />
              <span className="text-xs font-bold text-foreground">
                Buy ZOID
              </span>
            </a>
            {isConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTipModalOpen(true)}
                className="text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 h-9 px-3"
              >
                <span className="mr-1.5">☕</span>
                <span className="text-xs font-medium">Tip</span>
              </Button>
            )}

            {isConnected && <AlertsDropdown />}

            <ThemeToggle />

            <div className="ml-2">
              <ConnectButton
                accountStatus="avatar"
                chainStatus="none"
                showBalance={false}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'public-signals' ? (
        /* PUBLIC SIGNALS - No wallet required */
        <>
          <main className="flex-1 container mx-auto w-full px-4 py-6">
            <SignalLauncherView />
          </main>

          {/* Back button for public signals */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border px-6 pb-safe pt-2">
            <div className="container mx-auto max-w-md flex items-center justify-center py-2">
              <Button
                onClick={() => setActiveTab('signals')}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Home
              </Button>
            </div>
          </nav>
        </>
      ) : !isConnected ? (
        <main className="flex-1 container mx-auto w-full px-4 py-6 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <img src="/logo.png" alt="Zoid Logo" className="w-16 h-16 object-contain" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter">ZOID ALPHA</h2>
              <p className="text-muted-foreground">
                AI-powered trading bots. Connect your wallet to get access.
              </p>
            </div>

            {/* Signal Launcher Teaser - Shows before wallet connection */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-left">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Signal className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-orange-400 mb-1">🚀 Launch Your Own Signals</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Create tradeable prediction tokens that other agents can trade. Earn 80% of trading fees when others trade on your calls!
                  </div>
                  <Button
                    onClick={() => setActiveTab('public-signals')}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold h-10 text-sm"
                  >
                    <Signal className="w-4 h-4 mr-2" />
                    Try Signal Launcher
                  </Button>
                </div>
              </div>
            </div>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button
                  onClick={openConnectModal}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold h-12 text-lg"
                >
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>

            <p className="text-xs text-muted-foreground">
              Secure connection via RainbowKit
            </p>
          </div>
        </main>
      ) : (
        /* CONNECTED - Show tabs and content (Signals FREE, others require plan) */
        <>
          <main className="flex-1 container mx-auto w-full px-4 py-6">
            {renderContent()}
          </main>

          {/* Tab Navigation - Always show, but some tabs require plan */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border px-6 pb-safe pt-2">
            <div className="container mx-auto max-w-md flex items-center justify-center gap-6 py-2">
              <NavButton
                active={activeTab === 'signals'}
                onClick={() => setActiveTab('signals')}
                icon={<Signal className="w-5 h-5" />}
                label="Signals"
              />
              <NavButton
                active={activeTab === 'analysis'}
                onClick={() => purchasedPlan ? setActiveTab('analysis') : setPaymentModalOpen(true)}
                icon={<BrainCircuit className="w-5 h-5" />}
                label="Strategies"
              />
              <NavButton
                active={activeTab === 'account'}
                onClick={() => setActiveTab('account')}
                icon={<User className="w-5 h-5" />}
                label="Account"
              />
            </div>
          </nav>
        </>
      )}

      {/* Global Gradient Blob Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] opacity-20 -mr-40 -mt-20" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] opacity-20 -ml-40 -mb-20" />
      </div>
    </div>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="min-h-screen bg-background" />

  return <ZoidApp />
}
