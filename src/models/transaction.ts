// 新的代理存款燃燒交易模型
export type ProxyDepositForBurnTransaction = {
  burnToken: string; // 代幣地址
  maxFee: number; // 最大費用
  minFinalityThreshold: number; // 最小終結閾值
  sourceChainIds: number[]; // 來源鏈ID陣列
  amountsEach: string[]; // 每個鏈的金額陣列
  nonces: number[]; // nonce陣列
  destinationChainId: number; // 目標鏈ID
  targetAddress: string; // 目標地址
  signature: string; // 簽名
};

export type USDCTransferTransactionMetaDataInput = {
  senderAddress: string;
  expectedProxyDepositForBurnTransactions: ExpectedProxyDepositForBurnTransaction[];
  destinationChainId: number;
  recipientAddress: string;
};

export type MessageSignature = {
  sourceChainIds: number[];
  amountsEach: string[];
  nonces: number[];
  expirationTime: number;
  destinationChainId: number;
  recipientAddress: string;
};

export type USDCTransferTransactionMetaData = {
  senderAddress: string;
  spenderAddress: string;
} & MessageSignature;

export type ExpectedProxyDepositForBurnTransaction = {
  sourceChainId: number;
  amount: string;
};

export type TransferStatus = "draft" | "pending" | "ready" | "expired" | "done";

export type TransactionType = "proxyDepositForBurn" | "erc20Transfer";

export type TokenTransferLog = {
  sourceChainId: number;
  amount: string;
  recipientAddress: string;
  txHash: string;
  transactionType: TransactionType;
  status: TransferStatus;
};

export type USDCTransferTransactionEntity = {
  signature: string;
  metaData: USDCTransferTransactionMetaData;
  tokenTransferLogs?: TokenTransferLog[];
};

export type USDCTransferTransactionModel = {
  id: string;
  status: "signed" | "pending" | "expired" | "done" | "failed";
} & USDCTransferTransactionEntity;
