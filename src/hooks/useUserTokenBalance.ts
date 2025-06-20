"use client";

import { useState } from "react";
import {
  fetchTokenBalances,
  getAUsdcBalance,
} from "@/app/_actions/tokenBalance";
import { TokenBalanceResult } from "@/models/balance";

export function useUserTokenBalance() {
  const [total, setTotal] = useState("0.0");
  const [balances, setBalances] = useState<Record<number, TokenBalanceResult>>(
    {}
  );
  const [aUsdcBalance, setAUsdcBalance] = useState<TokenBalanceResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 從 allowances 提取需要獲取餘額的鏈
  async function fetchAllTokenBalances(
    userAddress: string,
    chainIds: number[]
  ) {
    if (chainIds.length === 0 && !userAddress) return;
    setIsLoading(true);
    try {
      const balancePromises = chainIds.map(async (chainId) => {
        const result = await fetchTokenBalances(userAddress, chainId);
        return { chainId, result };
      });

      const aUsdcPromise = getAUsdcBalance(userAddress);

      const [usdcBalanceResults, aUsdcData] = await Promise.all([
        Promise.all(balancePromises),
        aUsdcPromise,
      ]);

      const totalBalance = usdcBalanceResults.reduce((sum, balance) => {
        return sum + parseFloat(balance.result.formatted || "0.00");
      }, 0);

      setBalances(
        usdcBalanceResults.reduce((acc, balance) => {
          acc[balance.chainId] = balance.result;
          return acc;
        }, {} as Record<number, TokenBalanceResult>)
      );

      setAUsdcBalance(aUsdcData);
      setTotal(totalBalance.toString());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }
  // 當 allowances 變更或地址變更時重新獲取餘額
  return {
    balances,
    aUsdcBalance,
    isLoading,
    error,
    fetchAllTokenBalances,
    totalBalance: total,
  };
}
