import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";

interface TransactionLog {
  transactionHash: string;
  blockNumber: number;
}

interface TransactionDetail {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  blockNumber: number;
  timestamp: number | undefined;
  type: string;
  data?: string;
}

const provider = new ethers.JsonRpcProvider(
  "https://lb.drpc.org/ogrpc?network=zircuit-mainnet&dkey=Ak-Z7kImikFJlIL_i3Tid5LqCV3y_X8R76CMnqSgS7QB"
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "錢包地址是必需的" }, { status: 400 });
    }

    // 並行獲取多個資訊
    const [balance, nonce, code, currentBlock] = await Promise.all([
      provider.getBalance(address),
      provider.getTransactionCount(address),
      provider.getCode(address),
      provider.getBlockNumber(),
    ]);

    let currentBlockIndex = currentBlock;
    const processedHashes = new Set<string>();
    const logs: TransactionLog[] = [];
    let loopLimit = 50;
    const logsLimit = 100;

    while (currentBlockIndex > 0 && loopLimit && logs.length < logsLimit) {
      const getLogsResult = await provider.getLogs({
        fromBlock: currentBlockIndex - 10000,
        toBlock: currentBlockIndex - 1,
        address: address,
      });

      // 過濾掉已經處理過的交易
      const newLogs = getLogsResult.filter(
        (log) => !processedHashes.has(log.transactionHash)
      );

      // 將新的交易哈希加入已處理集合
      newLogs.forEach((log) => processedHashes.add(log.transactionHash));

      logs.push(...newLogs);

      currentBlockIndex -= 10000;
      loopLimit--;
    }

    const recentTxs: TransactionDetail[] = [];

    for (const log of logs) {
      const tx = await provider.getTransaction(log.transactionHash);
      if (tx && tx.blockNumber) {
        // 判斷交易類型
        let type = "未知";

        // 檢查是否為合約創建交易
        if (!tx.to) {
          type = "合約創建";
        }
        // 檢查是否為 ETH 轉帳
        else if (tx.value > ethers.parseEther("0")) {
          type = "ETH 轉帳";
        }
        // 檢查是否為 ERC20 代幣轉帳
        else if (tx.data && tx.data.startsWith("0xa9059cbb")) {
          type = "ERC20 代幣轉帳";
        }
        // 檢查是否為合約互動
        else if (tx.data && tx.data !== "0x") {
          type = "合約互動";
        }

        recentTxs.push({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: ethers.formatEther(tx.value),
          blockNumber: tx.blockNumber,
          timestamp: (await provider.getBlock(tx.blockNumber))?.timestamp,
          type: type,
          data: tx.data,
        });
      }
    }

    return NextResponse.json({
      address: address,
      基本資訊: {
        餘額: ethers.formatEther(balance) + " ETH",
        交易次數: nonce,
        是否為合約: code !== "0x" ? "是" : "否",
        合約代碼: code !== "0x" ? code : null,
      },
      最近交易: recentTxs,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "處理請求時發生錯誤" }, { status: 500 });
  }
}
