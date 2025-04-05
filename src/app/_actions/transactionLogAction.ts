"use server";

import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongo";
import {
  TransactionLog,
  CreateTransactionLogParams,
  UpdateTransactionLogParams,
  TransactionStatus,
} from "@/models/transactionLog";
import { getTransactionStatus } from "@/lib/circleApi";
import { getChainTokenDataByChainId } from "@/models/token";
import { mapCircleStatusToTransactionStatus } from "@/models/transactionLog";
/**
 * 獲取用戶的所有交易記錄
 * @param userAddress 用戶地址
 * @returns 交易記錄列表
 */
export async function getUserTransactionLogs(
  userAddress: string
): Promise<TransactionLog[]> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");
    const transactions = await db
      .collection("transactionLogs")
      .find({ userAddress })
      .sort({ createdAt: -1 })
      .toArray();

    // 安全轉換類型
    return transactions.map((doc) => ({
      id: doc._id.toString(),
      userAddress: doc.userAddress as string,
      txHash: doc.txHash as string | undefined,
      status: doc.status as TransactionStatus,
      type: doc.type as "deposit" | "transfer" | "withdraw",
      sourceChain: doc.sourceChain as { id: number; name: string },
      destinationChain: doc.destinationChain as { id: number; name: string },
      amount: doc.amount as string,
      recipientAddress: doc.recipientAddress as string,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
      message: doc.message as string,
      attestation: doc.attestation as string,
      errorMessage: doc.errorMessage as string | undefined,
    }));
  } catch (error) {
    console.error("獲取用戶交易記錄時發生錯誤:", error);
    return [];
  }
}

/**
 * 獲取單個交易記錄
 * @param id 交易ID
 * @returns 交易記錄
 */

export async function syncAllUnCompletedTransactionLogs(
  userAddress: string
): Promise<void> {
  const transactionLogs = await getUserTransactionLogs(userAddress);
  for (const transactionLog of transactionLogs) {
    if (transactionLog.status !== "completed") {
      await syncTransactionLog(transactionLog.id);
    }
  }
}

export async function syncTransactionLog(
  id: string
): Promise<TransactionLog | null> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");
    const transaction = await db.collection("transactionLogs").findOne({
      _id: new ObjectId(id),
    });

    if (!transaction) {
      return null;
    }

    // 安全轉換類型
    const transactionLog: TransactionLog = {
      id: transaction._id.toString(),
      userAddress: transaction.userAddress as string,
      txHash: transaction.txHash as string | undefined,
      status: transaction.status as TransactionStatus,
      type: transaction.type as "deposit" | "transfer" | "withdraw",
      sourceChain: transaction.sourceChain as { id: number; name: string },
      destinationChain: transaction.destinationChain as {
        id: number;
        name: string;
      },
      amount: transaction.amount as string,
      recipientAddress: transaction.recipientAddress as string,
      createdAt: transaction.createdAt as Date,
      updatedAt: transaction.updatedAt as Date,
      message: transaction.message as string,
      attestation: transaction.attestation as string,
      errorMessage: transaction.errorMessage as string | undefined,
    };
    console.log("transactionLog:", transactionLog);

    // 如果有 circleId，檢查 Circle API 的最新狀態並更新
    if (transactionLog.txHash) {
      const chainToken = getChainTokenDataByChainId(
        transactionLog.sourceChain.id
      );
      console.log("chainToken:", chainToken);
      if (!chainToken) {
        console.error("找不到鏈ID對應的CCTVDomain");
        return transactionLog;
      }
      const circleStatus = await getTransactionStatus(
        chainToken.CCTVDomain,
        transactionLog.txHash
      );
      if (circleStatus && circleStatus.status !== "pending") {
        // 更新本地數據庫中的交易狀態
        const updatedTransaction = await updateTransactionStatus(
          transactionLog.id,
          {
            status: mapCircleStatusToTransactionStatus(circleStatus.status),
            attestation: circleStatus.attestation,
            message: circleStatus.message,
          }
        );
        return updatedTransaction;
      }
    }

    return transactionLog;
  } catch (error) {
    console.error("獲取交易記錄時發生錯誤:", error);
    return null;
  }
}

/**
 * 創建新的交易記錄
 * @param params 交易參數
 * @returns 創建的交易記錄
 */
export async function createTransactionLog(
  params: CreateTransactionLogParams
): Promise<TransactionLog | null> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");

    const now = new Date();
    const transaction: Omit<TransactionLog, "id"> & { _id?: ObjectId } = {
      userAddress: params.userAddress,
      txHash: params.txHash,
      status: params.status || "pending",
      type: params.type,
      sourceChain: params.sourceChain,
      destinationChain: params.destinationChain,
      amount: params.amount,
      recipientAddress: params.recipientAddress,
      message: "",
      attestation: "",
      createdAt: now,
      updatedAt: now,
      errorMessage: params.errorMessage,
    };

    const result = await db
      .collection("transactionLogs")
      .insertOne(transaction);

    if (!result.acknowledged) {
      throw new Error("創建交易記錄失敗");
    }

    return {
      ...transaction,
      id: result.insertedId.toString(),
    } as TransactionLog;
  } catch (error) {
    console.error("創建交易記錄時發生錯誤:", error);
    return null;
  }
}

/**
 * 更新交易狀態
 * @param id 交易ID
 * @param params 更新參數
 * @returns 更新後的交易記錄
 */
export async function updateTransactionStatus(
  id: string,
  params: UpdateTransactionLogParams
): Promise<TransactionLog | null> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (params.status) updateData.status = params.status;
    if (params.txHash) updateData.txHash = params.txHash;
    if (params.attestation) updateData.attestation = params.attestation;
    if (params.message) updateData.message = params.message;

    const result = await db
      .collection("transactionLogs")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );

    if (!result) {
      return null;
    }

    // 安全轉換為TransactionLog類型
    return {
      id: result._id.toString(),
      userAddress: result.userAddress as string,
      txHash: result.txHash as string | undefined,
      status: result.status as TransactionStatus,
      type: result.type as "deposit" | "transfer" | "withdraw",
      sourceChain: result.sourceChain as { id: number; name: string },
      destinationChain: result.destinationChain as { id: number; name: string },
      amount: result.amount as string,
      recipientAddress: result.recipientAddress as string,
      message: result.message as string,
      attestation: result.attestation as string,
      createdAt: result.createdAt as Date,
      updatedAt: result.updatedAt as Date,
      errorMessage: result.errorMessage as string | undefined,
    };
  } catch (error) {
    console.error("更新交易狀態時發生錯誤:", error);
    return null;
  }
}

/**
 * 定期更新待處理交易的狀態
 * 這個函數可以被一個API路由調用，或作為定時任務運行
 */
export async function updatePendingTransactions(): Promise<number> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");

    // 找出所有待處理或處理中的交易
    const pendingTransactions = await db
      .collection("transactionLogs")
      .find({
        status: { $in: ["pending", "processing"] },
      })
      .toArray();

    let updatedCount = 0;

    // 檢查每筆交易的Circle API狀態，為了遵守API限制，每次請求之間添加延遲
    for (const tx of pendingTransactions) {
      console.log("tx:", tx);
      // 如果有太多交易，確保我們不會一次性發送太多請求
      if (updatedCount > 0) {
        // 添加一個小延遲確保不超過每秒10次的限制
        // 這裡使用120毫秒的延遲，可以讓我們安全地處理每秒約8次請求
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      const domain = getChainTokenDataByChainId(tx.sourceChain.id)?.CCTVDomain;
      if (!domain) {
        console.error("找不到鏈ID對應的CCTVDomain");
        continue;
      }

      const circleStatus = await getTransactionStatus(
        domain,
        tx.txHash as string
      );
      if (!circleStatus) continue;

      // 如果狀態不是pending，則更新本地記錄
      if (circleStatus.status !== "pending") {
        const status = mapCircleStatusToTransactionStatus(circleStatus.status);

        await db.collection("transactionLogs").updateOne(
          { _id: tx._id },
          {
            $set: {
              status,
              attestation: circleStatus.attestation,
              message: circleStatus.message,
              txHash: tx.txHash,
            },
          }
        );

        updatedCount++;
      }
    }

    return updatedCount;
  } catch (error) {
    console.error("更新待處理交易時發生錯誤:", error);
    return 0;
  }
}
