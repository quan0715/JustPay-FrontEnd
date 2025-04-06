"use client";

import { useState, useEffect } from "react";
import { AggregatedSignatureData } from "@/app/_actions/signatureAggregateAction";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";

interface SignatureDetailProps {
  signatureId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignatureDetail({
  signatureId,
  isOpen,
  onOpenChange,
}: SignatureDetailProps) {
  const [data, setData] = useState<AggregatedSignatureData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!isOpen || !signatureId) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/signature/${signatureId}`);
        if (!response.ok) {
          throw new Error(`API錯誤: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(
          `獲取數據失敗: ${err instanceof Error ? err.message : "未知錯誤"}`
        );
        console.error("獲取簽名詳情失敗:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isOpen, signatureId]);

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

  // 格式化鏈名稱
  const formatChainName = (chainId: number) => {
    switch (chainId) {
      case 11155111:
        return "ETH Sepolia";
      case 84532:
        return "Base Sepolia";
      case 59141:
        return "Linea Sepolia";
      case 43113:
        return "Avalanche Fuji";
      default:
        return `Chain ID: ${chainId}`;
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>簽名交易詳情</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md">{error}</div>
        ) : data ? (
          <div className="space-y-6">
            {/* 簽名信息面板 */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-3">簽名信息</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-slate-500">簽名ID:</span>
                  <p className="font-medium">{data.signature.id}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">用戶地址:</span>
                  <p className="font-medium truncate">
                    {data.signature.userAddress}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">狀態:</span>
                  <p>
                    <StatusBadge
                      status={data.signature.status}
                      type="signature"
                    />
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">總金額:</span>
                  <p className="font-medium">{data.signature.totalAmount}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">目標鏈:</span>
                  <p className="font-medium">
                    {formatChainName(data.signature.destinationChainId)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">目標地址:</span>
                  <p className="font-medium truncate">
                    {data.signature.targetAddress}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">創建時間:</span>
                  <p className="font-medium">
                    {formatDate(data.signature.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">更新時間:</span>
                  <p className="font-medium">
                    {formatDate(data.signature.updatedAt)}
                  </p>
                </div>
                {data.signature.errorMessage && (
                  <div className="col-span-2">
                    <span className="text-sm text-slate-500">錯誤信息:</span>
                    <p className="text-red-600">
                      {data.signature.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 摘要信息面板 */}
            <div className="bg-slate-50 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-3">交易摘要</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded shadow-sm">
                  <span className="text-sm text-slate-500">總交易數</span>
                  <p className="text-xl font-bold">
                    {data.summary.totalTransactions}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <span className="text-sm text-slate-500">已完成</span>
                  <p className="text-xl font-bold text-green-600">
                    {data.summary.completedTransactions}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <span className="text-sm text-slate-500">待處理</span>
                  <p className="text-xl font-bold text-blue-600">
                    {data.summary.pendingTransactions}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <span className="text-sm text-slate-500">失敗</span>
                  <p className="text-xl font-bold text-red-600">
                    {data.summary.failedTransactions}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-sm text-slate-500">來源鏈:</span>
                <p className="font-medium">
                  {data.summary.sourceChains.join(", ")}
                </p>
              </div>
            </div>

            {/* 相關交易列表 */}
            <div>
              <h3 className="text-lg font-medium mb-3">
                相關交易 ({data.transactions.length})
              </h3>
              {data.transactions.length === 0 ? (
                <div className="bg-slate-50 p-4 rounded-md text-center text-slate-500">
                  無相關交易記錄
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-md shadow">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-3 text-left">來源鏈</th>
                        <th className="p-3 text-left">目標鏈</th>
                        <th className="p-3 text-left">金額</th>
                        <th className="p-3 text-left">交易哈希</th>
                        <th className="p-3 text-left">狀態</th>
                        <th className="p-3 text-left">時間</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.transactions.map((tx, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          <td className="p-3">{tx.sourceChain.name}</td>
                          <td className="p-3">{tx.destinationChain.name}</td>
                          <td className="p-3">{tx.amount}</td>
                          <td className="p-3">
                            {renderTxHashLink(tx.sourceChain.id, tx.txHash)}
                          </td>
                          <td className="p-3">
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
                          <td className="p-3">{formatDate(tx.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">無可用數據</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
