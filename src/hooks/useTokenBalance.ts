"use client";

import { useState, useEffect } from "react";
import { ChainToken } from "@/models/token";
import { getTotalBalance } from "@/app/actions/tokenBalance";

interface TokenBalanceHookProps {
  walletAddress?: string;
  chainTokens: ChainToken[];
  enabled?: boolean;
}

interface TokenBalanceResult {
  totalBalance: string;
  chainBalances: {
    chainName: string;
    balance: string;
    formattedBalance: string;
  }[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTokenBalance({
  walletAddress,
  chainTokens,
  enabled = true,
}: TokenBalanceHookProps): TokenBalanceResult {
  const [totalBalance, setTotalBalance] = useState<string>("0");
  const [chainBalances, setChainBalances] = useState<
    {
      chainName: string;
      balance: string;
      formattedBalance: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalances = async () => {
    if (!walletAddress || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getTotalBalance(walletAddress, chainTokens);
      setTotalBalance(result.formattedTotal);
      setChainBalances(result.balances);
    } catch (err) {
      console.error("Error fetching token balances:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [walletAddress, enabled]);

  return {
    totalBalance,
    chainBalances,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}
