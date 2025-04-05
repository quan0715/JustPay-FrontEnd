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

// 聲明TransactionLog的擴展接口以包含signatureId
interface EnhancedTransactionLog extends TransactionLog {
  signatureId?: string;
}

// 交易狀態標籤組件
function StatusBadge({
  status,
  type = "default",
}: {
  status: string;
  type?: "signature" | "transaction" | "default";
}) {
  let bgColor = "bg-gray-200";
  let textColor = "text-gray-800";
  let statusText = status;

  switch (status) {
    case "pending":
    case "ready":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      if (type === "signature") statusText = "準備轉賬";
      if (type === "transaction") statusText = "等待處理";
      break;
    case "completed":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      if (type === "signature") statusText = "已完成";
      if (type === "transaction") statusText = "交易完成";
      break;
    case "failed":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      if (type === "signature") statusText = "簽名失敗";
      if (type === "transaction") statusText = "交易失敗";
      break;
    default:
      bgColor = "bg-gray-200";
      textColor = "text-gray-800";
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      {statusText}
    </span>
  );
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

  // 獲取交易記錄
  const fetchTransactions = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      await syncAllUnCompletedTransactionLogs(address);
      const logs = await getUserTransactionLogs(address);
      setTransactions(logs);

      // 獲取簽名交易記錄
      const signatureTxs = await getUserSignatureTransactions(address);
      setSignatureTransactions(signatureTxs);
    } catch (err) {
      setError("獲取交易記錄時發生錯誤");
      console.error("獲取交易記錄失敗:", err);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">交易記錄</h1>
          <div className="flex flex-row gap-2">
            <Button onClick={handleRefresh}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              刷新
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
              <TabsTrigger value="transactions">鏈上交易</TabsTrigger>
              <TabsTrigger value="signatures">簽名記錄</TabsTrigger>
            </TabsList>

            {/* 添加說明面板 */}
            <div className="mb-4 p-3 bg-slate-50 rounded-md text-sm">
              <h3 className="font-medium mb-2">狀態說明：</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-medium mb-1">簽名狀態：</p>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <StatusBadge status="ready" type="signature" />
                      <span className="ml-2">簽名已完成，準備轉賬</span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="completed" type="signature" />
                      <span className="ml-2">已完成轉賬流程</span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="failed" type="signature" />
                      <span className="ml-2">簽名或燃燒操作失敗</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">交易狀態：</p>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <StatusBadge status="ready" type="transaction" />
                      <span className="ml-2">交易已確認，等待接收</span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="pending" type="transaction" />
                      <span className="ml-2">交易處理中</span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="completed" type="transaction" />
                      <span className="ml-2">交易已完成</span>
                    </li>
                    <li className="flex items-center">
                      <StatusBadge status="failed" type="transaction" />
                      <span className="ml-2">交易失敗</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <TabsContent value="transactions">
              {transactions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>暫無鏈上交易記錄</CardTitle>
                    <CardDescription>
                      完成一筆交易後，記錄將顯示在此處
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-card rounded-md shadow">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-4 text-left">來源鏈</th>
                        <th className="p-4 text-left">目標鏈</th>
                        <th className="p-4 text-left">金額</th>
                        <th className="p-4 text-left">交易哈希</th>
                        <th className="p-4 text-left">狀態</th>
                        <th className="p-4 text-left">建立時間</th>
                        <th className="p-4 text-left">更新時間</th>
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
                    <CardTitle>暫無簽名記錄</CardTitle>
                    <CardDescription>
                      完成一筆簽名後，記錄將顯示在此處
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-card rounded-md shadow">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-4 text-left">簽名ID</th>
                        <th className="p-4 text-left">目標鏈</th>
                        <th className="p-4 text-left">總金額</th>
                        <th className="p-4 text-left">簽名狀態</th>
                        <th className="p-4 text-left">交易狀態</th>
                        <th className="p-4 text-left">交易哈希</th>
                        <th className="p-4 text-left">建立時間</th>
                        <th className="p-4 text-left">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {signatureTransactions.map((tx) => (
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
                            <StatusBadge status={tx.status} type="signature" />
                            {tx.errorMessage && (
                              <div className="text-xs text-red-600 mt-1">
                                {tx.errorMessage}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {(() => {
                              // 查找關聯的交易並顯示其狀態
                              const relatedTx = transactions.find(
                                (t) => t.signatureId === tx.id
                              ) as EnhancedTransactionLog | undefined;

                              if (relatedTx) {
                                return (
                                  <StatusBadge
                                    status={relatedTx.status}
                                    type="transaction"
                                  />
                                );
                              } else {
                                return (
                                  <span className="text-xs text-gray-500">
                                    無關聯交易
                                  </span>
                                );
                              }
                            })()}
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
                              "無"
                            )}
                          </td>
                          <td className="p-4">{formatDate(tx.createdAt)}</td>
                          <td className="p-4">
                            {/* 添加Transfer Token按鈕 */}
                            {(() => {
                              const related = transactions.find(
                                (t) => t.signatureId === tx.id
                              ) as EnhancedTransactionLog | undefined;

                              // 使用函數處理邏輯避免類型錯誤
                              if (tx.status === "ready") {
                                return (
                                  <div className="space-y-2">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      disabled={processingSignatures.includes(
                                        tx.id
                                      )}
                                      onClick={() => handleTransferToken(tx)}
                                      className="w-full"
                                    >
                                      {processingSignatures.includes(tx.id) ? (
                                        <>
                                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                          處理中...
                                        </>
                                      ) : (
                                        "Transfer Token"
                                      )}
                                    </Button>
                                    {related && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                          // 切換到交易標籤
                                          const tabsTrigger =
                                            document.querySelector(
                                              'button[value="transactions"]'
                                            ) as HTMLButtonElement;
                                          if (tabsTrigger) tabsTrigger.click();

                                          // 使用setTimeout確保標籤切換後再滾動
                                          setTimeout(() => {
                                            const txRow =
                                              document.getElementById(
                                                `transaction-${related.id}`
                                              );
                                            if (txRow) {
                                              txRow.scrollIntoView({
                                                behavior: "smooth",
                                              });
                                              txRow.classList.add(
                                                "bg-yellow-50"
                                              );
                                              setTimeout(() => {
                                                txRow.classList.remove(
                                                  "bg-yellow-50"
                                                );
                                              }, 3000);
                                            }
                                          }, 100);
                                        }}
                                      >
                                        查看詳情
                                      </Button>
                                    )}
                                  </div>
                                );
                              } else if (tx.status === "completed") {
                                return (
                                  <div className="space-y-2">
                                    <span className="text-green-600 text-sm block">
                                      已完成
                                    </span>
                                    {related && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                          // 切換到交易標籤
                                          const tabsTrigger =
                                            document.querySelector(
                                              'button[value="transactions"]'
                                            ) as HTMLButtonElement;
                                          if (tabsTrigger) tabsTrigger.click();

                                          // 使用setTimeout確保標籤切換後再滾動
                                          setTimeout(() => {
                                            const txRow =
                                              document.getElementById(
                                                `transaction-${related.id}`
                                              );
                                            if (txRow) {
                                              txRow.scrollIntoView({
                                                behavior: "smooth",
                                              });
                                              txRow.classList.add(
                                                "bg-yellow-50"
                                              );
                                              setTimeout(() => {
                                                txRow.classList.remove(
                                                  "bg-yellow-50"
                                                );
                                              }, 3000);
                                            }
                                          }, 100);
                                        }}
                                      >
                                        查看詳情
                                      </Button>
                                    )}
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="space-y-2">
                                    <span className="text-gray-500 text-sm block">
                                      {tx.status === "failed"
                                        ? "失敗"
                                        : "處理中"}
                                    </span>
                                    {related && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                          // 切換到交易標籤
                                          const tabsTrigger =
                                            document.querySelector(
                                              'button[value="transactions"]'
                                            ) as HTMLButtonElement;
                                          if (tabsTrigger) tabsTrigger.click();

                                          // 使用setTimeout確保標籤切換後再滾動
                                          setTimeout(() => {
                                            const txRow =
                                              document.getElementById(
                                                `transaction-${related.id}`
                                              );
                                            if (txRow) {
                                              txRow.scrollIntoView({
                                                behavior: "smooth",
                                              });
                                              txRow.classList.add(
                                                "bg-yellow-50"
                                              );
                                              setTimeout(() => {
                                                txRow.classList.remove(
                                                  "bg-yellow-50"
                                                );
                                              }, 3000);
                                            }
                                          }, 100);
                                        }}
                                      >
                                        查看詳情
                                      </Button>
                                    )}
                                  </div>
                                );
                              }
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
