"use server";
import { ethers, FunctionFragment, Contract } from "ethers";
import { getNetworkRpcUrl } from "@/lib/alchemy";
import { BaseContractParams, InferABIFunctionParams } from "@/models/contract";

async function ReadContract<T extends FunctionFragment>(
  params: BaseContractParams,
  functionName: string,
  args?: InferABIFunctionParams<T>
): Promise<string | null> {
  if (!params.chainId) {
    throw new Error("Chain ID not found");
  }
  const provider = new ethers.JsonRpcProvider(getNetworkRpcUrl(params.chainId));
  if (!provider) {
    throw new Error("Provider not found");
  }
  const contract = new Contract(
    params.contractAddress,
    params.contractAbi,
    provider
  );
  try {
    if (!args) {
      const result = await contract[functionName]();
      return result;
    }
    const result = await contract[functionName](
      ...(Array.isArray(args) ? args : [args])
    );
    console.log(
      `${params.chainId} ${params.contractAddress} ${functionName}`,
      result
    );
    return result;
  } catch (error) {
    throw new Error(
      `Error reading contract ${params.chainId} ${params.contractAddress} ${functionName}`,
      { cause: error }
    );
  }
}

async function WriteContractWithOperator<T extends FunctionFragment>(
  params: BaseContractParams,
  functionName: string,
  args: InferABIFunctionParams<T>
): Promise<string | null> {
  const operatorPrivateKey = process.env.PROXY_OPERATOR_PRIVATE_KEY;
  if (!operatorPrivateKey) {
    throw new Error("Operator private key not found");
  }
  if (!params.chainId) {
    throw new Error("Chain ID not found");
  }
  const provider = new ethers.JsonRpcProvider(getNetworkRpcUrl(params.chainId));
  if (!provider) {
    throw new Error("Provider not found");
  }

  const signer = new ethers.Wallet(operatorPrivateKey, provider);

  const contract = new Contract(
    params.contractAddress,
    params.contractAbi,
    signer
  );

  // log all args
  console.log(functionName, args);

  try {
    const tx = await contract[functionName](
      ...(Array.isArray(args) ? args : [args])
    );

    return tx.hash;
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Unexpected error occurred";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export { ReadContract, WriteContractWithOperator };
