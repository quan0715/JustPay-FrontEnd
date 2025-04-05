import { Network } from "alchemy-sdk";

export type Token = {
  name: string;
  symbol: string;
  decimals: number;
  image?: string;
};

export type ChainToken = {
  // different networks have different contract addresses
  chainId: number;
  token: Token;
  contractAddress: string;
  network: Network;
  image?: string;
};

export const USDC: Token = {
  name: "USD Coin",
  symbol: "USDC",
  image: "/logo/usdc-logo.png",
  decimals: 6,
};

export const EthSepoliaToken: ChainToken = {
  chainId: 11155111,
  token: USDC,
  contractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  network: Network.ETH_SEPOLIA,
  image: "/logo/ethereum-logo.png",
};

export const BaseSepoliaToken: ChainToken = {
  chainId: 84532,
  token: USDC,
  contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  network: Network.BASE_SEPOLIA,
  image: "/logo/base-logo.png",
};

export const LineaSepoliaToken: ChainToken = {
  chainId: 59141,
  token: USDC,
  contractAddress: "0xfece4462d57bd51a6a552365a011b95f0e16d9b7",
  network: Network.LINEA_SEPOLIA,
  image: "/logo/linea-logo.png",
};

export const AvalancheFujiToken: ChainToken = {
  chainId: 43113,
  token: USDC,
  contractAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
  network: Network.AVAX_FUJI,
  image: "/logo/avalanche-logo.jpeg",
};

export const ChainTokenList = [
  EthSepoliaToken,
  BaseSepoliaToken,
  LineaSepoliaToken,
  AvalancheFujiToken,
];

export const getChainTokenDataByName = (name: string) => {
  return ChainTokenList.find((chainToken) => chainToken.network === name);
};

export const getChainTokenDataByChainId = (chainId: number) => {
  return ChainTokenList.find((chainToken) => chainToken.chainId === chainId);
};
