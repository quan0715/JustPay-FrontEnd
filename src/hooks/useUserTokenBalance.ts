"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchTokenBalances,
  TokenBalanceResult,
} from "@/app/_actions/tokenBalance";
import { useAuth } from "./useAuth";
import { useUserData } from "./useUserData";
import { getChainTokenDataByName } from "@/models/token";
import { useMemo } from "react";
export function useUserTokenBalanceWithTargetChain(chainName: string) {
  const { data: userData, isLoading: isUserDataLoading } = useUserData();
  const { address, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<TokenBalanceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!address || !isAuthenticated) return;

    const networkData = getChainTokenDataByName(chainName);
    if (!networkData) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchTokenBalances(address, networkData.network);
      setBalance(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [address, isAuthenticated, chainName]);

  useEffect(() => {
    if (
      address &&
      isAuthenticated &&
      userData?.allowances &&
      userData.allowances.length > 0
    ) {
      fetchBalances();
    }
  }, [address, isAuthenticated, userData?.allowances, fetchBalances]);

  return {
    balance,
    isLoading: isLoading || isUserDataLoading,
    error,
    refreshBalances: fetchBalances,
  };
}

export function useUserTokenBalance() {
  const { address, isAuthenticated } = useAuth();
  const { data: userData, isLoading: isUserDataLoading } = useUserData();

  const [balances, setBalances] = useState<Record<string, TokenBalanceResult>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 從 allowances 提取需要獲取餘額的鏈
  const getChainsFromAllowances = useCallback(() => {
    if (!userData?.allowances || userData.allowances.length === 0) return [];

    // 使用 Set 確保鏈的唯一性
    const chainSet = new Set<string>();
    userData.allowances.forEach((allowance) => {
      if (allowance.chainName) {
        chainSet.add(allowance.chainName);
      }
    });

    return Array.from(chainSet);
  }, [userData?.allowances]);

  const fetchBalances = useCallback(async () => {
    if (!address || !isAuthenticated) return;

    const chainsToFetch = getChainsFromAllowances();
    if (chainsToFetch.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // 為每個鏈獲取餘額
      const balancePromises = chainsToFetch.map(async (chain) => {
        const networkData = getChainTokenDataByName(chain);
        if (!networkData) return null;
        const result = await fetchTokenBalances(address, networkData.network);
        return { chain, result };
      });

      const results = await Promise.all(balancePromises);

      // 將結果轉換為所需的格式
      const newBalances: Record<string, TokenBalanceResult> = {};
      results.forEach((item) => {
        if (item && item.chain && item.result) {
          newBalances[item.chain] = item.result;
        }
      });

      setBalances(newBalances);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("獲取代幣餘額時出錯:", err);
    } finally {
      setIsLoading(false);
    }
  }, [address, isAuthenticated, getChainsFromAllowances]);

  const totalBalance = useMemo(() => {
    if (!balances) return "0.00";

    const total = Object.values(balances).reduce((sum, balance) => {
      return sum + parseFloat(balance.formatted || "0.00");
    }, 0);

    return total.toFixed(2);
  }, [balances]);

  // 當 allowances 變更或地址變更時重新獲取餘額
  useEffect(() => {
    if (
      address &&
      isAuthenticated &&
      userData?.allowances &&
      userData.allowances.length > 0
    ) {
      fetchBalances();
    }
  }, [address, isAuthenticated, userData?.allowances, fetchBalances]);

  return {
    balances,
    isLoading: isLoading || isUserDataLoading,
    error,
    refreshBalances: fetchBalances,
    totalBalance,
    // 提供獲取特定鏈餘額的方
    // 返回從 allowances 提取的所有鏈
    supportedChains: getChainsFromAllowances(),
  };
}
