export interface TokenBalanceResult {
  chainId: number;
  raw: string;
  formatted: string;
  decimals: number;
  usdValue: string;
  error?: string;
}
