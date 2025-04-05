// 交易日誌模型
import { CircleTransactionStatus } from "@/lib/circleApi";

// 交易狀態
export type TransactionStatus =
  | "pending" // 等待中
  | "ready" // 已準備
  | "completed" // 已完成
  | "failed" // 失敗
  | "unknown"; // 未知狀態

// 交易類型
export type TransactionType = "deposit" | "transfer" | "withdraw";

// 交易日誌模型
export interface TransactionLog {
  id: string; // 唯一ID
  userAddress: string; // 用戶地址
  txHash?: string; // 區塊鏈交易哈希
  status: TransactionStatus; // 交易狀態
  type: TransactionType; // 交易類型
  sourceChain: {
    // 來源鏈信息
    id: number;
    name: string;
  };
  destinationChain: {
    // 目標鏈信息
    id: number;
    name: string;
  };
  message: string; // 交易消息
  attestation: string; // 交易證明
  amount: string; // 交易金額
  recipientAddress: string; // 接收地址
  createdAt: Date; // 創建時間
  updatedAt: Date; // 更新時間
  errorMessage?: string; // 錯誤信息
}

// 創建交易參數
export interface CreateTransactionLogParams {
  userAddress: string;
  txHash?: string;
  circleId?: string;
  type: TransactionType;
  sourceChain: {
    id: number;
    name: string;
  };
  destinationChain: {
    id: number;
    name: string;
  };
  amount: string;
  recipientAddress: string;
  status?: TransactionStatus;
  errorMessage?: string;
  signature?: string;
}

// 更新交易參數
export interface UpdateTransactionLogParams {
  txHash?: string;
  attestation?: string;
  message?: string;
  status?: TransactionStatus;
}

// 將 Circle API 狀態映射到交易日誌狀態
export function mapCircleStatusToTransactionStatus(
  circleStatus: CircleTransactionStatus
): TransactionStatus {
  switch (circleStatus) {
    case "pending":
      return "pending";
    case "complete":
      return "ready";
    case "failed":
      return "failed";
    case "confirmed":
      return "completed";
    default:
      return "unknown";
  }
}
