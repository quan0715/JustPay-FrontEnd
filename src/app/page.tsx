"use client";
// import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import "@rainbow-me/rainbowkit/styles.css";
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";
import { AuthStatus } from "@/components/AuthStatus";

export default function Home() {
  // const [address, setAddress] = useState("");
  // const [accountInfo, setAccountInfo] = useState<any>(null);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState("");

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError("");
  //   setAccountInfo(null);

  //   try {
  //     const response = await fetch(`/api/rpc-test?address=${address}`);
  //     const data = await response.json();

  //     if (response.ok) {
  //       setAccountInfo(data);
  //     } else {
  //       setError(data.error || "查詢失敗");
  //     }
  //   } catch (err) {
  //     setError("發生錯誤，請稍後再試");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <main className="min-h-screen p-8 bg-background">
      {/* <ConnectButton /> */}
      <div className="max-w-2xl mx-auto space-y-6">
        <AuthStatus />
        {/* <Card>
          <CardHeader>
            <CardTitle>以太坊地址查詢</CardTitle>
            <CardDescription>輸入以太坊地址以查看帳戶資訊</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <Input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="請輸入以太坊地址"
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !address}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      查詢中
                    </>
                  ) : (
                    "查詢"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card> */}

        {/* {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {accountInfo && (
          <Card>
            <CardHeader>
              <CardTitle>帳戶資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center">
                  <span className="font-medium">地址</span>
                  <span className="col-span-2 font-mono break-all">
                    {accountInfo.address}
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span className="font-medium">餘額</span>
                  <span className="col-span-2">
                    {accountInfo.基本資訊.餘額}
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span className="font-medium">交易次數</span>
                  <span className="col-span-2">
                    {accountInfo.基本資訊.交易次數}
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span className="font-medium">是否為合約</span>
                  <span className="col-span-2">
                    {accountInfo.基本資訊.是否為合約}
                  </span>
                </div>
              </div>

              {accountInfo.基本資訊.是否為合約 === "是" && (
                <div className="pt-4">
                  <h3 className="font-medium mb-2">合約代碼</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {accountInfo.基本資訊.合約代碼}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {accountInfo?.最近交易?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>最近交易記錄</CardTitle>
              <CardDescription>顯示最近的交易記錄</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountInfo.最近交易.map((tx: any, index: number) => (
                  <div key={tx.hash} className="p-4 border rounded-lg">
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center">
                        <span className="font-medium">交易類型</span>
                        <span className="col-span-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tx.type === "合約創建"
                                ? "bg-blue-100 text-blue-800"
                                : tx.type === "ETH 轉帳"
                                ? "bg-green-100 text-green-800"
                                : tx.type === "ERC20 代幣轉帳"
                                ? "bg-purple-100 text-purple-800"
                                : tx.type === "合約互動"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 items-center">
                        <span className="font-medium">交易哈希</span>
                        <span className="col-span-2 font-mono text-sm break-all">
                          {tx.hash}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 items-center">
                        <span className="font-medium">發送方</span>
                        <span className="col-span-2 font-mono text-sm break-all">
                          {tx.from}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 items-center">
                        <span className="font-medium">接收方</span>
                        <span className="col-span-2 font-mono text-sm break-all">
                          {tx.to || "合約創建"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 items-center">
                        <span className="font-medium">金額</span>
                        <span className="col-span-2">{tx.value} ETH</span>
                      </div>
                      <div className="grid grid-cols-3 items-center">
                        <span className="font-medium">區塊高度</span>
                        <span className="col-span-2">{tx.blockNumber}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center">
                        <span className="font-medium">時間</span>
                        <span className="col-span-2">
                          {tx.timestamp
                            ? new Date(tx.timestamp * 1000).toLocaleString()
                            : "未知"}
                        </span>
                      </div>
                      {tx.data && tx.data !== "0x" && (
                        <div className="grid grid-cols-3 items-center">
                          <span className="font-medium">交易數據</span>
                          <span className="col-span-2 font-mono text-sm break-all">
                            {tx.data}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )} */}
      </div>
    </main>
  );
}
