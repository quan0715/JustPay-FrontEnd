"use server";

import { ethers } from "ethers";
import { Network } from "alchemy-sdk";
import {
  EthSepoliaToken,
  BaseSepoliaToken,
  LineaSepoliaToken,
  AvalancheFujiToken,
} from "@/models/token";

// 使用環境變量存儲 API KEY
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "demo";

// 從 Network 類型獲取 RPC URL
function getNetworkRpcUrl(network: Network): string {
  switch (network) {
    case Network.ETH_SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.BASE_SEPOLIA:
      return `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.LINEA_SEPOLIA:
      return `https://linea-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.AVAX_FUJI:
      return `https://avax-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    default:
      return `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  }
}

// 支援的代幣映射
type NetworkTokenMap = {
  [key in
    | Network.ETH_SEPOLIA
    | Network.BASE_SEPOLIA
    | Network.LINEA_SEPOLIA
    | Network.AVAX_FUJI]: typeof EthSepoliaToken;
};

const SUPPORTED_TOKENS: NetworkTokenMap = {
  [Network.ETH_SEPOLIA]: EthSepoliaToken,
  [Network.BASE_SEPOLIA]: BaseSepoliaToken,
  [Network.LINEA_SEPOLIA]: LineaSepoliaToken,
  [Network.AVAX_FUJI]: AvalancheFujiToken,
};

// USDC ABI 簡化版
const TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// 返回結果介面
export interface TokenBalanceResult {
  network: Network;
  raw: string;
  formatted: string;
  decimals: number;
  usdValue: string;
  error?: string;
}

// 獲取代幣餘額
export async function fetchTokenBalances(
  ownerAddress: string,
  network: Network
): Promise<TokenBalanceResult> {
  try {
    // 找到對應的代幣
    const token = SUPPORTED_TOKENS[network as keyof typeof SUPPORTED_TOKENS];
    if (!token) {
      throw new Error("不支援的網路");
    }

    // 獲取 RPC URL
    const rpcUrl = getNetworkRpcUrl(network);

    // 連接到提供者
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // 創建合約實例
    const contract = new ethers.Contract(
      token.contractAddress,
      TOKEN_ABI,
      provider
    );

    // 獲取代幣小數位數
    const decimals = token.token.decimals;

    // 檢查餘額
    const balanceWei = await contract.balanceOf(ownerAddress);
    const formattedBalance = ethers.formatUnits(balanceWei, decimals);
    // 簡單估算 USD 價值 (這裡假設 USDC 是 1:1 USD)
    const usdValue = formattedBalance;

    return {
      network,
      raw: balanceWei.toString(),
      formatted: formattedBalance,
      decimals,
      usdValue,
    };
  } catch (error) {
    console.error(`獲取 ${network} 餘額失敗:`, error);
    return {
      network,
      raw: "0",
      formatted: "0",
      decimals: 6,
      usdValue: "0",
      error: error instanceof Error ? error.message : "獲取餘額失敗",
    };
  }
}

// 獲取所有支援網絡的代幣餘額
export async function fetchAllTokenBalances(
  ownerAddress: string
): Promise<TokenBalanceResult[]> {
  if (!ownerAddress) {
    return [];
  }

  const results: TokenBalanceResult[] = [];
  const networks = Object.keys(SUPPORTED_TOKENS).map(
    (key) => Number(key) as unknown as Network
  );

  // 並行獲取所有網絡的餘額
  await Promise.all(
    networks.map(async (network) => {
      try {
        const result = await fetchTokenBalances(ownerAddress, network);
        results.push(result);
      } catch (error) {
        console.error(`獲取 ${network} 餘額失敗:`, error);
        results.push({
          network,
          raw: "0",
          formatted: "0",
          decimals: 6,
          usdValue: "0",
          error: error instanceof Error ? error.message : "獲取餘額失敗",
        });
      }
    })
  );

  return results;
}
