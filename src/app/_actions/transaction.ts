"use server";
import {
  getSignatureTransaction,
  updateTransactionLog,
  updateTransaction,
} from "@/app/_actions/transationRepo";
import { getUSDCMetadata } from "@/models/token";
import { WriteContractWithOperator } from "@/app/_actions/contractAction";
import { MessageSignature, TokenTransferLog } from "@/models/transaction";
import { getTransactionStatus } from "@/lib/circleApi";
export async function executeProxyDepositForBurn({
  spenderAddress,
  sourceChainId,
  burnToken,
  messageSignature,
  signature,
}: {
  spenderAddress: string;
  sourceChainId: number;
  burnToken: string;
  messageSignature: MessageSignature;
  signature: string;
}) {
  // 確保簽名結果有效
  if (!signature) {
    throw new Error("無效的簽名結果");
  }
  const _index = messageSignature.sourceChainIds.findIndex(
    (id) => id === sourceChainId
  );
  if (_index === -1) {
    throw new Error("Source chain id not found");
  }

  const _amountEach = messageSignature.amountsEach[_index];
  const maxFee = Math.floor(Number(_amountEach) * 0.01);
  const minFinalityThreshold = 500;

  try {
    // 建立provider和wallet
    const contractAbi = [
      {
        name: "proxyDepositForBurn",
        type: "function",
        inputs: [
          { name: "burnToken", type: "address" },
          { name: "maxFee", type: "uint256" },
          { name: "minFinalityThreshold", type: "uint32" },
          { name: "sourceChainIds", type: "uint256[]" },
          { name: "amountEach", type: "uint256[]" },
          { name: "nonces", type: "uint256[]" },
          { name: "expirey", type: "uint256" },
          { name: "destinationChainId", type: "uint256" },
          { name: "targetAddress", type: "address" },
          { name: "signature", type: "bytes" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
    ];
    const txHash = await WriteContractWithOperator(
      {
        chainId: sourceChainId,
        contractAddress: spenderAddress,
        contractAbi: contractAbi,
      },
      "proxyDepositForBurn",
      [
        burnToken,
        maxFee,
        minFinalityThreshold,
        messageSignature.sourceChainIds,
        messageSignature.amountsEach,
        messageSignature.nonces,
        messageSignature.expirationTime,
        messageSignature.destinationChainId,
        messageSignature.recipientAddress,
        signature,
      ]
    );
    console.log("交易已發送, 等待確認:", txHash);
    if (!txHash) {
      throw new Error("交易發送失敗");
    }
    return {
      status: "success",
      message: `執行成功`,
      transactionHash: txHash,
    };
  } catch (error) {
    console.error("執行代理合約時發生錯誤:", error);
  }
}

export async function receiveMessage({
  transactionLog,
  index,
  transactionId,
  destinationChainId,
}: {
  transactionLog: TokenTransferLog;
  index: number;
  transactionId: string;
  destinationChainId: number;
}) {
  const chain = getUSDCMetadata(transactionLog.sourceChainId);

  const transactionStatus = await getTransactionStatus(
    chain.tokenCCTVDomain,
    transactionLog.txHash
  );
  console.log("transactionStatus", transactionStatus);
  if (!transactionStatus) {
    return;
  }

  if (
    transactionStatus.status == "pending" ||
    transactionStatus.status == "pending_confirmations"
  ) {
    console.log("交易狀態為pending，等待交易確認");
    return;
  }
  if (!transactionStatus.message || !transactionStatus.attestation) {
    console.log("交易狀態為pending，等待交易確認");
    return;
  }
  const destinationChain = getUSDCMetadata(destinationChainId);

  const ABI = ["function receiveMessage (bytes message, bytes attestation)"];
  try {
    const txHash = await WriteContractWithOperator(
      {
        chainId: destinationChainId,
        contractAddress: destinationChain.tokenTransmitterContractAddress,
        contractAbi: ABI,
      },
      "receiveMessage",
      [transactionStatus.message, transactionStatus.attestation]
    );
    if (!txHash) {
      throw new Error("交易發送失敗");
    }
    await updateTransactionLog({
      id: transactionId,
      index: index,
      update: {
        ...transactionLog,
        status: "done",
      },
    });
  } catch (error) {
    console.error("接收訊息時發生錯誤:", error);
  }
}

export async function executeSignatureTransaction({
  transactionId,
}: {
  transactionId: string;
}) {
  const transaction = await getSignatureTransaction({
    id: transactionId,
  });
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (!transaction.tokenTransferLogs) {
    return;
  }

  if (transaction.status !== "signed") {
    return;
  }

  await updateTransaction({
    id: transactionId,
    update: {
      status: "pending",
    },
  });
  try {
    await Promise.all(
      transaction.tokenTransferLogs.map(async (log, index) => {
        if (
          log.transactionType !== "proxyDepositForBurn" ||
          log.status !== "draft"
        ) {
          return;
        }
        const chain = getUSDCMetadata(log.sourceChainId);
        const txHash = await executeProxyDepositForBurn({
          spenderAddress: transaction.metaData.spenderAddress,
          sourceChainId: log.sourceChainId,
          burnToken: chain.tokenContractAddress,
          messageSignature: transaction.metaData,
          signature: transaction.signature,
        });
        //
        if (!txHash) {
          throw new Error("交易發送失敗");
        }
        await updateTransactionLog({
          id: transactionId,
          index: index,
          update: {
            ...log,
            status: "pending",
            txHash: txHash.transactionHash,
          },
        });
      })
    );
  } catch (error) {
    await updateTransaction({
      id: transactionId,
      update: {
        status: "failed",
      },
    });
    console.error("執行交易時發生錯誤:", error);
    throw new Error("執行交易時發生錯誤");
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));

  while (true) {
    const transactionDataAfterExecute = await getSignatureTransaction({
      id: transactionId,
    });
    if (
      !transactionDataAfterExecute ||
      !transactionDataAfterExecute.tokenTransferLogs
    ) {
      throw new Error("Transaction not found");
    }
    const pendingLogs = transactionDataAfterExecute.tokenTransferLogs.filter(
      (log) => log.status === "pending"
    );
    if (pendingLogs.length === 0) {
      break;
    }
    await Promise.all(
      transactionDataAfterExecute.tokenTransferLogs.map(async (log, index) => {
        if (log.status !== "pending") {
          return;
        }
        await receiveMessage({
          transactionId: transactionId,
          transactionLog: log,
          index: index,
          destinationChainId: transaction.metaData.destinationChainId,
        });
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  await updateTransaction({
    id: transactionId,
    update: {
      status: "readyToTransfer",
    },
  });
}
