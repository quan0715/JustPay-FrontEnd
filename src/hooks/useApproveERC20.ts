// hooks/useApproveERC20WithEthers.ts
import { useState } from "react";
import { ethers } from "ethers";

const erc20Abi = [
  "function approve(address spender, uint256 amount) returns (bool)",
];

export function useApproveERC20() {
  const [isApproving, setIsApproving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const approve = async ({
    tokenAddress,
    spender,
    amount,
    chainId,
    decimals = 6,
    useMax = false,
  }: {
    tokenAddress: string;
    spender: string;
    amount?: string;
    chainId: number;
    decimals?: number;
    useMax?: boolean;
  }) => {
    try {
      console.log(
        "approve",
        tokenAddress,
        spender,
        amount,
        chainId,
        decimals,
        useMax
      );
      setError(null);
      setIsApproving(true);
      setTxHash(null);

      if (!window.ethereum) throw new Error("未偵測到錢包");
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      // 1. 建立 provider & signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      // 2. 建立合約實例
      const contract = new ethers.Contract(tokenAddress, erc20Abi, signer);

      // 3. 計算金額
      const amountParsed = useMax
        ? ethers.MaxUint256
        : ethers.parseUnits(amount ?? "0", decimals);

      // 4. 發送交易
      const tx = await contract.approve(spender, amountParsed);
      setTxHash(tx.hash);
      setIsSuccess(true);
      // 5. 等待交易上鏈

      setIsApproving(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        console.error("發生未預期的錯誤", err);
        setError("發生未預期的錯誤");
      }
      setIsApproving(false);
      setIsSuccess(false);
    }
  };

  return {
    approve,
    isApproving,
    txHash,
    error,
    isSuccess,
  };
}
