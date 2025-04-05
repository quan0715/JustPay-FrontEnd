"use server";

import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongo";
import {
  SignatureTransaction,
  CreateSignatureTransactionParams,
  UpdateSignatureTransactionParams,
  SignatureTransactionStatus,
} from "@/models/signatureTransaction";

/**
 * 獲取用戶的所有簽名交易記錄
 * @param userAddress 用戶地址
 * @returns 簽名交易記錄列表
 */
export async function getUserSignatureTransactions(
  userAddress: string
): Promise<SignatureTransaction[]> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");
    const transactions = await db
      .collection("signatureTransactions")
      .find({ userAddress })
      .sort({ createdAt: -1 })
      .toArray();

    // 安全轉換類型
    return transactions.map((doc) => ({
      id: doc._id.toString(),
      userAddress: doc.userAddress as string,
      signature: doc.signature as string,
      status: doc.status as SignatureTransactionStatus,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
      sourceChainIds: doc.sourceChainIds as number[],
      amountsEach: doc.amountsEach as string[],
      nonces: doc.nonces as number[],
      expirationTime: doc.expirationTime as number,
      destinationChainId: doc.destinationChainId as number,
      targetAddress: doc.targetAddress as string,
      transactionHashes: doc.transactionHashes as string[],
      totalAmount: doc.totalAmount as string,
      errorMessage: doc.errorMessage as string | undefined,
    }));
  } catch (error) {
    console.error("獲取用戶簽名交易記錄時發生錯誤:", error);
    return [];
  }
}

/**
 * 獲取單個簽名交易記錄
 * @param id 交易ID
 * @returns 簽名交易記錄
 */
export async function getSignatureTransaction(
  id: string
): Promise<SignatureTransaction | null> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");
    const transaction = await db.collection("signatureTransactions").findOne({
      _id: new ObjectId(id),
    });

    if (!transaction) {
      return null;
    }

    // 安全轉換類型
    return {
      id: transaction._id.toString(),
      userAddress: transaction.userAddress as string,
      signature: transaction.signature as string,
      status: transaction.status as SignatureTransactionStatus,
      createdAt: transaction.createdAt as Date,
      updatedAt: transaction.updatedAt as Date,
      sourceChainIds: transaction.sourceChainIds as number[],
      amountsEach: transaction.amountsEach as string[],
      nonces: transaction.nonces as number[],
      expirationTime: transaction.expirationTime as number,
      destinationChainId: transaction.destinationChainId as number,
      targetAddress: transaction.targetAddress as string,
      transactionHashes: transaction.transactionHashes as string[],
      totalAmount: transaction.totalAmount as string,
      errorMessage: transaction.errorMessage as string | undefined,
    };
  } catch (error) {
    console.error("獲取簽名交易記錄時發生錯誤:", error);
    return null;
  }
}

/**
 * 根據簽名查找交易記錄
 * @param signature 簽名
 * @returns 簽名交易記錄
 */
export async function findSignatureTransactionBySignature(
  signature: string
): Promise<SignatureTransaction | null> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");
    const transaction = await db.collection("signatureTransactions").findOne({
      signature,
    });

    if (!transaction) {
      return null;
    }

    // 安全轉換類型
    return {
      id: transaction._id.toString(),
      userAddress: transaction.userAddress as string,
      signature: transaction.signature as string,
      status: transaction.status as SignatureTransactionStatus,
      createdAt: transaction.createdAt as Date,
      updatedAt: transaction.updatedAt as Date,
      sourceChainIds: transaction.sourceChainIds as number[],
      amountsEach: transaction.amountsEach as string[],
      nonces: transaction.nonces as number[],
      expirationTime: transaction.expirationTime as number,
      destinationChainId: transaction.destinationChainId as number,
      targetAddress: transaction.targetAddress as string,
      transactionHashes: transaction.transactionHashes as string[],
      totalAmount: transaction.totalAmount as string,
      errorMessage: transaction.errorMessage as string | undefined,
    };
  } catch (error) {
    console.error("獲取簽名交易記錄時發生錯誤:", error);
    return null;
  }
}

/**
 * 創建新的簽名交易記錄
 * @param params 簽名交易參數
 * @returns 創建的簽名交易記錄
 */
export async function createSignatureTransaction(
  params: CreateSignatureTransactionParams
): Promise<SignatureTransaction | null> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");

    const now = new Date();
    const transaction: Omit<SignatureTransaction, "id"> & { _id?: ObjectId } = {
      userAddress: params.userAddress,
      signature: params.signature,
      status: params.status || ("created" as SignatureTransactionStatus),
      createdAt: now,
      updatedAt: now,
      sourceChainIds: params.sourceChainIds,
      amountsEach: params.amountsEach,
      nonces: params.nonces,
      expirationTime: params.expirationTime,
      destinationChainId: params.destinationChainId,
      targetAddress: params.targetAddress,
      transactionHashes: [],
      totalAmount: params.totalAmount,
      errorMessage: params.errorMessage,
    };

    const result = await db
      .collection("signatureTransactions")
      .insertOne(transaction);

    if (!result.acknowledged) {
      throw new Error("創建簽名交易記錄失敗");
    }

    return {
      ...transaction,
      id: result.insertedId.toString(),
    } as SignatureTransaction;
  } catch (error) {
    console.error("創建簽名交易記錄時發生錯誤:", error);
    return null;
  }
}

/**
 * 更新簽名交易狀態
 * @param id 交易ID
 * @param params 更新參數
 * @returns 更新後的簽名交易記錄
 */
export async function updateSignatureTransaction(
  id: string,
  params: UpdateSignatureTransactionParams
): Promise<SignatureTransaction | null> {
  try {
    const client = await clientPromise;
    const db = client.db("transactions");

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (params.status) updateData.status = params.status;
    if (params.errorMessage) updateData.errorMessage = params.errorMessage;

    const transaction = await getSignatureTransaction(id);
    if (!transaction) {
      return null;
    }

    // 如果提供了新的交易哈希，將其添加到交易哈希陣列中
    if (params.transactionHash) {
      const existingHashes = transaction.transactionHashes || [];
      if (!existingHashes.includes(params.transactionHash)) {
        updateData.transactionHashes = [
          ...existingHashes,
          params.transactionHash,
        ];
      }
    }

    const result = await db
      .collection("signatureTransactions")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );

    if (!result) {
      return null;
    }

    // 安全轉換為SignatureTransaction類型
    return {
      id: result._id.toString(),
      userAddress: result.userAddress as string,
      signature: result.signature as string,
      status: result.status as SignatureTransactionStatus,
      createdAt: result.createdAt as Date,
      updatedAt: result.updatedAt as Date,
      sourceChainIds: result.sourceChainIds as number[],
      amountsEach: result.amountsEach as string[],
      nonces: result.nonces as number[],
      expirationTime: result.expirationTime as number,
      destinationChainId: result.destinationChainId as number,
      targetAddress: result.targetAddress as string,
      transactionHashes: result.transactionHashes as string[],
      totalAmount: result.totalAmount as string,
      errorMessage: result.errorMessage as string | undefined,
    };
  } catch (error) {
    console.error("更新簽名交易狀態時發生錯誤:", error);
    return null;
  }
}

/**
 * 添加交易哈希到簽名交易記錄
 * @param signature 簽名
 * @param transactionHash 交易哈希
 * @returns 更新後的簽名交易記錄
 */
export async function addTransactionHashToSignature(
  signature: string,
  transactionHash: string
): Promise<SignatureTransaction | null> {
  try {
    const transaction = await findSignatureTransactionBySignature(signature);
    if (!transaction) {
      console.error("未找到簽名交易記錄:", signature);
      return null;
    }

    // 更新狀態為處理中
    return updateSignatureTransaction(transaction.id, {
      transactionHash,
      status: "processing" as SignatureTransactionStatus,
    });
  } catch (error) {
    console.error("添加交易哈希到簽名交易記錄時發生錯誤:", error);
    return null;
  }
}
