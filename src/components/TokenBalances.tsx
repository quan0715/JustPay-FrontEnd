"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import {
  KeyValueDataCard,
  Key,
  Value,
  Action,
} from "@/components/key-value-data-card";
import {
  EthSepoliaToken,
  BaseSepoliaToken,
  LineaSepoliaToken,
  AvalancheFujiToken,
} from "@/models/token";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import USDCLogo from "cryptocurrency-icons/svg/icon/usdc.svg";
import { RefreshCw } from "lucide-react";
export function TokenBalances() {
  const { address, isAuthenticated } = useAuth();

  const { totalBalance, chainBalances, isLoading, refetch } = useTokenBalance({
    walletAddress: address,
    chainTokens: [
      EthSepoliaToken,
      BaseSepoliaToken,
      LineaSepoliaToken,
      AvalancheFujiToken,
    ],
    enabled: !!address && isAuthenticated,
  });

  if (!isAuthenticated || !address) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>USDC 餘額</CardTitle>
          <CardDescription>請先連接錢包並完成認證</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-start gap-0 py-6">
        <p className="text-xl font-bold">總 USDC 餘額</p>
        <h1 className="text-6xl font-thin py-4 ">USDC ${totalBalance}</h1>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          重新整理
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {chainBalances.map((balance) => (
          <KeyValueDataCard
            key={balance.chainName}
            orientation="horizontal"
            isLoading={isLoading}
          >
            <Key className="text-md">{balance.chainName}</Key>
            <Value className="text-xl font-bold">
              {balance.formattedBalance} USDC
            </Value>
            <Action>
              <USDCLogo />
            </Action>
          </KeyValueDataCard>
        ))}
      </div>
    </div>
  );
}
