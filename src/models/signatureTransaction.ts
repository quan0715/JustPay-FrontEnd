// 簽名交易記錄模型，用於追蹤簽名及其相關交易

// 簽名交易狀態
export type SignatureTransactionStatus =
  | "failed" // 交易失敗，不會有其他動作
  | "ready" // 所有相關交易都準備好了，可以開始轉帳
  | "completed"; // 交易已完成，之後不會再用到

// 簽名交易記錄模型
export interface SignatureTransaction {
  id: string; // 唯一ID
  userAddress: string; // 用戶地址
  signature: string; // 簽名數據
  status: SignatureTransactionStatus; // 交易狀態
  createdAt: Date; // 創建時間
  updatedAt: Date; // 更新時間

  // 簽名相關參數
  sourceChainIds: number[]; // 來源鏈ID陣列
  amountsEach: string[]; // 每個鏈的金額陣列
  nonces: number[]; // nonce陣列
  expirationTime: number; // 過期時間
  destinationChainId: number; // 目標鏈ID
  targetAddress: string; // 目標地址

  // 關聯交易
  transactionHashes: string[]; // 關聯的交易哈希陣列
  totalAmount: string; // 總金額

  // 錯誤信息
  errorMessage?: string; // 錯誤信息
}

// 創建簽名交易記錄參數
export interface CreateSignatureTransactionParams {
  userAddress: string; // 用戶地址
  signature: string; // 簽名數據
  sourceChainIds: number[]; // 來源鏈ID陣列
  amountsEach: string[]; // 每個鏈的金額陣列
  nonces: number[]; // nonce陣列
  expirationTime: number; // 過期時間
  destinationChainId: number; // 目標鏈ID
  targetAddress: string; // 目標地址
  totalAmount: string; // 總金額
  status?: SignatureTransactionStatus; // 交易狀態
  errorMessage?: string; // 錯誤信息
}

// 更新簽名交易記錄參數
export interface UpdateSignatureTransactionParams {
  status?: SignatureTransactionStatus; // 交易狀態
  transactionHash?: string; // 新增交易哈希
  errorMessage?: string; // 錯誤信息
}
