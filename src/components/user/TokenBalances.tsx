"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  KeyValueDataCard,
  Key,
  Value,
  Action,
} from "@/components/key-value-data-card";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserData } from "@/hooks/useUserData";
import AddNetworkDialogWidget from "./AddNetworkDialogWidget";
import { getChainTokenDataByName } from "@/models/token";
import Image from "next/image";
import { useUserTokenBalance } from "@/hooks/useUserTokenBalance";
import { Skeleton } from "@/components/ui/skeleton";
function formatAmount(amount: string): string {
  try {
    // 將 wei 轉換為可讀的數字
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "0.00";

    // 將 wei 值除以 10^6 (USDC 的 decimals 為 6)
    const formattedAmount = (numericAmount / 1_000_000).toFixed(2);
    return formattedAmount;
  } catch (error) {
    console.error("格式化金額時發生錯誤:", error);
    return "0.00";
  }
}

export function TokenBalances() {
  const { data, isLoading } = useUserData();
  const { address, isAuthenticated } = useAuth();
  const {
    balances,
    isLoading: isBalancesLoading,
    totalBalance,
  } = useUserTokenBalance();

  if (!isAuthenticated || !address) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Total USDC Balance</CardTitle>
          <CardDescription>請連接您的錢包並完成驗證</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-start gap-0 py-6">
        <p className="text-xl font-bold">Total USDC Balance</p>
        {isBalancesLoading ? (
          <Skeleton className="w-64 h-24 m-4" />
        ) : (
          <h1 className="text-6xl font-thin py-4 ">USDC ${totalBalance}</h1>
        )}
        <AddNetworkDialogWidget />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {!data?.allowances?.length && !isLoading ? (
          <p className="text-center col-span-full text-gray-500 py-4">
            No allowances added yet, please click the &quot;Add Network&quot;
            button to add
          </p>
        ) : (
          data?.allowances?.map((allowance, index) => {
            const networkConfig = getChainTokenDataByName(allowance.chainName);
            return networkConfig ? (
              <KeyValueDataCard
                key={index}
                orientation="horizontal"
                isLoading={isBalancesLoading}
              >
                <Key className={`text-md font-medium`}>
                  {allowance.chainName}
                </Key>
                <Value className="text-xl font-thin">
                  {formatAmount(balances[allowance.chainName]?.raw || "0.00")}{" "}
                  USDC
                </Value>
                <Action>
                  <Image
                    src={networkConfig.image || ""}
                    alt={allowance.chainName}
                    className="w-8 h-8"
                    width={20}
                    height={20}
                  />
                </Action>
              </KeyValueDataCard>
            ) : null;
          })
        )}
      </div>
    </div>
  );
}
