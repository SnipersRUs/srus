import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Web3ProviderWrapper } from "@/components/web3-provider-wrapper";
import { WebSocketProvider } from "@/components/websocket-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zoid - AI-Driven Market Structure Intelligence",
  description: "Probability-weighted market structure forecasts for Base chain traders. Elliott Wave patterns, retracement zones, and liquidation mapping.",
  keywords: ["Web3", "Trading", "Elliott Wave", "Market Structure", "Base", "DeFi"],
  authors: [{ name: "Zoid" }],
  icons: {
    icon: "/favicon.ico", // Assuming a favicon exists or will use default
  },
  openGraph: {
    title: "Zoid - AI Market Intelligence",
    description: "Probability-weighted market structure forecasts",
    url: "https://srus.life",
    siteName: "Zoid",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zoid - AI Market Intelligence",
    description: "Probability-weighted market structure forecasts",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Web3ProviderWrapper>
            <WebSocketProvider>
              {children}
              <Toaster />
            </WebSocketProvider>
          </Web3ProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
