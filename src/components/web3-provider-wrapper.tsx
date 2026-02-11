'use client';

import dynamic from "next/dynamic";
import React from "react";

const Web3Provider = dynamic(
    () => import("@/components/providers").then((mod) => mod.Web3Provider),
    { ssr: false }
);

export function Web3ProviderWrapper({ children }: { children: React.ReactNode }) {
    return <Web3Provider>{children}</Web3Provider>;
}
