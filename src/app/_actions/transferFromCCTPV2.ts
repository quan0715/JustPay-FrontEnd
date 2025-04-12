// "use server";
// import {
//   getUserTransactionLogs,
//   updateTransactionStatus,
// } from "./transaction";
// import { ethers } from "ethers";
// import {
//   getChainTokenDataByChainId,
//   getChainTokenDataByName,
// } from "@/models/token";
// import { Network } from "alchemy-sdk";

// import { getSignatureTransaction } from "./transationRepo";
// // 擴展 TransactionLog 介面以包含 signatureId

// function getNetworkRpcUrl(network: Network): string {
//   const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "demo";
//   switch (network) {
//     case Network.ETH_SEPOLIA:
//       return `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
//     case Network.BASE_SEPOLIA:
//       return `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
//     case Network.LINEA_SEPOLIA:
//       return `https://linea-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
//     case Network.AVAX_FUJI:
//       return `https://avax-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
//     default:
//       return `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
//   }
// }
// export async function transferFromCCTPV2(userAddress: string) {
//   const transactionLogs = await getUserTransactionLogs(userAddress);
//   if (!transactionLogs) {
//     throw new Error("Transaction log not found");
//   }
//   const readyTransactionLogs = transactionLogs.filter(
//     (log) => log.status === "ready"
//   );
//   console.log("readyTransactionLogs:", readyTransactionLogs);
//   // check if the transaction is already completed
//   // use operator private key to interact with the contract
//   const operatorPrivateKey = process.env.PROXY_OPERATOR_PRIVATE_KEY;
//   if (!operatorPrivateKey) {
//     throw new Error("Operator private key not found");
//   }

//   const ABI = ["function receiveMessage (bytes message, bytes attestation)"];

//   await Promise.all(
//     readyTransactionLogs.map(async (log) => {
//       const destinationNetwork = getChainTokenDataByChainId(
//         log.destinationChain.id
//       );
//       if (!destinationNetwork) {
//         throw new Error("Destination network not found");
//       }
//       const rpcUrl = getNetworkRpcUrl(destinationNetwork.network);
//       const provider = new ethers.JsonRpcProvider(rpcUrl);
//       const operator = new ethers.Wallet(operatorPrivateKey, provider);
//       const contract = new ethers.Contract(
//         destinationNetwork.TransmitterContractAddress,
//         ABI,
//         operator
//       );
//       const tx = await contract.receiveMessage(log.message, log.attestation);
//       await tx.wait();
//       console.log("tx:", tx);
//       // update the transaction log status to completed
//       await updateTransactionStatus(log.id, {
//         status: "completed",
//       });
//     })
//   );

//   if (readyTransactionLogs.length === 0) {
//     return;
//   }
// }

// // 添加新函數處理特定簽名的交易
// export async function transferForSignature(
//   signatureId: string,
//   signature: string,
//   sourceChainIds: number[],
//   amountsEach: string[],
//   nonces: number[],
//   expirationTime: number,
//   destinationChainId: number,
//   targetAddress: string
// ) {
//   // 檢查操作員私鑰
//   const operatorPrivateKey = process.env.PROXY_OPERATOR_PRIVATE_KEY;
//   if (!operatorPrivateKey) {
//     throw new Error("操作員私鑰未設置");
//   }

//   // 獲取目標鏈信息
//   const destinationNetwork = getChainTokenDataByChainId(destinationChainId);
//   if (!destinationNetwork) {
//     throw new Error("找不到目標網絡信息");
//   }

//   try {
//     // 確保當前鏈是目標鏈
//     if (destinationNetwork.chainId !== destinationChainId) {
//       throw new Error("當前鏈不是目標鏈，無法執行轉賬");
//     }

//     // 設置 RPC 提供者
//     const rpcUrl = getNetworkRpcUrl(destinationNetwork.network);
//     const networkToken = getChainTokenDataByName(
//       destinationNetwork.chainId.toString()
//     );
//     const provider = new ethers.JsonRpcProvider(rpcUrl);
//     const operator = new ethers.Wallet(operatorPrivateKey, provider);

//     // 合約 ABI - 使用 receiveMessage 功能
//     // 合約 ABI - 使用 proxyTransfer 功能
//     const ABI = [
//       "function proxyTransfer(address token, uint256[] memory sourceChainIds, uint256[] memory amountEach, uint256[] memory nonces, uint256 expirey, uint256 destinationChainId, address targetAddress, bytes memory signature)",
//     ];

//     // 連接合約
//     const contract = new ethers.Contract(
//       destinationNetwork.TransmitterContractAddress,
//       ABI,
//       operator
//     );

//     // 執行 proxyTransfer 交易
//     const tx = await contract.proxyTransfer(
//       networkToken?.contractAddress,
//       sourceChainIds,
//       amountsEach,
//       nonces,
//       expirationTime,
//       destinationChainId,
//       targetAddress,
//       signature
//     );

//     // 等待交易確認
//     const receipt = await tx.wait();
//     console.log("交易已確認:", receipt);

//     return {
//       success: true,
//       transactionHash: tx.hash,
//       message: "代幣轉賬成功",
//     };
//   } catch (error) {
//     console.error("執行轉賬流程時出錯:", error);
//     return {
//       success: false,
//       message: `轉賬失敗: ${
//         error instanceof Error ? error.message : "未知錯誤"
//       }`,
//     };
//   }
// }
