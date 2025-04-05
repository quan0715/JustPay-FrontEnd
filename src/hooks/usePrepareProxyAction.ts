import { useUserTokenBalance } from "./useUserTokenBalance";
import { ChainToken } from "@/models/token";
type prepareProxyActionStatus = "loading" | "error" | "success";
type prepareProxyActionResult = {
  status: prepareProxyActionStatus;
  message: string;
  result: {
    amount: string;
    sourceChain: ChainToken;
  }[];
};
export const usePrepareProxyAction = () => {
  const {
    balances,
    isLoading: isBalancesLoading,
    totalBalance,
  } = useUserTokenBalance();

  const prepareProxyAction = async ({
    totalAmount,
    sourceChain,
  }: {
    totalAmount: string;
    sourceChain: ChainToken[];
  }) => {
    const totalAmountNumber = parseFloat(totalAmount);
    // 分配 sourceChain 的餘額，來完成預期交易
    if (isBalancesLoading) {
      return {
        status: "loading",
        message: "Loading...",
      };
    }
    if (totalAmount > totalBalance) {
      return {
        status: "error",
        message: "Total amount is greater than total balance",
      };
    }
    if (sourceChain.length === 0) {
      return {
        status: "error",
        message: "Source chain is required",
      };
    }

    // 分配 sourceChain 的餘額，來完成預期交易
    const result: prepareProxyActionResult["result"] = [];
    let accumulatedAmount = 0;
    for (const chain of sourceChain) {
      const balance = balances[chain.network];
      const balanceNumber = parseFloat(balance.formatted);
      const amountToUse = totalAmountNumber - accumulatedAmount;
      const expectedAmount = Math.min(amountToUse, balanceNumber);
      result.push({
        amount: expectedAmount.toString(),
        sourceChain: chain,
      });
      accumulatedAmount += expectedAmount;
      if (accumulatedAmount >= totalAmountNumber) {
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
    isLoading: isBalancesLoading,
  };
};
