import { useEffect, useState, useTransition } from "react";
import { ethers } from "ethers";
import { Network } from "alchemy-sdk";
import { getTokenBalance } from "@/actions/get-token-balance";
type BalanceDataCardProps = {
  walletAddress: string;
  network: Network;
  tokenContractAddress: string;
  tokenDecimals: number;
};
export function useUSDC({
  walletAddress,
  network,
  tokenContractAddress,
  tokenDecimals,
}: BalanceDataCardProps) {
  const [balance, setBalance] = useState<string>("");
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // const apiKey = "Bjo3vLhO6Dtl20x0Ss73yDY25x0eY_9G";
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const result = await getTokenBalance({
          walletAddress,
          network,
          tokenContractAddress,
        });
        const formattedBalance = ethers.formatUnits(
          result.result.tokenBalances[0].tokenBalance ?? "0",
          tokenDecimals
        );
        setBalance(formattedBalance);
      } catch (error) {
        setError("錯誤: " + error);
      }
    };
    startTransition(() => {
      fetchBalance();
    });
  }, [walletAddress, network, tokenContractAddress, tokenDecimals]);
  return { balance, loading, error };
}
