import { useState } from "react";
import { ethers } from "ethers";
import { ChainToken } from "@/models/token";
import { toast } from "sonner";
// 合約地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_JUSTPAY_SPENDER_ADDRESS;

// 簽名狀態類型
export type SignStatus = "idle" | "pending" | "success" | "error";

// 簽名結果接口
export interface SignResult {
  status: SignStatus;
  signature: string | null;
  sourceChainIds: number[];
  nonce: number;
  error: string | null;
}

// 合約 ABI
const contractAbi = [
  {
    name: "burnProxy",
    type: "function",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
      { name: "destinationCaller", type: "bytes32" },
      { name: "maxFee", type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
      { name: "sourceChainIds", type: "uint256[]" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

export function useJustPaySign() {
  const [signStatus, setSignStatus] = useState<SignStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  /**
   * 創建並簽署消息
   */
  const signMessage = async ({
    chains,
    nonce = Math.floor(Math.random() * 1000000),
  }: {
    // signer: string;
    chains: ChainToken[];
    nonce?: number;
  }): Promise<SignResult> => {
    try {
      setError(null);
      setSignStatus("pending");

      // 準備鏈ID列表
      const chainIds = chains.map((chain) => chain.chainId);

      // 檢查瀏覽器錢包是否存在
      if (!window.ethereum) {
        throw new Error("未偵測到錢包");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const ethSigner = await provider.getSigner();

      // 創建消息哈希
      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256[]", "uint256"],
          [chainIds, nonce]
        )
      );

      console.log("消息哈希:", messageHash);
      console.log("鏈IDs:", chainIds);
      console.log("隨機數 (nonce):", nonce);

      // 簽名消息

      const signature = await ethSigner.signMessage(
        ethers.getBytes(messageHash)
      );
      console.log("簽名:", signature);

      setSignStatus("success");

      return {
        status: "success",
        signature,
        sourceChainIds: chainIds,
        nonce,
        error: null,
      };
    } catch (err: unknown) {
      console.error("簽名失敗:", err);

      let errorMessage = "簽名失敗";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setSignStatus("error");

      return {
        status: "error",
        signature: null,
        sourceChainIds: [],
        nonce: 0,
        error: errorMessage,
      };
    }
  };
  /**
   * 調用合約的 burnProxy 方法
   */
  const executeBurnProxy = async ({
    amount,
    destinationDomain = 0,
    mintRecipient,
    burnToken,
    destinationCaller = ethers.ZeroHash,
    maxFee = 100,
    minFinalityThreshold = 500,
    signResult,
  }: {
    amount: string;
    destinationDomain?: number;
    mintRecipient: string;
    burnToken: string;
    destinationCaller?: string;
    maxFee?: number;
    minFinalityThreshold?: number;
    signResult: SignResult;
  }) => {
    if (!signResult || !signResult.signature) {
      console.error("簽名結果不完整");
      return false;
    }

    try {
      // 檢查瀏覽器錢包
      if (!window.ethereum) {
        throw new Error("未偵測到錢包");
      }

      // 建立連接
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const ethSigner = await provider.getSigner();
      console.log("ethSigner:", ethSigner);
      // 檢查網絡
      const network = await provider.getNetwork();
      console.log("當前網絡:", network.chainId.toString());
      console.log("簽名鏈IDs:", signResult.sourceChainIds);

      // 創建合約實例
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS as string,
        contractAbi,
        ethSigner
      );

      // 準備參數
      const amountParsed = ethers.parseUnits(amount, 6);

      // 處理 mintRecipient
      let mintRecipientBytes32;
      if (mintRecipient.startsWith("0x") && mintRecipient.length === 42) {
        const addressWithoutPrefix = mintRecipient.slice(2);
        mintRecipientBytes32 = "0x" + addressWithoutPrefix.padStart(64, "0");
      } else if (
        mintRecipient.startsWith("0x") &&
        mintRecipient.length === 66
      ) {
        mintRecipientBytes32 = mintRecipient;
      } else {
        throw new Error("無效的收款地址格式");
      }

      // 處理 destinationCaller
      let destinationCallerBytes32;
      if (
        destinationCaller.startsWith("0x") &&
        destinationCaller.length === 42
      ) {
        const addressWithoutPrefix = destinationCaller.slice(2);
        destinationCallerBytes32 =
          "0x" + addressWithoutPrefix.padStart(64, "0");
      } else if (
        destinationCaller.startsWith("0x") &&
        destinationCaller.length === 66
      ) {
        destinationCallerBytes32 = destinationCaller;
      } else {
        destinationCallerBytes32 = ethers.ZeroHash;
      }

      // 調用合約
      console.log("調用 burnProxy 合約...");
      console.log("amountParsed:", amountParsed);
      console.log("destinationDomain:", destinationDomain);
      console.log("mintRecipientBytes32:", mintRecipientBytes32);
      console.log("burnToken:", burnToken);
      console.log("destinationCallerBytes32:", destinationCallerBytes32);
      console.log("maxFee:", maxFee);
      console.log("minFinalityThreshold:", minFinalityThreshold);
      const tx = await contract.burnProxy(
        amountParsed,
        destinationDomain,
        mintRecipientBytes32,
        burnToken,
        destinationCallerBytes32,
        maxFee,
        minFinalityThreshold,
        signResult.sourceChainIds,
        signResult.nonce,
        signResult.signature
      );

      console.log("交易已發送, 等待確認:", tx.hash);
      await tx.wait();
      console.log("交易已確認");

      return true;
    } catch (error: unknown) {
      // 處理錯誤
      const err = error as { message?: string; reason?: string };
      console.error("執行失敗:", error);

      toast.error(`執行失敗: ${err.reason || err.message || "未知錯誤"}`);
      return false;
    }
  };

  return {
    signMessage,
    executeBurnProxy,
    signStatus,
    error,
    isIdle: signStatus === "idle",
    isPending: signStatus === "pending",
    isSuccess: signStatus === "success",
    isError: signStatus === "error",
  };
}
