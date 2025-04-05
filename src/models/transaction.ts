import { ChainToken } from "./token";
export type SignProxyOffChainTransaction = {
  amount: string;
  sourceChain: ChainToken[];
  senderAddress: string;
  recipientAddress: string;
  destinationChain: ChainToken;
};
export type BurnProxyTransaction = {
  amount: string;
  sourceChain: ChainToken[];
  destinationDomain: number;
  mintRecipient: string;
  burnToken: string;
  destinationCaller: string;
  maxFee: number;
  minFinalityThreshold: number;
};

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

// 簽名結果交易
export type SignedTransaction = {
  sourceChainIds: number[];
  amountsEach: string[];
  nonces: number[];
  destinationChainId: number;
  targetAddress: string;
  signature: string;
};
