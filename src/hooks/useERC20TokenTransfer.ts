import { useState } from "react";
import { ethers } from "ethers";
import { ChainToken } from "@/models/token";

// ERC20代幣轉賬所需的ABI
const erc20Abi = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export type TransferStatus = "idle" | "pending" | "success" | "error";

interface TransferResult {
  status: TransferStatus;
  txHash: string | null;
  error: string | null;
}

export function useERC20TokenTransfer() {
  const [transferStatus, setTransferStatus] = useState<TransferStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transfer = async ({
    tokenAddress,
    recipientAddress,
    amount,
    chainId,
    decimals = 6,
  }: {
    tokenAddress: string;
    recipientAddress: string;
    amount: string;
    chainId: number;
    decimals?: number;
  }): Promise<TransferResult> => {
    try {
      // 重置狀態
      setError(null);
      setTxHash(null);
      setTransferStatus("pending");

      // 檢查瀏覽器錢包是否存在
      if (!window.ethereum) {
        throw new Error("未偵測到錢包");
      }

      // 切換到正確的網絡
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      // 建立 provider 和 signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      // 創建合約實例
      const contract = new ethers.Contract(tokenAddress, erc20Abi, signer);

      // 將金額轉換為代幣單位
      const amountInTokenUnits = ethers.parseUnits(amount, decimals);

      // 執行轉賬操作
      const tx = await contract.transfer(recipientAddress, amountInTokenUnits);
      setTxHash(tx.hash);

      // 等待交易確認
      await tx.wait();

      // 交易成功
      setTransferStatus("success");

      return {
        status: "success",
        txHash: tx.hash,
        error: null,
      };
    } catch (err) {
      console.error("ERC20代幣轉賬失敗:", err);

      let errorMessage = "轉賬失敗";
      if (err instanceof Error) {
        // 處理常見錯誤
        if (err.message.includes("insufficient funds")) {
          errorMessage = "餘額不足";
        } else if (err.message.includes("user rejected")) {
          errorMessage = "用戶拒絕交易";
        } else if (err.message.includes("gas required exceeds")) {
          errorMessage = "Gas費用過高";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setTransferStatus("error");

      return {
        status: "error",
        txHash: null,
        error: errorMessage,
      };
    }
  };

  // 更多方便的輔助函數
  const transferWithChainToken = async ({
    chain,
    recipientAddress,
    amount,
  }: {
    chain: ChainToken;
    recipientAddress: string;
    amount: string;
  }): Promise<TransferResult> => {
    return transfer({
      tokenAddress: chain.contractAddress,
      recipientAddress,
      amount,
      chainId: chain.chainId,
      decimals: chain.token.decimals,
    });
  };

  // 重置狀態
  const reset = () => {
    setTransferStatus("idle");
    setTxHash(null);
    setError(null);
  };

  return {
    transfer,
    transferWithChainToken,
    reset,
    transferStatus,
    txHash,
    error,
    isTransferring: transferStatus === "pending",
    isSuccess: transferStatus === "success",
    isError: transferStatus === "error",
  };
}
