import { useState } from "react";
import { useContractSign } from "./useContractInteraction";
import {
  USDCTransferTransactionMetaDataInput,
  MessageSignature,
} from "@/models/transaction";

export function useProxySign() {
  const [signature, setSignature] = useState<string>("");
  const [signData, setSignData] = useState<MessageSignature>();
  const { status, signMessage, errorMessage, reset } = useContractSign();

  const signProxy = async ({
    data,
  }: {
    data: USDCTransferTransactionMetaDataInput;
  }) => {
    const signData = {
      sourceChainIds: data.expectedProxyDepositForBurnTransactions.map(
        (item) => item.sourceChainId
      ),
      amountsEach: data.expectedProxyDepositForBurnTransactions.map(
        (item) => item.amount
      ),
      nonces: data.expectedProxyDepositForBurnTransactions.map(() =>
        Math.floor(Math.random() * 1000000)
      ),
      expirationTime: Math.floor(Date.now() / 1000) + 60 * 60,
      destinationChainId: data.destinationChainId,
      recipientAddress: data.recipientAddress,
    } as MessageSignature;
    console.log("signData", signData);
    try {
      const signature = await signMessage(
        [
          "uint256[]",
          "uint256[]",
          "uint256[]",
          "uint256",
          "uint256",
          "address",
        ],
        [
          signData.sourceChainIds,
          signData.amountsEach,
          signData.nonces,
          signData.expirationTime,
          signData.destinationChainId,
          signData.recipientAddress,
        ]
      );
      if (!signature) {
        throw new Error("簽名失敗");
      }
      setSignature(signature);
      setSignData(signData);
      return signature;
    } catch (error) {
      console.error("簽名失敗:", error);
      throw error;
    }
  };

  return {
    signProxy,
    signData,
    signature,
    status,
    errorMessage,
    reset,
  };
}

// export function useJustPaySign() {
//   const [error, setError] = useState<string | null>(null);

//   const executeBurnProxy = async (
//     spenderAddress: string,
//     amount: bigint,
//     fromChainId: number,
//     toChainId: number,
//     signature: string,
//     sourceChainIds: number[],
//     amountsEach: bigint[],
//     nonces: number[],
//     expirationTime: number,
//     destinationChainId: number,
//     targetAddress: string,
//     userAddress: string
//   ) => {
//     const fromChain = getChainTokenDataByChainId(fromChainId);
//     if (!fromChain) {
//       throw new Error("無效的來源鏈ID");
//     }
//     const toChain = getChainTokenDataByChainId(toChainId);
//     if (!toChain) {
//       throw new Error("無效的目標鏈ID");
//     }
//     const maxFee = Number(amount) * 0.01;
//     // 將 maxFee 轉換為整數
//     const maxFeeInt = Math.floor(maxFee);
//     console.log("maxFee:", maxFee);
//     return await executeProxyDepositForBurn({
//       spenderAddress: spenderAddress,
//       sourceChainId: fromChainId,
//       burnToken: fromChain.contractAddress,
//       maxFee: maxFeeInt,
//       minFinalityThreshold: 500,
//       expirationTime: expirationTime,
//       sourceChainIds: sourceChainIds,
//       amountsEach: amountsEach,
//       nonces: nonces,
//       destinationChainId: destinationChainId,
//       targetAddress: targetAddress,
//       signature: signature,
//       userAddress,
//     });
//   };
//   return {
//     executeBurnProxy,
//     error,
//   };
// }
