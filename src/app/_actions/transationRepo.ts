"use server";
import {
  USDCTransferTransactionModel,
  TokenTransferLog,
} from "@/models/transaction";
import { ObjectId } from "mongodb";
import { USDCTransferTransactionMetaData } from "@/models/transaction";
import clientPromise from "@/lib/mongo";
const COLLECTION_NAME = "transactions";
const DB_NAME = "signature";

export async function createSignatureTransaction(params: {
  signature: string;
  metaData: USDCTransferTransactionMetaData;
}): Promise<USDCTransferTransactionModel | null> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const {
      sourceChainIds,
      amountsEach,
      destinationChainId,
      recipientAddress,
      expirationTime,
    } = params.metaData;

    if (expirationTime < Math.floor(Date.now() / 1000)) {
      throw new Error("過期時間已過");
    }

    const expectedProxyDepositForBurnTransactions: TokenTransferLog[] = [];

    for (let i = 0; i < sourceChainIds.length; i++) {
      const isSameChain = sourceChainIds[i] === destinationChainId;
      expectedProxyDepositForBurnTransactions.push({
        sourceChainId: sourceChainIds[i],
        amount: amountsEach[i],
        txHash: "",
        status: isSameChain ? "ready" : "draft",
        recipientAddress: recipientAddress,
        transactionType: isSameChain ? "erc20Transfer" : "proxyDepositForBurn",
      });
    }

    const transaction: Omit<USDCTransferTransactionModel, "id"> & {
      _id?: ObjectId;
    } = {
      status: "signed",
      signature: params.signature,
      metaData: params.metaData,
      tokenTransferLogs: expectedProxyDepositForBurnTransactions,
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(transaction);

    if (!result.acknowledged) {
      throw new Error("創建簽名交易記錄失敗");
    }

    const data = await getSignatureTransaction({
      id: result.insertedId.toString(),
    });

    return data;
  } catch (error) {
    console.error("創建簽名交易記錄時發生錯誤:", error);
    return null;
  }
}

export async function updateTransaction(params: {
  id: string;
  update: Partial<USDCTransferTransactionModel>;
}): Promise<USDCTransferTransactionModel | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const transaction = await db.collection(COLLECTION_NAME).findOne({
    _id: new ObjectId(params.id),
  });

  if (!transaction) {
    throw new Error("找不到簽名交易記錄");
  }

  await db
    .collection(COLLECTION_NAME)
    .updateOne({ _id: new ObjectId(params.id) }, { $set: params.update });

  return await getSignatureTransaction({
    id: params.id,
  });
}

export async function updateTransactionLog(params: {
  id: string;
  index: number;
  update: Partial<TokenTransferLog>;
}): Promise<USDCTransferTransactionModel | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const transaction = await db.collection(COLLECTION_NAME).findOne({
    _id: new ObjectId(params.id),
  });

  if (!transaction) {
    throw new Error("找不到簽名交易記錄");
  }

  transaction.tokenTransferLogs[params.index] = params.update;

  await db
    .collection(COLLECTION_NAME)
    .updateOne({ _id: new ObjectId(params.id) }, { $set: transaction });

  return await getSignatureTransaction({
    id: params.id,
  });
}

export async function getSignatureTransaction(params: {
  id: string;
}): Promise<USDCTransferTransactionModel | null> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const transaction = await db.collection(COLLECTION_NAME).findOne({
      _id: new ObjectId(params.id),
    });

    if (!transaction) {
      throw new Error("找不到簽名交易記錄");
    }

    return {
      status: transaction.status,
      signature: transaction.signature,
      metaData: transaction.metaData,
      tokenTransferLogs: transaction.tokenTransferLogs,
      id: transaction._id.toString(),
    } as USDCTransferTransactionModel;
  } catch (error) {
    console.error("獲取簽名交易記錄時發生錯誤:", error);
    return null;
  }
}
