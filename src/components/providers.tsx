'use client'

import React from 'react'
import {
    RainbowKitProvider,
    darkTheme,
    connectorsForWallets,
} from '@rainbow-me/rainbowkit'
import {
    metaMaskWallet,
    walletConnectWallet,
    coinbaseWallet,
    rainbowWallet,
    injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { WagmiProvider, createConfig, http } from 'wagmi'
import {
    base,
    baseSepolia,
} from 'wagmi/chains'
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query"
import '@rainbow-me/rainbowkit/styles.css'

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Popular',
            wallets: [
                injectedWallet,
                metaMaskWallet,
                rainbowWallet,
                coinbaseWallet,
                walletConnectWallet,
            ],
        },
    ],
    {
        appName: 'Zoid',
        projectId: 'b56e18d47c72ab683b10814fe9495694', // Updated Project ID
    }
)

const config = createConfig({
    connectors,
    chains: [base, baseSepolia],
    transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
    },
    ssr: true,
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
