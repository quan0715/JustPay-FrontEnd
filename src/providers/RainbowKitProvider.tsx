"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider as RainbowKit,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {
  avalancheFuji,
  baseSepolia,
  lineaSepolia,
  sepolia,
} from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { RainbowKitSiweNextAuthProvider } from "@rainbow-me/rainbowkit-siwe-next-auth";
import { useMemo, useRef, useEffect } from "react";

// 全局變量跟踪 WalletConnect 初始化狀態
let isWalletConnectInitialized = false;

// 將配置移動到組件外部，但將鏈的配置移入組件內
const PROJECT_ID = "f27c5328dff9e76a58e0d557b9b1ff02";
const APP_NAME = "JustPay";

export default function RainbowKitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 使用 useRef 為組件的本地實例跟踪初始化狀態
  const isInitializedRef = useRef(false);

  // 使用 useMemo 確保配置和 queryClient 只創建一次
  const wagmiConfig = useMemo(() => {
    // 檢查全局初始化狀態
    if (!isWalletConnectInitialized) {
      isWalletConnectInitialized = true;
      console.log("初始化 WalletConnect 配置");
      return getDefaultConfig({
        appName: APP_NAME,
        projectId: PROJECT_ID,
        ssr: true,
        chains: [sepolia, baseSepolia, lineaSepolia, avalancheFuji],
      });
    }

    console.log("重用已有的 WalletConnect 配置");
    return getDefaultConfig({
      appName: APP_NAME,
      projectId: PROJECT_ID,
      ssr: true,
      chains: [sepolia, baseSepolia, lineaSepolia, avalancheFuji],
    });
  }, []);

  const queryClient = useMemo(() => new QueryClient(), []);

  // 組件卸載時清理標記
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        isInitializedRef.current = false;
      }
    };
  }, []);

  // 標記組件已初始化
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
  }, []);

  // 返回 Provider 包裝的組件
  // 根據 RainbowKit 官方文檔調整嵌套順序
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
