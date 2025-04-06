import { NextRequest, NextResponse } from "next/server";
import { getUserSignatureTransactions } from "@/app/_actions/signatureTransactionAction";
import { getUserTransactionLogs } from "@/app/_actions/transactionLogAction";
import { AggregatedSignatureData } from "@/app/_actions/signatureAggregateAction";

// GET 請求處理函數，獲取用戶的所有簽名交易和相關交易記錄
export async function GET(request: NextRequest) {
  try {
    // 從查詢參數獲取用戶地址
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get("userAddress");

    if (!userAddress) {
      return NextResponse.json(
        { error: "User address is required" },
        { status: 400 }
      );
    }

    // 獲取用戶的所有簽名交易
    const signatureTransactions = await getUserSignatureTransactions(
      userAddress
    );

    if (signatureTransactions.length === 0) {
      return NextResponse.json({ signatures: [], transactions: [] });
    }

    // 獲取用戶的所有交易記錄
    const transactions = await getUserTransactionLogs(userAddress);

    // 聚合數據：為每個簽名交易添加其關聯的交易記錄
    const aggregatedData = signatureTransactions.map((signature) => {
      // 過濾出與當前簽名相關的交易記錄
      const relatedTransactions = transactions.filter((tx) =>
        signature.transactionHashes.includes(tx.txHash || "")
      );

      // 計算摘要信息
      const summary = {
        totalTransactions: relatedTransactions.length,
        completedTransactions: relatedTransactions.filter(
          (tx) => tx.status === "completed"
        ).length,
        pendingTransactions: relatedTransactions.filter(
          (tx) => tx.status === "pending"
        ).length,
        failedTransactions: relatedTransactions.filter(
          (tx) => tx.status === "failed"
        ).length,
        sourceChains: [
          ...new Set(relatedTransactions.map((tx) => tx.sourceChain.name)),
        ],
        destinationChain: signature.destinationChainId,
        totalAmount: signature.totalAmount,
      };

      // 返回聚合的數據結構
      return {
        signature,
        transactions: relatedTransactions,
        summary,
      } as AggregatedSignatureData;
    });

    return NextResponse.json({ aggregatedData });
  } catch (error) {
    console.error("Error fetching signature data:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature data" },
      { status: 500 }
    );
  }
}
