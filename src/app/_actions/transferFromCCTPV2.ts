"use server";
import {
  getUserTransactionLogs,
  updateTransactionStatus,
} from "./transactionLogAction";
import { ethers } from "ethers";
import { getChainTokenDataByChainId } from "@/models/token";
import { Network } from "alchemy-sdk";
import { TransactionLog } from "@/models/transactionLog";

// 擴展 TransactionLog 介面以包含 signatureId
interface EnhancedTransactionLog extends TransactionLog {
  signatureId?: string;
}

function getNetworkRpcUrl(network: Network): string {
  const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "demo";
  switch (network) {
    case Network.ETH_SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.BASE_SEPOLIA:
      return `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.LINEA_SEPOLIA:
      return `https://linea-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case Network.AVAX_FUJI:
      return `https://avax-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    default:
      return `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  }
}
export async function transferFromCCTPV2(userAddress: string) {
  const transactionLogs = await getUserTransactionLogs(userAddress);
  if (!transactionLogs) {
    throw new Error("Transaction log not found");
  }
  const readyTransactionLogs = transactionLogs.filter(
    (log) => log.status === "ready"
  );
  console.log("readyTransactionLogs:", readyTransactionLogs);
  // check if the transaction is already completed
  // use operator private key to interact with the contract
  const operatorPrivateKey = process.env.PROXY_OPERATOR_PRIVATE_KEY;
  if (!operatorPrivateKey) {
    throw new Error("Operator private key not found");
  }

  const ABI = ["function receiveMessage (bytes message, bytes attestation)"];

  await Promise.all(
    readyTransactionLogs.map(async (log) => {
      const destinationNetwork = getChainTokenDataByChainId(
        log.destinationChain.id
      );
      if (!destinationNetwork) {
        throw new Error("Destination network not found");
      }
      const rpcUrl = getNetworkRpcUrl(destinationNetwork.network);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const operator = new ethers.Wallet(operatorPrivateKey, provider);
      const contract = new ethers.Contract(
        destinationNetwork.TransmitterContractAddress,
        ABI,
        operator
      );
      const tx = await contract.receiveMessage(log.message, log.attestation);
      await tx.wait();
      console.log("tx:", tx);
      // update the transaction log status to completed
      await updateTransactionStatus(log.id, {
        status: "completed",
      });
    })
  );

  if (readyTransactionLogs.length === 0) {
    return;
  }
}

// 添加新函數處理特定簽名的交易
export async function transferForSignature(
  signatureId: string,
  signature: string,
  sourceChainIds: number[],
  amountsEach: string[],
  nonces: number[],
  expirationTime: number,
  destinationChainId: number,
  targetAddress: string,
  userAddress: string
) {
  // 檢查操作員私鑰
  const operatorPrivateKey = process.env.PROXY_OPERATOR_PRIVATE_KEY;
  if (!operatorPrivateKey) {
    throw new Error("操作員私鑰未設置");
  }

  // 獲取目標鏈信息
  const destinationNetwork = getChainTokenDataByChainId(destinationChainId);
  if (!destinationNetwork) {
    throw new Error("找不到目標網絡信息");
  }

  try {
    // 確保當前鏈是目標鏈
    if (destinationNetwork.chainId !== destinationChainId) {
      throw new Error("當前鏈不是目標鏈，無法執行轉賬");
    }

    // 設置 RPC 提供者
    const rpcUrl = getNetworkRpcUrl(destinationNetwork.network);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const operator = new ethers.Wallet(operatorPrivateKey, provider);

    // 合約 ABI - 使用 receiveMessage 功能
    const ABI = ["function receiveMessage(bytes message, bytes attestation)"];

    // 連接合約
    const contract = new ethers.Contract(
      destinationNetwork.TransmitterContractAddress,
      ABI,
      operator
    );

    // 查找相關交易記錄以獲取 message 和 attestation
    const transactionLogs = (await getUserTransactionLogs(
      userAddress
    )) as EnhancedTransactionLog[];
    const relevantTx = transactionLogs.find(
      (log) => log.status === "ready" && log.signatureId === signatureId
    );

    if (!relevantTx || !relevantTx.message || !relevantTx.attestation) {
      throw new Error("找不到相關的交易記錄或缺少必要參數");
    }

    console.log("執行 receiveMessage 交易...");
    console.log("目標合約:", destinationNetwork.TransmitterContractAddress);
    console.log("Message:", relevantTx.message.slice(0, 50) + "...");
    console.log("Attestation:", relevantTx.attestation.slice(0, 50) + "...");

    // 執行 receiveMessage 交易
    const tx = await contract.receiveMessage(
      relevantTx.message,
      relevantTx.attestation
    );

    // 等待交易確認
    const receipt = await tx.wait();
    console.log("交易已確認:", receipt);

    // 更新簽名交易狀態
    const { updateSignatureTransaction } = await import(
      "./signatureTransactionAction"
    );
    await updateSignatureTransaction(signatureId, {
      status: "completed",
    });

    // 更新交易記錄狀態
    await updateTransactionStatus(relevantTx.id, {
      status: "completed",
    });

    return {
      success: true,
      transactionHash: tx.hash,
      message: "代幣轉賬成功",
    };
  } catch (error) {
    console.error("執行轉賬流程時出錯:", error);
    return {
      success: false,
      message: `轉賬失敗: ${
        error instanceof Error ? error.message : "未知錯誤"
      }`,
    };
  }
}
