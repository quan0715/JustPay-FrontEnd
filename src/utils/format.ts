import { ethers } from "ethers";

export function formatE20Token(amount: string, decimals: number = 6) {
  return ethers.formatUnits(amount, decimals);
}

export function parseE20Token(amount: string, decimals: number = 6) {
  return ethers.parseUnits(amount, decimals);
}
