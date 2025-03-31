"use server";

import { Network } from "alchemy-sdk";
import { ChainToken } from "@/models/token";
import { formatUnits } from "ethers";

// 設置 Alchemy API key
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

// 獲取網絡的 RPC URL
function getNetworkRpcUrl(network: Network): string {
  switch (network) {
    case Network.ETH_SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.BASE_SEPOLIA:
      return `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.LINEA_SEPOLIA:
      return `https://linea-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    default:
      return `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  }
}

/**
 * 獲取特定網絡上的代幣餘額
 */
export async function getTokenBalance(
  walletAddress: string,
  chainToken: ChainToken
): Promise<string> {
  if (!walletAddress || !ALCHEMY_API_KEY) return "0";

  try {
    const rpcUrl = getNetworkRpcUrl(chainToken.network);

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now().toString(),
        method: "alchemy_getTokenBalances",
        params: [walletAddress, [chainToken.contractAddress]],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error(`API Error: ${data.error.message}`);
      return "0";
    }

    // 檢查是否有結果
    if (
      !data.result ||
      !data.result.tokenBalances ||
      !data.result.tokenBalances.length
    ) {
      return "0";
    }

    return data.result.tokenBalances[0].tokenBalance || "0";
  } catch (error) {
    console.error(`Error fetching balance for ${chainToken.network}:`, error);
    return "0";
  }
}

/**
 * 獲取多個鏈上的代幣餘額
 */
export async function getTokenBalances(
  walletAddress: string,
  chainTokens: ChainToken[]
): Promise<{ chainName: string; balance: string; formattedBalance: string }[]> {
  if (!walletAddress) return [];

  const results = await Promise.allSettled(
    chainTokens.map((chainToken) => getTokenBalance(walletAddress, chainToken))
  );

  return results.map((result, index) => {
    const chainToken = chainTokens[index];
    const balance = result.status === "fulfilled" ? result.value : "0";
    const formattedBalance = formatUnits(balance, chainToken.token.decimals);

    return {
      chainName: getNetworkDisplayName(chainToken.network),
      balance,
      formattedBalance,
    };
  });
}

/**
 * 獲取總餘額
 */
export async function getTotalBalance(
  walletAddress: string,
  chainTokens: ChainToken[]
): Promise<{
  total: string;
  formattedTotal: string;
  balances: { chainName: string; balance: string; formattedBalance: string }[];
}> {
  const balances = await getTokenBalances(walletAddress, chainTokens);

  let totalBigInt = BigInt(0);
  balances.forEach((item) => {
    totalBigInt += BigInt(item.balance || "0");
  });

  // 假設所有代幣都有相同的小數位數（例如 USDC 都是 6 位）
  const decimals = chainTokens[0]?.token.decimals || 18;
  const formattedTotal = formatUnits(totalBigInt, decimals);

  return {
    total: totalBigInt.toString(),
    formattedTotal,
    balances,
  };
}

/**
 * 獲取網絡顯示名稱
 */
function getNetworkDisplayName(network: Network): string {
  switch (network) {
    case Network.ETH_SEPOLIA:
      return "Ethereum Sepolia";
    case Network.BASE_SEPOLIA:
      return "Base Sepolia";
    case Network.LINEA_SEPOLIA:
      return "Linea Sepolia";
    default:
      return network.toString();
  }
}
