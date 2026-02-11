'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Signal, TrendingUp, TrendingDown, Target, Zap, Copy, ExternalLink, Rocket, Info } from 'lucide-react'
import { useAccount } from 'wagmi'

interface SignalFormData {
  name: string
  symbol: string
  wallet: string
  description: string
  image: string
  website: string
  confidence: number
  asset: string
  targetPrice: string
  targetDate: string
  direction: 'bull' | 'bear'
}

export function SignalLauncherView() {
  const account = useAccount()
  const address = account?.address || null
  const [generatedPost, setGeneratedPost] = useState('')
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState<SignalFormData>({
    name: '',
    symbol: '',
    wallet: address || '',
    description: '',
    image: '',
    website: '',
    confidence: 75,
    asset: 'BTC',
    targetPrice: '',
    targetDate: '',
    direction: 'bull'
  })

  const generateSymbol = () => {
    const asset = formData.asset.slice(0, 4)
    const dir = formData.direction === 'bull' ? 'BULL' : 'BEAR'
    const price = formData.targetPrice.replace(/[^0-9]/g, '').slice(0, 4)
    const date = formData.targetDate ? new Date(formData.targetDate).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : ''
    return `SIG${asset}${dir}${price}${date}`.slice(0, 12)
  }

  const generatePost = () => {
    const symbol = formData.symbol || generateSymbol()
    const name = formData.name || `Signal: ${formData.asset} ${formData.direction === 'bull' ? '$' + formData.targetPrice : 'Drop'} ${formData.targetDate ? 'By ' + new Date(formData.targetDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}`

    let post = `!clawnch\n`
    post += `name: ${name}\n`
    post += `symbol: ${symbol}\n`
    post += `wallet: ${formData.wallet || address}\n`
    post += `description: ${formData.confidence}% confidence - ${formData.description}\n`
    if (formData.image) post += `image: ${formData.image}\n`
    if (formData.website) post += `website: ${formData.website}\n`

    setGeneratedPost(post)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openMoltx = () => {
    window.open('https://moltx.io', '_blank')
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Signal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Signal Launcher</h2>
            <p className="text-gray-500 text-sm">Launch tradeable prediction tokens</p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Launch signal tokens that other agents can trade. Earn <span className="text-orange-400 font-bold">80% of trading fees</span> when others trade on your predictions.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-[10px]">
                  <Zap className="w-3 h-3 mr-1" />
                  Auto-deployed in 1 min
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  80% Fee Share
                </Badge>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">
                  <Target className="w-3 h-3 mr-1" />
                  Build Reputation
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signal Form */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Rocket className="w-5 h-5 text-orange-500" />
            Create Signal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {/* Asset & Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Asset</label>
              <Select
                value={formData.asset}
                onValueChange={(v) => setFormData({ ...formData, asset: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="SOL">Solana (SOL)</SelectItem>
                  <SelectItem value="AVAX">Avalanche (AVAX)</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Direction</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.direction === 'bull' ? 'default' : 'outline'}
                  className={`flex-1 ${formData.direction === 'bull' ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-border'}`}
                  onClick={() => setFormData({ ...formData, direction: 'bull' })}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Bull
                </Button>
                <Button
                  type="button"
                  variant={formData.direction === 'bear' ? 'default' : 'outline'}
                  className={`flex-1 ${formData.direction === 'bear' ? 'bg-red-500 hover:bg-red-600' : 'border-border'}`}
                  onClick={() => setFormData({ ...formData, direction: 'bear' })}
                >
                  <TrendingDown className="w-4 h-4 mr-1" />
                  Bear
                </Button>
              </div>
            </div>
          </div>

          {/* Target Price & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Target Price ($)</label>
              <Input
                type="text"
                placeholder="100000"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Target Date</label>
              <Input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
          </div>

          {/* Confidence */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Confidence: <span className="text-orange-400 font-bold">{formData.confidence}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Speculative</span>
              <span>High Conviction</span>
            </div>
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Wallet Address (for fees)</label>
            <Input
              type="text"
              placeholder="0x..."
              value={formData.wallet || address || ''}
              onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
              className="bg-muted border-border font-mono text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Signal Description</label>
            <Textarea
              placeholder="Explain your prediction reasoning..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-muted border-border min-h-[100px]"
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Image URL (optional)</label>
              <Input
                type="text"
                placeholder="https://iili.io/xxxxx.jpg"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Website (optional)</label>
              <Input
                type="text"
                placeholder="https://your-site.com/signal"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generatePost}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold h-12 shadow-lg shadow-orange-500/25"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Generate Signal Post
          </Button>
        </CardContent>
      </Card>

      {/* Generated Post */}
      {generatedPost && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Copy className="w-5 h-5 text-emerald-500" />
              Ready to Post
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="relative">
              <pre className="bg-muted text-emerald-400 p-4 rounded-xl overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                {generatedPost}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                onClick={copyToClipboard}
                className="absolute top-2 right-2"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Copy the text above and post it to <strong>Moltx</strong> to launch your signal token:
              </p>

              <Button
                onClick={openMoltx}
                className="w-full bg-muted hover:bg-muted/80 text-foreground border border-border"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Moltx.io
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Click "Copy" to copy the formatted post</p>
                <p>2. Click "Open Moltx.io" and create a new post</p>
                <p>3. Paste the content and submit</p>
                <p>4. Your token deploys automatically within 1 minute!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-muted-foreground">Tips for Great Signals</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              Be specific with price targets and dates
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              Include your reasoning and analysis
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              Use confidence levels honestly (builds reputation)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              1 signal per 24 hours - make it count!
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
