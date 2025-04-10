import { Network } from "alchemy-sdk";

export type Token = {
  name: string;
  symbol: string;
  decimals: number;
  image?: string;
};

export type ChainToken = {
  // different networks have different contract addresses
  CCTVDomain: number;
  TransmitterContractAddress: string;
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
  CCTVDomain: 0,
  TransmitterContractAddress: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  chainId: 11155111,
  token: USDC,
  contractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  network: Network.ETH_SEPOLIA,
  image: "/logo/ethereum-logo.png",
};

export const BaseSepoliaToken: ChainToken = {
  CCTVDomain: 6,
  TransmitterContractAddress: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  chainId: 84532,
  token: USDC,
  contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  network: Network.BASE_SEPOLIA,
  image: "/logo/base-logo.png",
};

export const LineaSepoliaToken: ChainToken = {
  CCTVDomain: 11,
  TransmitterContractAddress: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  chainId: 59141,
  token: USDC,
  contractAddress: "0xfece4462d57bd51a6a552365a011b95f0e16d9b7",
  network: Network.LINEA_SEPOLIA,
  image: "/logo/linea-logo.png",
};

export const AvalancheFujiToken: ChainToken = {
  CCTVDomain: 1,
  TransmitterContractAddress: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  chainId: 43113,
  token: USDC,
  contractAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
  network: Network.AVAX_FUJI,
  image: "/logo/avalanche-logo.jpeg",
};

export const ChainTokenList = [
  BaseSepoliaToken,
  AvalancheFujiToken,
  // LineaSepoliaToken,
  EthSepoliaToken,
];

export const getChainTokenDataByName = (name: string) => {
  return ChainTokenList.find((chainToken) => chainToken.network === name);
};

export const getChainTokenDataByChainId = (chainId: number) => {
  return ChainTokenList.find((chainToken) => chainToken.chainId === chainId);
};

type TokenSymbol = "USDC";
type TokenMetadata = {
  chainId: number;
  chainName: string;
  tokenContractAddress: string;
  tokenImage: string;
  tokenCCTVDomain: number;
  tokenTransmitterContractAddress: string;
};
export const TOKEN_METADATA_MAP: Record<TokenSymbol, TokenMetadata[]> = {
  USDC: [
    {
      chainId: 11155111,
      chainName: "Ethereum-Sepolia",
      tokenContractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      tokenImage: "/logo/usdc-logo.png",
      tokenCCTVDomain: 0,
      tokenTransmitterContractAddress:
        "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    },
    {
      chainId: 84532,
      chainName: "Base-Sepolia",
      tokenContractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      tokenImage: "/logo/base-logo.png",
      tokenCCTVDomain: 6,
      tokenTransmitterContractAddress:
        "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    },
    {
      chainId: 59141,
      chainName: "Linea-Sepolia",
      tokenContractAddress: "0xfece4462d57bd51a6a552365a011b95f0e16d9b7",
      tokenImage: "/logo/linea-logo.png",
      tokenCCTVDomain: 11,
      tokenTransmitterContractAddress:
        "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    },
    {
      chainId: 43113,
      chainName: "Avalanche-Fuji",
      tokenContractAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
      tokenImage: "/logo/avalanche-logo.jpeg",
      tokenCCTVDomain: 1,
      tokenTransmitterContractAddress:
        "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    },
  ],
};

export const getUSDCMetadata = (chainId: number) => {
  const metadata = TOKEN_METADATA_MAP["USDC"].find(
    (metadata) => metadata.chainId === chainId
  );
  if (!metadata) {
    throw new Error(`No metadata found for USDC on chain ${chainId}`);
  }
  return metadata;
};
