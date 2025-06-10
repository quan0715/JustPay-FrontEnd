const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "demo";
if (!ALCHEMY_API_KEY) {
  throw new Error("ALCHEMY_API_KEY is not set");
}

export function getNetworkRpcUrl(chainId: number): string {
  switch (chainId) {
    case 11155111:
      return `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case 84531:
      return `https://base-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case 84532:
      return `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case 59144:
      return `https://linea-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case 43113:
      return `https://avax-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    default:
      return `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  }
}
