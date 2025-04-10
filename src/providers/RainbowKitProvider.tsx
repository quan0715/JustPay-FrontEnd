"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider as RainbowKit,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { avalancheFuji, baseSepolia, sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { RainbowKitSiweNextAuthProvider } from "@rainbow-me/rainbowkit-siwe-next-auth";
const PROJECT_ID = "f27c5328dff9e76a58e0d557b9b1ff02";
const APP_NAME = "JustPay";
const wagmiConfig = getDefaultConfig({
  appName: APP_NAME,
  projectId: PROJECT_ID,
  ssr: false,
  chains: [sepolia, baseSepolia, avalancheFuji],
});

const queryClient = new QueryClient();
export default function RainbowKitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 使用 useRef 為組件的本地實例跟踪初始化狀態

  return (
    <WagmiProvider config={wagmiConfig}>
      <SessionProvider refetchInterval={0}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider>
            <RainbowKit>{children}</RainbowKit>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}
