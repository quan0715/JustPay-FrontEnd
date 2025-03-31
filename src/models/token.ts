import { Network } from "alchemy-sdk";

export type Token = {
  name: string;
  symbol: string;
  decimals: number;
  image?: string;
};

export type ChainToken = {
  // different networks have different contract addresses
  token: Token;
  contractAddress: string;
  network: Network;
};

export const USDC: Token = {
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
};

export const EthSepoliaToken: ChainToken = {
  token: USDC,
  contractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  network: Network.ETH_SEPOLIA,
};

export const BaseSepoliaToken: ChainToken = {
  token: USDC,
  contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  network: Network.BASE_SEPOLIA,
};

export const LineaSepoliaToken: ChainToken = {
  token: USDC,
  contractAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
  network: Network.LINEA_SEPOLIA,
};
