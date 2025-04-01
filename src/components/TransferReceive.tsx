"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Scan, X } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import dynamic from "next/dynamic";

// 動態導入 QR Code 掃描器組件
const QrScanner = dynamic(() => import("./QrScanner"), {
  ssr: false,
});

export function TransferReceive() {
  const { address, isAuthenticated } = useAuth();
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const handleQrCodeScanned = (result: string) => {
    setRecipientAddress(result);
    setShowScanner(false);
  };

  if (!isAuthenticated || !address) {
    return (
      <Card className="w-full">
        <CardContent>
          <p className="text-center py-4">請先連接錢包並完成認證</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm">
        <Tabs defaultValue="send" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="send">傳送 USDC</TabsTrigger>
            <TabsTrigger value="receive">接收 USDC</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="p-6">
            <div className="space-y-6">
              {/* USDC 代幣顯示 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 relative">
                    <Image
                      src="/cryptocurrency-icons/svg/color/usdc.svg"
                      alt="USDC"
                      fill
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">USDC</span>
                    <span className="text-sm text-gray-500">
                      Balance: 0 ($0.00)
                    </span>
                  </div>
                </div>
              </div>

              {/* 收款地址輸入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  收款地址
                </label>
                <div className="relative">
                  <Input
                    className="w-full px-4 py-6 bg-white border-2 border-blue-500 rounded-xl text-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="輸入錢包地址或 ENS 名稱"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-blue-50"
                    onClick={() => setShowScanner(true)}
                  >
                    <Scan className="h-6 w-6 text-blue-500" />
                  </Button>
                </div>
              </div>

              {/* 金額輸入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  轉帳金額
                </label>
                <Input
                  type="number"
                  className="w-full px-4 py-6 bg-white border-2 border-blue-500 rounded-xl text-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <Button className="w-full py-6 text-lg rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors duration-200">
                確認傳送
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="receive" className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">您的錢包地址</h3>
                <p className="text-sm text-gray-500 break-all">{address}</p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <QRCodeSVG value={address} size={200} />
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigator.clipboard.writeText(address)}
              >
                複製地址
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Code 掃描器對話框 */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>掃描 QR Code</DialogTitle>
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 hover:bg-gray-100 rounded-full"
              onClick={() => setShowScanner(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {showScanner && <QrScanner onResult={handleQrCodeScanned} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
