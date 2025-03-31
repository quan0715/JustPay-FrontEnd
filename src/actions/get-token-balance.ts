"use server";
import { Network } from "alchemy-sdk";
type getTokenBalanceProps = {
  walletAddress: string;
  network: Network;
  tokenContractAddress: string;
};
export async function getTokenBalance({
  walletAddress,
  network,
  tokenContractAddress,
}: getTokenBalanceProps) {
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
}
