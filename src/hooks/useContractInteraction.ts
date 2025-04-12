import { useState } from "react";
import { ethers, FunctionFragment, Contract } from "ethers";
import { WriteContractWithOperator } from "@/app/_actions/contractAction";

import {
  ContractInteractionStatus,
  InferABIFunctionParams,
  BaseContractParams,
  WriteContractOptions,
  WriteContractResult,
} from "@/models/contract";

// 讀取操作 Hook
export function useContractRead() {
  const [status, setStatus] = useState<ContractInteractionStatus>("Idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function readContract<T extends FunctionFragment, R>(
    params: BaseContractParams,
    functionName: string,
    args: InferABIFunctionParams<T>
  ): Promise<R | null> {
    setStatus("Pending");
    setErrorMessage(null);

    try {
      if (!window.ethereum) {
        throw new Error("No wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // 如果指定了 chainId，檢查並切換網路
      if (params.chainId) {
        const currentChainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        if (currentChainId !== params.chainId) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${params.chainId.toString(16)}` }],
          });
        }
      }

      const contract = new Contract(
        params.contractAddress,
        params.contractAbi,
        provider
      );

      const result = await contract[functionName](
        ...(Array.isArray(args) ? args : [args])
      );
      setStatus("Success");
      return result as R;
    } catch (error: unknown) {
      setStatus("Failed");
      const errorMsg =
        error instanceof Error ? error.message : "Unexpected error occurred";
      setErrorMessage(errorMsg);
      return null;
    }
  }

  return {
    readContract,
    status,
    isIdle: status === "Idle",
    isPending: status === "Pending",
    isSuccess: status === "Success",
    isFailed: status === "Failed",
    errorMessage,
  };
}

// 寫入操作 Hook
export function useContractWrite() {
  const [status, setStatus] = useState<ContractInteractionStatus>("Idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function writeContract<T extends FunctionFragment>(
    params: BaseContractParams,
    functionName: string,
    args: InferABIFunctionParams<T>,
    options: WriteContractOptions = {}
  ): Promise<WriteContractResult | null> {
    const { waitForTx = false } = options;

    setStatus("Pending");
    setErrorMessage(null);

    try {
      if (!window.ethereum) {
        throw new Error("No wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      // 檢查並切換網路
      if (params.chainId) {
        const currentChainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        if (currentChainId !== params.chainId) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${params.chainId.toString(16)}` }],
          });
        }
      }

      const signer = await provider.getSigner();
      const contract = new Contract(
        params.contractAddress,
        params.contractAbi,
        signer
      );

      const tx = await contract[functionName](
        ...(Array.isArray(args) ? args : [args])
      );

      if (waitForTx) {
        const receipt = await tx.wait();
        setStatus("Success");
        return { tx, receipt };
      }

      setStatus("Success");
      return { tx };
    } catch (error: unknown) {
      setStatus("Failed");
      const errorMsg =
        error instanceof Error ? error.message : "Unexpected error occurred";
      setErrorMessage(errorMsg);
      return null;
    }
  }

  return {
    writeContract,
    status,
    isIdle: status === "Idle",
    isPending: status === "Pending",
    isSuccess: status === "Success",
    isFailed: status === "Failed",
    errorMessage,
  };
}

export function useContractWriteWithOperator() {
  const [status, setStatus] = useState<ContractInteractionStatus>("Idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function writeContractWithOperator<T extends FunctionFragment>(
    params: BaseContractParams,
    functionName: string,
    args: InferABIFunctionParams<T>
  ): Promise<string | null> {
    setStatus("Pending");
    setErrorMessage(null);
    try {
      const txHash = await WriteContractWithOperator(
        params,
        functionName,
        args
      );
      setStatus("Success");
      return txHash;
    } catch (error: unknown) {
      setStatus("Failed");
      const errorMsg =
        error instanceof Error ? error.message : "Unexpected error occurred";
      setErrorMessage(errorMsg);
      return null;
    }
  }

  return {
    writeContractWithOperator,
    status,
    isIdle: status === "Idle",
    isPending: status === "Pending",
    isSuccess: status === "Success",
    isFailed: status === "Failed",
    errorMessage,
  };
}

type AbiType =
  | "uint256"
  | "uint256[]"
  | "address"
  | "address[]"
  | "string"
  | "string[]"
  | "bool"
  | "bool[]";

type AbiValue = number | number[] | string | string[] | boolean | boolean[];

export function useContractSign() {
  const [status, setStatus] = useState<ContractInteractionStatus>("Idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signMessage(
    types: AbiType[],
    values: AbiValue[]
  ): Promise<string | null> {
    setStatus("Pending");
    setErrorMessage(null);

    try {
      if (!window.ethereum) {
        throw new Error("No wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(types, values)
      );

      const signature = await signer.signMessage(ethers.getBytes(messageHash));
      setStatus("Success");
      return signature;
    } catch (error: unknown) {
      setStatus("Failed");
      const errorMsg =
        error instanceof Error ? error.message : "Unexpected error occurred";
      setErrorMessage(errorMsg);
      return null;
    }
  }

  function reset() {
    setStatus("Idle");
    setErrorMessage(null);
  }

  return {
    signMessage,
    status,
    isIdle: status === "Idle",
    isPending: status === "Pending",
    isSuccess: status === "Success",
    isFailed: status === "Failed",
    errorMessage,
    reset,
  };
}
