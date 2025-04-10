"use server";
import { ethers } from "ethers";
import { getUSDCMetadata } from "@/models/token";
import { getNetworkRpcUrl } from "@/lib/alchemy";

export async function deployCreate2(signerAddress: string, chainId: number) {
  const operatorPrivateKey = process.env.PROXY_OPERATOR_PRIVATE_KEY;
  if (!operatorPrivateKey) {
    throw new Error("Operator private key not found");
  }
  const tokenMetadata = getUSDCMetadata(chainId);
  if (!tokenMetadata) {
    throw new Error("Token metadata not found");
  }
  const provider = new ethers.JsonRpcProvider(getNetworkRpcUrl(chainId));
  const signer = new ethers.Wallet(operatorPrivateKey, provider);
  const WritABI = [
    "function deploy(uint256 _salt_int, address signer, address operator) returns (address)",
  ];
  const contract = new ethers.Contract(
    "0x28d8501cFFA0C88D35A79a728428e8d82C748Bb0",
    WritABI,
    signer
  );
  const tx = await contract.deploy(0, signerAddress, signer.address);
  // listen to the transaction event emit
  await tx.wait();
  console.log("tx:", tx);
  return tx.hash;
}
