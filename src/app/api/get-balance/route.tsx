import { Alchemy, Network } from "alchemy-sdk";
import { NextResponse } from "next/server";
const networks: Record<string, Network> = {
  ETH_SEPOLIA: Network.ETH_SEPOLIA,
  BASE_SEPOLIA: Network.BASE_SEPOLIA,
  LINEA_SEPOLIA: Network.LINEA_SEPOLIA,
};
export async function POST(request: Request) {
  const { walletAddress, network, tokenContractAddress } = await request.json();
  console.log(walletAddress, network, tokenContractAddress);
  if (!networks[network]) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: networks[network],
  };

  const alchemy = new Alchemy(config);

  const balance = await alchemy.core.getTokenBalances(walletAddress, [
    tokenContractAddress,
  ]);
  console.log(balance);

  return NextResponse.json({
    balance: balance.tokenBalances[0].tokenBalance,
  });
}
