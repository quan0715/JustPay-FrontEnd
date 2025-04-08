"use server";

import { ethers } from "ethers";
import { Network } from "alchemy-sdk";
import { getChainTokenDataByChainId } from "@/models/token";
import { createTransactionLog } from "@/app/_actions/transactionLogAction";
import {
  addTransactionHashToSignature,
  updateSignatureTransaction,
  findSignatureTransactionBySignature,
} from "@/app/_actions/signatureTransactionAction";

const OPERATOR_PRIVATE_KEY = process.env.PROXY_OPERATOR_PRIVATE_KEY;
// const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_JUSTPAY_SPENDER_ADDRESS;

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
// 合約 ABI
const contractAbi = [
  {
    name: "proxyDepositForBurn",
    type: "function",
    inputs: [
      { name: "burnToken", type: "address" },
      { name: "maxFee", type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
      { name: "sourceChainIds", type: "uint256[]" },
      { name: "amountEach", type: "uint256[]" },
      { name: "nonces", type: "uint256[]" },
      { name: "expirey", type: "uint256" },
      { name: "destinationChainId", type: "uint256" },
      { name: "targetAddress", type: "address" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

type ExecuteProxyDepositForBurnProps = {
  spenderAddress: string;
  sourceChainId: number;
  burnToken: string;
  maxFee: number;
  minFinalityThreshold: number;
  expirationTime: number;
  sourceChainIds: number[];
  amountsEach: bigint[];
  nonces: number[];
  destinationChainId: number;
  targetAddress: string;
  signature: string;
  userAddress: string;
};

type BurnProxyResult = {
  status: "success" | "error";
  transactionHash?: string;
  message: string;
  transactionLogId?: string;
  circleId?: string;
};

export async function executeProxyDepositForBurn({
  spenderAddress,
  sourceChainId,
  burnToken,
  maxFee = 100,
  minFinalityThreshold = 500,
  expirationTime,
  sourceChainIds,
  amountsEach,
  nonces,
  destinationChainId,
  targetAddress,
  signature,
  userAddress,
}: ExecuteProxyDepositForBurnProps): Promise<BurnProxyResult> {
  // 確保所需的環境變數存在
  if (!OPERATOR_PRIVATE_KEY || !ALCHEMY_API_KEY) {
    throw new Error("缺少必要的環境變數");
  }

  // 確保簽名結果有效
  if (!signature) {
    throw new Error("無效的簽名結果");
  }

  // 獲取來源鏈和目標鏈的名稱
  const sourceChain = getChainTokenDataByChainId(sourceChainId);
  const destinationChain = getChainTokenDataByChainId(destinationChainId);

  if (!sourceChain || !destinationChain) {
    throw new Error("無效的鏈ID");
  }

  // 查找簽名對應的交易記錄
  const signatureTransaction = await findSignatureTransactionBySignature(
    signature
  );

  // 為追蹤交易準備變數
  let transactionLog = null;
  let circleId: string | undefined;

  try {
    // 建立provider和wallet
    const network = sourceChain.network;
    const provider = new ethers.JsonRpcProvider(getNetworkRpcUrl(network));
    const operator = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

    // 計算總金額 (所有鏈上的金額總和)
    const totalAmount = amountsEach.reduce(
      (sum, amount) => sum + amount,
      BigInt(0)
    );
    const totalAmountString = totalAmount.toString();

    // 建立合約實例
    console.log("spenderAddress:", spenderAddress);
    const contract = new ethers.Contract(spenderAddress, contractAbi, operator);

    console.log("ready to call proxyDepositForBurn contract...");
    console.log("Operator address:", operator.address);
    console.log("contract address:", spenderAddress);
    console.log("burn token address:", burnToken);
    console.log("max fee:", maxFee);
    console.log("min finality threshold:", minFinalityThreshold);
    console.log("source chain IDs:", sourceChainIds);
    console.log("amountsEach:", amountsEach);
    console.log("nonces:", nonces);
    console.log("destination chain ID:", destinationChainId);
    console.log("target address:", targetAddress);
    console.log("signature:", signature);
    console.log("expirationTime:", expirationTime);
    // estimate gas

    const tx = await contract.proxyDepositForBurn(
      burnToken,
      maxFee,
      minFinalityThreshold,
      sourceChainIds,
      amountsEach,
      nonces,
      expirationTime,
      destinationChainId,
      targetAddress,
      signature
    );

    console.log("交易已發送, 等待確認:", tx.hash);

    // 如果存在簽名交易記錄，就更新它的狀態並關聯交易哈希
    if (signatureTransaction) {
      await addTransactionHashToSignature(signature, tx.hash);
      console.log("已將交易哈希添加到簽名記錄");
    }

    // 創建傳統的交易記錄
    transactionLog = await createTransactionLog({
      userAddress,
      type: "transfer",
      sourceChain: {
        id: sourceChainId,
        name: sourceChain.network.toString(),
      },
      destinationChain: {
        id: destinationChainId,
        name: destinationChain.network.toString(),
      },
      amount: totalAmountString,
      recipientAddress: targetAddress,
      status: "pending",
      txHash: tx.hash,
      signature: signature,
    });

    // 等待交易確認
    const receipt = await tx.wait();
    console.log("交易已確認，交易收據:", receipt);

    // 更新簽名交易記錄狀態為已完成
    if (signatureTransaction) {
      await (signatureTransaction.id,
      {
        status: "completed",
      });
      console.log("已更新簽名交易記錄狀態為已完成");
    }

    return {
      status: "success",
      transactionHash: tx.hash,
      message: "代理存款燃燒交易已成功完成",
      transactionLogId: transactionLog?.id,
      circleId,
    };
  } catch (error: unknown) {
    console.error("執行proxyDepositForBurn失敗:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "reason" in error
        ? String((error as { reason?: string }).reason)
        : "未知錯誤";

    // 如果存在簽名交易記錄，就更新它的狀態為失敗
    if (signatureTransaction) {
      await updateSignatureTransaction(signatureTransaction.id, {
        status: "failed",
        errorMessage,
      });
      console.log("已更新簽名交易記錄狀態為失敗");
    }

    return {
      status: "error",
      message: `執行失敗: ${errorMessage}`,
      transactionLogId: transactionLog?.id,
      circleId,
    };
  }
}
