"use client";

import {
  KeyValueDataCard,
  Key,
  Value,
  Action,
} from "@/components/key-value-data-card";
import { useEffect } from "react";
import { useUser } from "@/hooks/useUserData";
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
    return numericAmount.toFixed(2);
  } catch (error) {
    console.error("Formatting amount error:", error);
    return "0.00";
  }
}

export function TokenBalances() {
  const { userData } = useUser();
  const {
    balances,
    fetchAllTokenBalances,
    isLoading: isBalancesLoading,
    totalBalance,
  } = useUserTokenBalance();

  useEffect(() => {
    if (userData?.allowances && userData.allowances.length > 0) {
      console.log("allowances", userData.allowances);
      fetchAllTokenBalances(
        userData.address,
        userData.allowances.map((allowance) => allowance.chainId)
      );
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-start gap-0 py-6">
        <p className="text-xl font-bold">Total USDC Balance</p>
        {isBalancesLoading ? (
          <Skeleton className="w-64 h-24 m-4" />
        ) : (
          <h1 className="text-6xl font-thin py-4 ">
            USDC ${formatAmount(totalBalance)}
          </h1>
        )}
        <AddNetworkDialogWidget />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {!userData?.allowances?.length && !isBalancesLoading ? (
          <p className="text-center col-span-full text-gray-500 py-4">
            No allowances added yet, please click the &quot;Add Network&quot;
            button to add
          </p>
        ) : (
          userData?.allowances?.map((allowance, index) => {
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
                  {formatAmount(
                    balances[allowance.chainId]?.formatted || "0.00"
                  )}{" "}
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
