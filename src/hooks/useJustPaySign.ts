import { useState } from "react";
import { ethers } from "ethers";
import { ChainToken } from "@/models/token";
import { getChainTokenDataByChainId } from "@/models/token";
import { executeProxyDepositForBurn } from "@/app/_actions/burnProxy";
import { createSignatureTransaction } from "@/app/_actions/signatureTransactionAction";
// 合約地址
// const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_JUSTPAY_SPENDER_ADDRESS;

// 簽名狀態類型
export type SignStatus = "idle" | "pending" | "success" | "error";

// 簽名結果接口
export interface SignResult {
  status: SignStatus;
  signature: string | null;
  sourceChainIds: number[];
  amountsEach: bigint[];
  nonces: number[];
  expirationTime: number;
  destinationChainId: number;
  targetAddress: string;
  nonce: number;
  error: string | null;
  signatureTransactionId?: string;
}

export function useJustPaySign() {
  const [signStatus, setSignStatus] = useState<SignStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  /**
   * 創建並簽署消息
   */
  const signMessage = async ({
    sourceChains,
    destinationChainId,
    targetAddress = "",
  }: {
    sourceChains: {
      amount: bigint;
      sourceChain: ChainToken;
    }[];
    destinationChainId: number;
    targetAddress?: string;
  }): Promise<SignResult> => {
    try {
      setError(null);
      setSignStatus("pending");
      // 檢查瀏覽器錢包是否存在
      if (!window.ethereum) {
        throw new Error("未偵測到錢包");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const ethSigner = await provider.getSigner();
      const signerAddress = await ethSigner.getAddress();

      // 如果未提供目標地址，使用簽名者地址
      const targetAddr = targetAddress || signerAddress;
      const sourceChainIds = sourceChains.map(
        (chain) => chain.sourceChain.chainId
      );

      // 將金額字符串轉換為整數（使用USDC的6位小數）
      const amountEach = sourceChains.map((chain) => {
        return chain.amount;
      });

      // 為每個來源鏈生成隨機nonce
      const nonces = sourceChains.map(() =>
        Math.floor(Math.random() * 1000000)
      );

      const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60;

      // 創建消息哈希 - 新格式: sourceChainIds, amountEach, nonces, destinationChainId, targetAddress
      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          [
            "uint256[]",
            "uint256[]",
            "uint256[]",
            "uint256",
            "uint256",
            "address",
          ],
          [
            sourceChainIds,
            amountEach,
            nonces,
            expirationTime,
            destinationChainId,
            targetAddr,
          ]
        )
      );

      console.log("messageHash:", messageHash);
      console.log("sourceChainIds:", sourceChainIds);
      console.log("amountEach:", amountEach);
      console.log("nonces:", nonces);
      console.log("expirationTime:", expirationTime);
      console.log("destinationChainId:", destinationChainId);
      console.log("targetAddr:", targetAddr);
      console.log("signerAddress:", signerAddress);

      // 簽名消息
      const signature = await ethSigner.signMessage(
        ethers.getBytes(messageHash)
      );
      console.log("簽名:", signature);

      setSignStatus("success");

      // 生成一個主nonce
      const mainNonce = Math.floor(Math.random() * 1000000);

      // 計算總金額
      const totalAmount = amountEach
        .reduce((sum, amount) => sum + amount, BigInt(0))
        .toString();

      // 在資料庫中創建簽名交易記錄
      const signatureTransaction = await createSignatureTransaction({
        userAddress: signerAddress,
        signature,
        sourceChainIds,
        amountsEach: amountEach.map((amt) => amt.toString()),
        nonces,
        expirationTime,
        destinationChainId,
        targetAddress: targetAddr,
        totalAmount,
        status: "ready",
      });

      console.log("簽名交易記錄創建成功:", signatureTransaction?.id);

      if (!signatureTransaction || !signatureTransaction.id) {
        console.error("簽名交易記錄創建失敗或返回的ID無效");
      }

      return {
        status: "success",
        signature,
        sourceChainIds,
        amountsEach: amountEach,
        nonces,
        expirationTime,
        destinationChainId,
        targetAddress: targetAddr,
        nonce: mainNonce,
        error: null,
        signatureTransactionId: signatureTransaction?.id,
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
        amountsEach: [],
        nonces: [],
        expirationTime: 0,
        destinationChainId: 0,
        targetAddress: "",
        nonce: 0,
        error: errorMessage,
      };
    }
  };
  /**
   * 調用合約的 burnProxy 方法
   */
  const executeBurnProxy = async (
    spenderAddress: string,
    amount: bigint,
    fromChainId: number,
    toChainId: number,
    signature: string,
    sourceChainIds: number[],
    amountsEach: bigint[],
    nonces: number[],
    expirationTime: number,
    destinationChainId: number,
    targetAddress: string,
    userAddress: string
  ) => {
    const fromChain = getChainTokenDataByChainId(fromChainId);
    if (!fromChain) {
      throw new Error("無效的來源鏈ID");
    }
    const toChain = getChainTokenDataByChainId(toChainId);
    if (!toChain) {
      throw new Error("無效的目標鏈ID");
    }
    const maxFee = Number(amount) * 0.01;
    // 將 maxFee 轉換為整數
    const maxFeeInt = Math.floor(maxFee);
    console.log("maxFee:", maxFee);
    return await executeProxyDepositForBurn({
      spenderAddress: spenderAddress,
      sourceChainId: fromChainId,
      burnToken: fromChain.contractAddress,
      maxFee: maxFeeInt,
      minFinalityThreshold: 500,
      expirationTime: expirationTime,
      sourceChainIds: sourceChainIds,
      amountsEach: amountsEach,
      nonces: nonces,
      destinationChainId: destinationChainId,
      targetAddress: targetAddress,
      signature: signature,
      userAddress,
    });
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
