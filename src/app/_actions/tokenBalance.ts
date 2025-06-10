"use server";
import { ethers } from "ethers";
import { getUSDCMetadata } from "@/models/token";
import { ReadContract } from "@/app/_actions/contractAction";
import { TokenBalanceResult } from "@/models/balance";

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

const AAVE_POOL_ABI_FOR_RESERVE = [
  "function getReserveData(address asset) view returns (tuple(tuple(uint256 data) configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))",
];

export async function getAUsdcBalance(
  ownerAddress: string
): Promise<TokenBalanceResult> {
  const chainId = 84532; // Base Sepolia
  const aUsdcAddress = "0x10f1a9d11cdf50041f3f8cb7191cbe2f31750acc"; // Common Testnet USDC

  const TOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];

  try {
    const contractParams = {
      chainId,
      contractAddress: aUsdcAddress,
      contractAbi: TOKEN_ABI,
    };

    const balanceWei = await ReadContract(contractParams, "balanceOf", [
      ownerAddress,
    ]);
    if (balanceWei === null) {
      throw new Error("Failed to get aUSDC balance");
    }

    const decimals = await ReadContract(contractParams, "decimals");
    if (decimals === null) {
      throw new Error("Failed to get aUSDC decimals");
    }

    const formattedBalance = ethers.formatUnits(balanceWei, decimals);
    const usdValue = formattedBalance; // Assuming 1 aUSDC = 1 USD for now

    return {
      chainId,
      raw: balanceWei.toString(),
      formatted: formattedBalance,
      decimals: Number(decimals),
      usdValue,
    };
  } catch (error) {
    console.error(`獲取 aUSDC 餘額失敗:`, error);
    return {
      chainId,
      raw: "0",
      formatted: "0",
      decimals: 6, // Default to 6 if decimals call fails
      usdValue: "0",
      error: error instanceof Error ? error.message : "獲取 aUSDC 餘額失敗",
    };
  }
}
