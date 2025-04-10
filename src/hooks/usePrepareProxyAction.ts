import { TokenBalanceResult } from "@/app/_actions/tokenBalance";
import { ethers } from "ethers";
type prepareProxyActionStatus = "loading" | "error" | "success";
type prepareProxyActionResult = {
  status: prepareProxyActionStatus;
  message: string;
  result: {
    amount: bigint;
    sourceChainId: number;
  }[];
};
export const usePrepareProxyAction = () => {
  const prepareProxyAction = async ({
    totalAmount,
    balances,
    totalBalance,
    sourceChainIds,
  }: {
    totalAmount: string;
    balances: Record<number, TokenBalanceResult>;
    totalBalance: string;
    sourceChainIds: number[];
  }) => {
    // 轉換為BigInt以便統一類型計算
    const totalAmountBigInt = ethers.parseUnits(totalAmount, 6);
    if (totalAmount > totalBalance) {
      return {
        status: "error",
        message: "Total amount is greater than total balance",
      };
    }
    if (sourceChainIds.length === 0) {
      return {
        status: "error",
        message: "Source chain is required",
      };
    }

    // 分配 sourceChain 的餘額，來完成預期交易
    const result: prepareProxyActionResult["result"] = [];
    let accumulatedAmount = ethers.parseUnits("0", 6); // BigInt 累計金額

    for (const chainId of sourceChainIds) {
      const balance = balances[chainId];
      // 轉換為BigInt以便計算
      const balanceBigInt = ethers.parseUnits(balance.formatted, 6);

      // 計算還需要的金額 (總金額 - 已累計金額)
      const remainingAmount = totalAmountBigInt - accumulatedAmount;

      // 計算在當前鏈上可以使用的金額 (取餘額和剩餘所需金額的較小值)
      const amountToUse =
        remainingAmount > balanceBigInt ? balanceBigInt : remainingAmount;

      console.log("balance:", balance);
      console.log("balanceBigInt:", balanceBigInt);
      console.log("remainingAmount:", remainingAmount);
      console.log("amountToUse:", amountToUse);

      // 添加結果
      result.push({
        amount: amountToUse, // 直接使用BigInt
        sourceChainId: chainId,
      });

      // 更新累計金額
      accumulatedAmount = accumulatedAmount + amountToUse;

      // 如果已經滿足總金額，退出循環
      if (accumulatedAmount >= totalAmountBigInt) {
        break;
      }
    }

    return {
      status: "success",
      message: "Prepare proxy action success",
      result,
    };
  };

  return {
    prepareProxyAction,
  };
};
