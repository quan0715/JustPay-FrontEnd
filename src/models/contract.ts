import {
  FunctionFragment,
  Interface,
  InterfaceAbi,
  TransactionResponse,
  TransactionReceipt,
} from "ethers";

type ContractInteractionStatus = "Pending" | "Success" | "Failed" | "Idle";

type ABIParameter = {
  name: string;
  type: string;
};

// 將 Solidity 類型映射到 TypeScript 類型
type SolidityTypeMapping = {
  address: string;
  uint256: bigint;
  uint: bigint;
  bool: boolean;
  string: string;
  bytes: string;
  bytes32: string;
  "address[]": string[];
  "uint256[]": bigint[];
};

// 從 ABI 函數片段推導參數類型
type InferABIFunctionParams<T extends FunctionFragment> = {
  [K in keyof T["inputs"]]: T["inputs"][K] extends ABIParameter
    ? T["inputs"][K]["type"] extends keyof SolidityTypeMapping
      ? SolidityTypeMapping[T["inputs"][K]["type"]]
      : unknown
    : unknown;
};

interface BaseContractParams {
  contractAddress: string;
  contractAbi: InterfaceAbi | Interface;
  chainId?: number;
}

interface BaseContractParams {
  contractAddress: string;
  contractAbi: InterfaceAbi | Interface;
  chainId?: number;
}

// 寫入操作的選項
interface WriteContractOptions {
  waitForTx?: boolean;
}

// 寫入操作的結果
interface WriteContractResult {
  tx: TransactionResponse;
  receipt?: TransactionReceipt;
}

export type {
  ContractInteractionStatus,
  ABIParameter,
  SolidityTypeMapping,
  InferABIFunctionParams,
  BaseContractParams,
  WriteContractOptions,
  WriteContractResult,
};
