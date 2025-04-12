import { ethers } from "ethers";
import { TokenBalanceResult } from "@/models/balance";
import { ExpectedProxyDepositForBurnTransaction } from "@/models/transaction";
export const getExpectedProxyDepositForBurnTransactions = ({
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
  const totalAmountBigInt = ethers.parseUnits(
    Number(totalAmount).toFixed(6),
    6
  );
  const totalBalanceBigInt = ethers.parseUnits(
    Number(totalBalance).toFixed(6),
    6
  );
  if (totalAmountBigInt > totalBalanceBigInt) {
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

  let accumulatedAmount = ethers.parseUnits("0", 6);
  const result: ExpectedProxyDepositForBurnTransaction[] = [];

  for (const chainId of sourceChainIds) {
    const balance = balances[chainId];
    // 轉換為BigInt以便計算
    const balanceBigInt = ethers.parseUnits(balance.formatted, 6);

    // 計算還需要的金額 (總金額 - 已累計金額)
    const remainingAmount = totalAmountBigInt - accumulatedAmount;

    // 計算在當前鏈上可以使用的金額 (取餘額和剩餘所需金額的較小值)
    const amountToUse =
      remainingAmount > balanceBigInt ? balanceBigInt : remainingAmount;

    if (amountToUse <= 0) {
      continue;
    }
    // 添加結果
    result.push({
      amount: amountToUse.toString(), // 直接使用BigInt
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
