"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserTransactionLogs,
  syncAllUnCompletedTransactionLogs,
} from "@/app/_actions/transactionLogAction";
import { TransactionLog } from "@/models/transactionLog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserSignatureTransactions } from "@/app/_actions/signatureTransactionAction";
import { SignatureTransaction } from "@/models/signatureTransaction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { transferForSignature } from "@/app/_actions/transferFromCCTPV2";
import { StatusBadge } from "./components/StatusBadge";
import { SignatureDetail } from "./components/SignatureDetail";
import { transferFromCCTPV2 } from "@/app/_actions/transferFromCCTPV2";
// 聲明TransactionLog的擴展接口以包含signatureId
interface EnhancedTransactionLog extends TransactionLog {
  signatureId?: string;
  relatedSignature?: SignatureTransaction;
}

// 交易日誌頁面
export default function TransactionsPage() {
  const { address, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<EnhancedTransactionLog[]>(
    []
  );
  const [signatureTransactions, setSignatureTransactions] = useState<
    SignatureTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingSignatures, setProcessingSignatures] = useState<string[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [autoExecute, setAutoExecute] = useState(true);

  // 獲取交易記錄
  const fetchTransactions = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      await syncAllUnCompletedTransactionLogs(address);
      await transferFromCCTPV2(address);
      const logs = await getUserTransactionLogs(address);

      // 獲取簽名交易記錄
      const signatureTxs = await getUserSignatureTransactions(address);
      setSignatureTransactions(signatureTxs);

      // 處理交易記錄，關聯相應的簽名交易
      const enhancedLogs = logs.map((tx) => {
        const enhancedTx: EnhancedTransactionLog = { ...tx };

        // 查找關聯的簽名交易
        for (const sigTx of signatureTxs) {
          if (
            sigTx.transactionHashes &&
            sigTx.transactionHashes.includes(tx.txHash || "")
          ) {
            enhancedTx.signatureId = sigTx.id;
            enhancedTx.relatedSignature = sigTx;
            break;
          }
        }

        return enhancedTx;
      });

      setTransactions(enhancedLogs);
    } catch (err) {
      setError("獲取交易記錄時發生錯誤");
      console.error("獲取交易記錄失敗:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 獲取簽名關聯的交易列表
  const getRelatedTransactions = (signatureId: string) => {
    return transactions.filter((tx) => tx.signatureId === signatureId);
  };

  // 獲取簽名交易的摘要
  const getSignatureSummary = (signatureId: string) => {
    const relatedTxs = getRelatedTransactions(signatureId);

    return {
      total: relatedTxs.length,
      completed: relatedTxs.filter((tx) => tx.status === "completed").length,
      pending: relatedTxs.filter((tx) => tx.status === "pending").length,
      failed: relatedTxs.filter((tx) => tx.status === "failed").length,
    };
  };

  // 當用戶登入後獲取交易記錄
  useEffect(() => {
    if (isAuthenticated && address) {
      fetchTransactions();
    }
  }, [isAuthenticated, address]);

  // 格式化日期
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // 格式化交易哈希
  const formatTxHash = (hash?: string) => {
    if (!hash) return "無";
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // 顯示交易哈希鏈接
  const renderTxHashLink = (chainId: number, txHash?: string) => {
    if (!txHash) return "無";

    // 根據鏈ID獲取區塊鏈瀏覽器URL
    let explorerUrl = "";
    switch (chainId) {
      case 11155111: // ETH Sepolia
        explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
        break;
      case 84532: // Base Sepolia
        explorerUrl = `https://sepolia.basescan.org/tx/${txHash}`;
        break;
      case 59141: // Linea Sepolia
        explorerUrl = `https://sepolia.lineascan.build/tx/${txHash}`;
        break;
      case 43113: // Avalanche Fuji
        explorerUrl = `https://testnet.snowtrace.io/tx/${txHash}`;
        break;
      default:
        return formatTxHash(txHash);
    }

    return (
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {formatTxHash(txHash)}
      </a>
    );
  };

  // 手動刷新交易列表
  const handleRefresh = () => {
    fetchTransactions();
  };

  // 執行代幣轉賬
  const handleTransferToken = async (signature: SignatureTransaction) => {
    if (!signature) return;

    try {
      setProcessingSignatures((prev) => [...prev, signature.id]);

      // 檢查簽名信息
      if (
        !signature.signature ||
        !signature.sourceChainIds ||
        !signature.amountsEach ||
        !signature.nonces
      ) {
        toast.error("簽名數據不完整，無法執行轉賬");
        return;
      }

      // 執行轉賬
      if (!address) {
        toast.error("未連接錢包，無法執行轉賬");
        return;
      }

      const result = await transferForSignature(
        signature.id,
        signature.signature,
        signature.sourceChainIds,
        signature.amountsEach,
        signature.nonces,
        signature.expirationTime,
        signature.destinationChainId,
        signature.targetAddress,
        address
      );

      if (result.success) {
        toast.success(`轉賬成功: ${result.message}`);
        // 刷新交易列表
        fetchTransactions();
      } else {
        toast.error(`轉賬失敗: ${result.message}`);
      }
    } catch (error) {
      toast.error(
        `操作失敗: ${error instanceof Error ? error.message : "未知錯誤"}`
      );
      console.error("轉賬失敗:", error);
    } finally {
      setProcessingSignatures((prev) =>
        prev.filter((id) => id !== signature.id)
      );
    }
  };

  // 顯示簽名詳情
  const handleShowSignatureDetail = (signatureId: string) => {
    setSelectedSignatureId(signatureId);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Transaction Records</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-execute"
                checked={autoExecute}
                onChange={(e) => setAutoExecute(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="auto-execute" className="text-sm font-medium">
                自動執行待處理簽名
              </label>
            </div>
            <Button onClick={handleRefresh}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Refresh
            </Button>
          </div>
        </div>

        {isLoading &&
        transactions.length === 0 &&
        signatureTransactions.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md">{error}</div>
        ) : (
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="transactions">
                On-Chain Transactions
              </TabsTrigger>
              <TabsTrigger value="signatures">Signature Records</TabsTrigger>
            </TabsList>

            {/* 添加說明面板 */}
            <div className="mb-4 p-3 bg-slate-50 rounded-md text-sm">
              <h3 className="font-medium mb-2">Status Description:</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-medium mb-1">Signature Status:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <StatusBadge status="ready" type="signature" />
                      <span className="ml-2">
                        Signature completed, ready to transfer
                      </span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="completed" type="signature" />
                      <span className="ml-2">
                        Signature completed, ready to transfer
                      </span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="failed" type="signature" />
                      <span className="ml-2">
                        Signature or burn operation failed
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Transaction Status:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <StatusBadge status="ready" type="transaction" />
                      <span className="ml-2">
                        Transaction confirmed, waiting to receive
                      </span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="pending" type="transaction" />
                      <span className="ml-2">Transaction processing</span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="completed" type="transaction" />
                      <span className="ml-2">Transaction completed</span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="failed" type="transaction" />
                      <span className="ml-2">Transaction failed</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <TabsContent value="transactions">
              {transactions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No transaction records</CardTitle>
                    <CardDescription>
                      After completing a transaction, the record will be
                      displayed here
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-card rounded-md shadow">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-4 text-left">Source Chain</th>
                        <th className="p-4 text-left">Target Chain</th>
                        <th className="p-4 text-left">Amount</th>
                        <th className="p-4 text-left">Transaction Hash</th>
                        <th className="p-4 text-left">Status</th>
                        <th className="p-4 text-left">Signature Status</th>
                        <th className="p-4 text-left">Created Time</th>
                        <th className="p-4 text-left">Updated Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          id={`transaction-${tx.id}`}
                          className="hover:bg-muted/50"
                        >
                          <td className="p-4">{tx.sourceChain.name}</td>
                          <td className="p-4">{tx.destinationChain.name}</td>
                          <td className="p-4">{tx.amount}</td>
                          <td className="p-4">
                            {renderTxHashLink(tx.sourceChain.id, tx.txHash)}
                          </td>
                          <td className="p-4">
                            <StatusBadge
                              status={tx.status}
                              type="transaction"
                            />
                            {tx.errorMessage && (
                              <div className="text-xs text-red-600 mt-1">
                                {tx.errorMessage}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {tx.relatedSignature ? (
                              <div className="flex flex-col gap-1">
                                <StatusBadge
                                  status={tx.relatedSignature.status}
                                  type="signature"
                                />
                                <span className="text-xs text-gray-500">
                                  ID: {tx.relatedSignature.id.slice(0, 6)}...
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleShowSignatureDetail(
                                      tx.relatedSignature!.id
                                    )
                                  }
                                >
                                  View Details
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">
                                No signature
                              </span>
                            )}
                          </td>
                          <td className="p-4">{formatDate(tx.createdAt)}</td>
                          <td className="p-4">{formatDate(tx.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="signatures">
              {signatureTransactions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No signature records</CardTitle>
                    <CardDescription>
                      After completing a signature, the record will be displayed
                      here
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-card rounded-md shadow">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-4 text-left">Signature ID</th>
                        <th className="p-4 text-left">Target Chain</th>
                        <th className="p-4 text-left">Total Amount</th>
                        <th className="p-4 text-left">Signature Status</th>
                        <th className="p-4 text-left">Related Transactions</th>
                        <th className="p-4 text-left">Transaction Hashes</th>
                        <th className="p-4 text-left">Created Time</th>
                        <th className="p-4 text-left">Operation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {signatureTransactions.map((tx) => {
                        const summary = getSignatureSummary(tx.id);
                        return (
                          <tr
                            key={tx.id}
                            id={`signature-${tx.id}`}
                            className="hover:bg-muted/50 transition-colors duration-300"
                          >
                            <td className="p-4">{tx.id.slice(0, 8)}...</td>
                            <td className="p-4">
                              {(() => {
                                switch (tx.destinationChainId) {
                                  case 11155111:
                                    return "ETH Sepolia";
                                  case 84532:
                                    return "Base Sepolia";
                                  case 59141:
                                    return "Linea Sepolia";
                                  case 43113:
                                    return "Avalanche Fuji";
                                  default:
                                    return `Chain ID: ${tx.destinationChainId}`;
                                }
                              })()}
                            </td>
                            <td className="p-4">{tx.totalAmount}</td>
                            <td className="p-4">
                              <StatusBadge
                                status={tx.status}
                                type="signature"
                              />
                              {tx.errorMessage && (
                                <div className="text-xs text-red-600 mt-1">
                                  {tx.errorMessage}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              {summary.total > 0 ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                      總計: {summary.total}
                                    </span>
                                    {summary.total > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          // 切換到交易標籤
                                          const tabsTrigger =
                                            document.querySelector(
                                              'button[value="transactions"]'
                                            ) as HTMLButtonElement;
                                          if (tabsTrigger) tabsTrigger.click();
                                        }}
                                      >
                                        View All
                                      </Button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-3 gap-1">
                                    {summary.completed > 0 && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-xs text-green-700">
                                          完成: {summary.completed}
                                        </span>
                                      </div>
                                    )}
                                    {summary.pending > 0 && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-xs text-blue-700">
                                          處理中: {summary.pending}
                                        </span>
                                      </div>
                                    )}
                                    {summary.failed > 0 && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="text-xs text-red-700">
                                          失敗: {summary.failed}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  No related transactions
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              {tx.transactionHashes &&
                              tx.transactionHashes.length > 0 ? (
                                <div className="space-y-1">
                                  {tx.transactionHashes.map((hash, index) => (
                                    <div key={index}>
                                      {renderTxHashLink(
                                        tx.sourceChainIds[index] ||
                                          tx.destinationChainId,
                                        hash
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                "No"
                              )}
                            </td>
                            <td className="p-4">{formatDate(tx.createdAt)}</td>
                            <td className="p-4">
                              {/* 添加詳情按鈕 */}
                              <div className="space-y-2">
                                {/* 添加查看詳情按鈕 */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleShowSignatureDetail(tx.id)
                                  }
                                  className="w-full"
                                >
                                  View Details
                                </Button>

                                {/* 使用函數處理邏輯避免類型錯誤 */}
                                {(() => {
                                  if (tx.status === "ready") {
                                    return (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={processingSignatures.includes(
                                          tx.id
                                        )}
                                        onClick={() => handleTransferToken(tx)}
                                        className="w-full"
                                      >
                                        {processingSignatures.includes(
                                          tx.id
                                        ) ? (
                                          <>
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            Processing...
                                          </>
                                        ) : (
                                          "Transfer Token"
                                        )}
                                      </Button>
                                    );
                                  } else if (tx.status === "completed") {
                                    return (
                                      <span className="text-green-600 text-sm block">
                                        Completed
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="text-gray-500 text-sm block">
                                        {tx.status === "failed"
                                          ? "Failed"
                                          : "Processing"}
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* 簽名詳情對話框 */}
      {selectedSignatureId && (
        <SignatureDetail
          signatureId={selectedSignatureId}
          isOpen={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </div>
  );
}
