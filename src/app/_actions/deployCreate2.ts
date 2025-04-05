"use server";
import { Network } from "alchemy-sdk";
import { ethers } from "ethers";
import { getChainTokenDataByChainId } from "@/models/token";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "demo";
function getNetworkRpcUrl(network: Network): string {
  switch (network) {
    case Network.ETH_SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.BASE_SEPOLIA:
      return `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.LINEA_SEPOLIA:
      return `https://linea-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.AVAX_FUJI:
      return `https://avax-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    default:
      return `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  }
}
export async function deployCreate2(signerAddress: string, chainId: number) {
  const operatorPrivateKey = process.env.PROXY_OPERATOR_PRIVATE_KEY;
  if (!operatorPrivateKey) {
    throw new Error("Operator private key not found");
  }
  const tokenChain = getChainTokenDataByChainId(chainId);
  if (!tokenChain) {
    throw new Error("Token chain not found");
  }
  const provider = new ethers.JsonRpcProvider(
    getNetworkRpcUrl(tokenChain.network)
  );
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
