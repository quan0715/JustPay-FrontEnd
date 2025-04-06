"use client";

import { useState } from "react";
import {
  getAggregatedSignatureData,
  getAggregatedSignatureDataBySignature,
} from "@/app/_actions/signatureAggregateAction";
import { AggregatedSignatureData } from "@/app/_actions/signatureAggregateAction";

export default function TestSignaturePage() {
  const [signatureId, setSignatureId] = useState("");
  const [signatureString, setSignatureString] = useState("");
  const [result, setResult] = useState<AggregatedSignatureData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 根據ID獲取聚合數據
  const fetchById = async () => {
    if (!signatureId) {
      setError("簽名ID不能為空");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getAggregatedSignatureData(signatureId);
      if (data) {
        setResult(data);
      } else {
        setError("未找到相關數據");
      }
    } catch (err) {
      setError("獲取數據時發生錯誤: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 根據簽名字符串搜索
  const fetchBySignature = async () => {
    if (!signatureString) {
      setError("簽名字符串不能為空");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getAggregatedSignatureDataBySignature(signatureString);
      if (data) {
        setResult(data);
      } else {
        setError("未找到相關數據");
      }
    } catch (err) {
      setError("獲取數據時發生錯誤: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 使用API端點測試
  const testApi = async () => {
    if (!signatureString) {
      setError("簽名字符串不能為空");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/signature/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature: signatureString }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(`API錯誤: ${data.error}`);
      }
    } catch (err) {
      setError("API請求時發生錯誤: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">簽名聚合數據測試頁面</h1>

      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">通過ID查詢</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={signatureId}
            onChange={(e) => setSignatureId(e.target.value)}
            placeholder="輸入簽名交易ID"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={fetchById}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            {loading ? "加載中..." : "獲取數據"}
          </button>
        </div>
      </div>

      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">通過簽名字符串查詢</h2>
        <div className="flex gap-4 mb-2">
          <input
            type="text"
            value={signatureString}
            onChange={(e) => setSignatureString(e.target.value)}
            placeholder="輸入簽名字符串"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={fetchBySignature}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
          >
            {loading ? "加載中..." : "Server Action"}
          </button>
        </div>
        <button
          onClick={testApi}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? "加載中..." : "測試API端點"}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-300 rounded text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">結果</h2>

          <div className="mb-6 p-4 bg-gray-50 border rounded">
            <h3 className="text-lg font-medium mb-2">簽名信息</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-semibold">ID:</span> {result.signature.id}
              </div>
              <div>
                <span className="font-semibold">用戶地址:</span>{" "}
                {result.signature.userAddress}
              </div>
              <div>
                <span className="font-semibold">狀態:</span>{" "}
                {result.signature.status}
              </div>
              <div>
                <span className="font-semibold">總金額:</span>{" "}
                {result.signature.totalAmount}
              </div>
              <div>
                <span className="font-semibold">創建時間:</span>{" "}
                {result.signature.createdAt.toString()}
              </div>
              <div>
                <span className="font-semibold">目標地址:</span>{" "}
                {result.signature.targetAddress}
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 border rounded">
            <h3 className="text-lg font-medium mb-2">摘要</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-semibold">總交易數:</span>{" "}
                {result.summary.totalTransactions}
              </div>
              <div>
                <span className="font-semibold">已完成交易:</span>{" "}
                {result.summary.completedTransactions}
              </div>
              <div>
                <span className="font-semibold">待處理交易:</span>{" "}
                {result.summary.pendingTransactions}
              </div>
              <div>
                <span className="font-semibold">失敗交易:</span>{" "}
                {result.summary.failedTransactions}
              </div>
              <div>
                <span className="font-semibold">來源鏈:</span>{" "}
                {result.summary.sourceChains.join(", ")}
              </div>
              <div>
                <span className="font-semibold">目標鏈ID:</span>{" "}
                {result.summary.destinationChain}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">
              相關交易 ({result.transactions.length})
            </h3>
            {result.transactions.length === 0 ? (
              <p className="text-gray-500">無相關交易記錄</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">交易哈希</th>
                      <th className="p-2 border">狀態</th>
                      <th className="p-2 border">類型</th>
                      <th className="p-2 border">來源鏈</th>
                      <th className="p-2 border">目標鏈</th>
                      <th className="p-2 border">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.transactions.map((tx, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="p-2 border font-mono text-xs truncate max-w-[150px]">
                          {tx.txHash}
                        </td>
                        <td className="p-2 border">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              tx.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : tx.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : tx.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-2 border">{tx.type}</td>
                        <td className="p-2 border">{tx.sourceChain.name}</td>
                        <td className="p-2 border">
                          {tx.destinationChain.name}
                        </td>
                        <td className="p-2 border text-right">{tx.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
