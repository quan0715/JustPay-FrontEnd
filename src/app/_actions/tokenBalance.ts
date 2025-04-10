"use server";
import { ethers } from "ethers";
import { getUSDCMetadata } from "@/models/token";
import { ReadContract } from "@/app/_actions/contractAction";

export interface TokenBalanceResult {
  chainId: number;
  raw: string;
  formatted: string;
  decimals: number;
  usdValue: string;
  error?: string;
}

// 獲取代幣餘額
export async function fetchTokenBalances(
  ownerAddress: string,
  chainId: number
): Promise<TokenBalanceResult> {
  try {
    // 找到對應的代幣
    const token = getUSDCMetadata(chainId);
    const TOKEN_ABI = [
      "function balanceOf(address account) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];
    // 創建合約實例
    const contractParams = {
      chainId,
      contractAddress: token.tokenContractAddress,
      contractAbi: TOKEN_ABI,
    };

    const decimals = 6;
    const balanceWei = await ReadContract(contractParams, "balanceOf", [
      ownerAddress,
    ]);
    if (balanceWei === null) {
      throw new Error("Failed to get balance");
    }

    const formattedBalance = ethers.formatUnits(balanceWei, decimals);
    const usdValue = formattedBalance;

    return {
      chainId,
      raw: balanceWei.toString(),
      formatted: formattedBalance,
      decimals: Number(decimals),
      usdValue,
    };
  } catch (error) {
    console.error(`獲取 ${chainId} 餘額失敗:`, error);
    return {
      chainId,
      raw: "0",
      formatted: "0",
      decimals: 6,
      usdValue: "0",
      error: error instanceof Error ? error.message : "獲取餘額失敗",
    };
  }
}
