"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { TOKEN_METADATA_MAP } from "@/models/token";
import { ChainSelectItem } from "@/components/dappComponent/ChainChip";
import {
  Key,
  KeyValueDataCard,
  Value,
  Action,
} from "@/components/key-value-data-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

export default function ReceivePage() {
  const { address, isConnected } = useAccount();
  const [selectedChainId, setSelectedChainId] = useState<number>(
    TOKEN_METADATA_MAP.USDC[0].chainId
  );
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const selectedChain = TOKEN_METADATA_MAP.USDC.find(
    (chain) => chain.chainId === selectedChainId
  );

  // 生成支付URL
  const generatePaymentUrl = () => {
    if (!address) return "";

    const params = new URLSearchParams();
    params.set("to", address);
    params.set("chainId", selectedChainId.toString());

    if (amount) {
      params.set("amount", amount);
    }

    if (message) {
      params.set("message", encodeURIComponent(message));
    }

    return `${window.location.origin}/transfer?${params.toString()}`;
  };

  const paymentUrl = generatePaymentUrl();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast.success("收款鏈接已複製到剪貼簿");
    } catch (err) {
      console.error(err);
      toast.error("複製失敗");
    }
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector("#qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = "payment-qr-code.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen p-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6 max-w-screen-sm mx-auto">
            <div className="w-full flex flex-col gap-4 justify-center items-center">
              <ReceiveWidgetSection title="錢包連接">
                <KeyValueDataCard orientation="horizontal">
                  <Key>狀態</Key>
                  <Value className="text-muted-foreground">
                    請先連接錢包以生成收款碼
                  </Value>
                  <Action>
                    <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    </div>
                  </Action>
                </KeyValueDataCard>
              </ReceiveWidgetSection>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6 max-w-screen-sm mx-auto">
          <div className="w-full flex flex-col gap-4 justify-center items-center">
            {/* Receiver Section */}
            <ReceiveWidgetSection title="收款方">
              <KeyValueDataCard orientation="horizontal">
                <Key>收款地址</Key>
                <Value className="text-lg font-bold text-ellipsis overflow-hidden w-full text-gray-500">
                  {address}
                </Value>
                <Action>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await navigator.clipboard.writeText(address || "");
                      toast.success("地址已複製");
                    }}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </Action>
              </KeyValueDataCard>

              <KeyValueDataCard orientation="horizontal">
                <Key>收款網路</Key>
                <Value className="text-lg font-bold text-ellipsis overflow-hidden w-full">
                  <Select
                    value={selectedChainId.toString()}
                    onValueChange={(value) => setSelectedChainId(Number(value))}
                  >
                    <SelectTrigger className="w-full border-0 shadow-none rounded-none px-0 py-2 focus-visible:ring-0 transition-colors">
                      <SelectValue placeholder="選擇網路" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKEN_METADATA_MAP.USDC.map((chain) => (
                        <SelectItem
                          key={chain.chainId}
                          value={chain.chainId.toString()}
                        >
                          <ChainSelectItem
                            label={chain.chainName}
                            tokenImage={chain.tokenImage}
                          />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Value>
              </KeyValueDataCard>

              <KeyValueDataCard orientation="horizontal">
                <Key>指定金額 (可選)</Key>
                <Value className="text-xl font-bold">
                  <AmountInputComponent
                    value={amount}
                    onChange={setAmount}
                    placeholder="0.00"
                  />
                </Value>
                <Action>
                  <Image
                    width={24}
                    height={24}
                    src="/logo/usdc-logo.png"
                    alt="USDC"
                    className="rounded-full"
                  />
                </Action>
              </KeyValueDataCard>

              <KeyValueDataCard orientation="horizontal">
                <Key>備註訊息 (可選)</Key>
                <Value>
                  <MessageInputComponent
                    value={message}
                    onChange={setMessage}
                    placeholder="輸入備註訊息"
                  />
                </Value>
              </KeyValueDataCard>
            </ReceiveWidgetSection>

            {/* QR Code Icon */}
            <ReceiveWidgetIcon />

            {/* QR Code Section */}
            <ReceiveWidgetSection title="收款碼">
              <div className="w-full flex flex-col gap-4">
                {/* QR Code Display */}
                <div className="flex justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border">
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <QRCodeSVG
                      id="qr-code-svg"
                      value={paymentUrl}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-1 gap-3">
                  <KeyValueDataCard orientation="horizontal">
                    <Key>網路</Key>
                    <Value>{selectedChain?.chainName}</Value>
                    <Action>
                      <Image
                        width={20}
                        height={20}
                        src={selectedChain?.tokenImage || ""}
                        alt={selectedChain?.chainName || ""}
                        className="rounded-full"
                      />
                    </Action>
                  </KeyValueDataCard>

                  {amount && (
                    <KeyValueDataCard orientation="horizontal">
                      <Key>指定金額</Key>
                      <Value className="text-lg font-bold">{amount} USDC</Value>
                      <Action>
                        <Image
                          width={20}
                          height={20}
                          src="/logo/usdc-logo.png"
                          alt="USDC"
                          className="rounded-full"
                        />
                      </Action>
                    </KeyValueDataCard>
                  )}

                  {message && (
                    <KeyValueDataCard orientation="horizontal">
                      <Key>備註</Key>
                      <Value>{message}</Value>
                    </KeyValueDataCard>
                  )}
                </div>
              </div>
            </ReceiveWidgetSection>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCopyUrl}
              className="flex-1 py-6 text-lg rounded-xl duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
            >
              <Copy className="w-5 h-5 mr-2" />
              複製收款鏈接
            </Button>
            <Button
              onClick={handleDownloadQR}
              variant="outline"
              className="flex-1 py-6 text-lg rounded-xl duration-200 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition-all"
            >
              <Download className="w-5 h-5 mr-2" />
              下載QR碼
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              其他用戶可以掃描此QR碼或點擊收款鏈接向您轉帳 USDC
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// Helper Components
function ReceiveWidgetSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col gap-2">
      <ReceiveWidgetSectionHeader title={title} />
      {children}
    </div>
  );
}

function ReceiveWidgetSectionHeader({ title }: { title: string }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <h3 className="text-4xl font-thin">{title}</h3>
    </div>
  );
}

function ReceiveWidgetIcon() {
  return (
    <div className="w-12 h-12 flex items-center justify-center rounded-md p-1">
      <QrCode className="w-full h-full text-blue-500" />
    </div>
  );
}

function AmountInputComponent({
  value,
  onChange,
  placeholder = "0.00",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      className="w-full px-0 py-2 bg-transparent border-0 text-2xl font-bold active:border-0 focus:outline-none focus:ring-0 transition-colors"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function MessageInputComponent({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      className="w-full px-0 py-2 bg-transparent border-0 text-lg active:border-0 focus:outline-none focus:ring-0 transition-colors"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={100}
    />
  );
}
