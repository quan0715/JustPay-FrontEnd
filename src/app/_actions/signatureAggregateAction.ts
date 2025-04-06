"use server";

import { getSignatureTransaction } from "./signatureTransactionAction";
import { getUserTransactionLogs } from "./transactionLogAction";
import { SignatureTransaction } from "@/models/signatureTransaction";
import { TransactionLog } from "@/models/transactionLog";

// 聚合數據結構
export interface AggregatedSignatureData {
  signature: SignatureTransaction;
  transactions: TransactionLog[];
  summary: {
    totalTransactions: number;
    completedTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    sourceChains: string[];
    destinationChain: number;
    totalAmount: string;
  };
}

/**
 * 根據簽名ID獲取聚合數據
 * @param signatureId 簽名交易ID
 * @returns 聚合的簽名和交易數據
 */
export async function getAggregatedSignatureData(
  signatureId: string
): Promise<AggregatedSignatureData | null> {
  try {
    // 獲取簽名交易記錄
    const signatureTransaction = await getSignatureTransaction(signatureId);

    if (!signatureTransaction) {
      console.error(`Signature transaction not found with ID: ${signatureId}`);
      return null;
    }

    // 獲取用戶的所有交易記錄
    const allTransactions = await getUserTransactionLogs(
      signatureTransaction.userAddress
    );

    // 過濾出與當前簽名相關的交易記錄
    const relatedTransactions = allTransactions.filter((transaction) =>
      signatureTransaction.transactionHashes.includes(transaction.txHash || "")
    );

    // 聚合數據
    const aggregatedData: AggregatedSignatureData = {
      signature: signatureTransaction,
      transactions: relatedTransactions,
      summary: {
        totalTransactions: relatedTransactions.length,
        completedTransactions: relatedTransactions.filter(
          (tx) => tx.status === "completed"
        ).length,
        pendingTransactions: relatedTransactions.filter(
          (tx) => tx.status === "ready"
        ).length,
        failedTransactions: relatedTransactions.filter(
          (tx) => tx.status === "failed"
        ).length,
        sourceChains: [
          ...new Set(relatedTransactions.map((tx) => tx.sourceChain.name)),
        ],
        destinationChain: signatureTransaction.destinationChainId,
        totalAmount: signatureTransaction.totalAmount,
      },
    };

    return aggregatedData;
  } catch (error) {
    console.error("Error aggregating signature data:", error);
    return null;
  }
}

/**
 * 根據簽名查找聚合數據
 * @param signature 簽名字符串
 * @returns 聚合的簽名和交易數據
 */
export async function getAggregatedSignatureDataBySignature(
  signature: string
): Promise<AggregatedSignatureData | null> {
  try {
    // 獲取所有用戶的簽名交易
    const client = await import("@/lib/mongo").then((m) => m.default);
    const db = (await client).db("transactions");
    const transaction = await db.collection("signatureTransactions").findOne({
      signature,
    });

    if (!transaction) {
      console.error(
        `Signature transaction not found with signature: ${signature}`
      );
      return null;
    }

    // 使用ID獲取完整聚合數據
    return getAggregatedSignatureData(transaction._id.toString());
  } catch (error) {
    console.error("Error finding signature data by signature:", error);
    return null;
  }
}
