"use server";
import { Network } from "alchemy-sdk";
import { ChainToken } from "@/models/token";

type getTokenBalanceProps = {
  walletAddress: string;
  network: Network;
  tokenContractAddress: string;
};

export async function getTotalTokenBalanceCrossChain({
  walletAddress,
  chainToken,
}: {
  walletAddress: string;
  chainToken: ChainToken[];
}) {
  const tokenBalances = await Promise.all(
    chainToken.map((chain) =>
      getTokenBalance({
        walletAddress,
        network: chain.network,
        tokenContractAddress: chain.contractAddress,
      })
    )
  );
  return tokenBalances;
}

export async function getTokenBalance({
  walletAddress,
  network,
  tokenContractAddress,
}: getTokenBalanceProps) {
  try {
    const tokenBalance = await fetch(
      `https://${network}.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "alchemy_getTokenBalances",
          params: [walletAddress, [tokenContractAddress]],
          id: 42,
        }),
      }
    );
    return await tokenBalance.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
