'use client'

import React from 'react'
import {
    RainbowKitProvider,
    getDefaultConfig,
    darkTheme,
} from '@rainbow-me/rainbowkit'
import { WagmiProvider, http } from 'wagmi'
import {
    base,
    baseSepolia,
} from 'wagmi/chains'
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query"
import '@rainbow-me/rainbowkit/styles.css'

const config = getDefaultConfig({
    appName: 'Zoid',
    projectId: '3fcc6b446fe38351502476b70f074213', // Public project ID for Zoid development
    chains: [base, baseSepolia],
    ssr: true,
    // Disable auto-connect for security - users must manually connect
    storage: undefined,
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    modalSize="compact"
                    theme={darkTheme({
                        accentColor: '#8b5cf6',
                        accentColorForeground: 'white',
                        borderRadius: 'large',
                    })}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
