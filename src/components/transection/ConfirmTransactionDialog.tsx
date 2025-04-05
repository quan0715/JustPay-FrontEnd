import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChainToken } from "@/models/token";
import { SignResult, useJustPaySign } from "@/hooks/useJustPaySign";
import { toast } from "sonner";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Image from "next/image";
import { usePrepareProxyAction } from "@/hooks/usePrepareProxyAction";
export type TransactionStage =
  | "confirm"
  | "signing"
  | "verifying"
  | "waiting"
  | "completed"
  | "failed"
  | "ready_to_sign";

interface TransactionData {
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  sourceChain: ChainToken[];
  destinationChain: ChainToken;
}

interface ConfirmTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionData: TransactionData | null;
  onCompleted?: (result: SignResult) => void;
}

// 轉移結果類型定義
interface ProxyActionResult {
  status: "loading" | "error" | "success";
  message: string;
  result?: {
    amount: string;
    sourceChain: ChainToken;
  }[];
}

export function ConfirmTransactionDialog({
  open,
  onOpenChange,
  transactionData,
  onCompleted,
}: ConfirmTransactionDialogProps) {
  const [stage, setStage] = useState<TransactionStage>("confirm");
  const [signResult, setSignResult] = useState<SignResult | null>(null);
  const [proxyActionResult, setProxyActionResult] =
    useState<ProxyActionResult | null>(null);

  const { signMessage } = useJustPaySign();
  const { prepareProxyAction } = usePrepareProxyAction();

  // 處理計算交易明細
  const handleConfirmTransaction = async () => {
    if (!transactionData) return;

    try {
      // 第一步：計算交易明細
      setStage("verifying");

      const proxyResult = await prepareProxyAction({
        totalAmount: transactionData.amount,
        sourceChain: transactionData.sourceChain,
      });
      console.log("prepareProxyAction result:", proxyResult);

      // 確保 proxyResult.status 是指定的字面量類型
      const typedProxyResult = {
        ...proxyResult,
        status: proxyResult.status as "loading" | "error" | "success",
      };

      setProxyActionResult(typedProxyResult);

      // 如果交易明細準備失敗，提前退出
      if (proxyResult.status !== "success") {
        setStage("failed");
        toast.error(`交易準備失敗：${proxyResult.message}`);
        return;
      }

      // 設置狀態為等待用戶確認簽名
      setStage("ready_to_sign");
    } catch (err) {
      console.error("計算交易明細過程中發生錯誤:", err);
      setStage("failed");
      toast.error("計算交易明細過程中發生錯誤");
    }
  };

  // 當對話框打開時自動計算交易明細
  useEffect(() => {
    if (open && transactionData && stage === "confirm") {
      handleConfirmTransaction();
    }
  }, [open, transactionData]);

  // 處理用戶確認後的簽名流程
  const handleProceedToSign = async () => {
    if (!transactionData) return;

    try {
      // 開始簽名流程
      setStage("signing");

      // 執行簽名
      const result = await signMessage({
        chains:
          proxyActionResult?.result?.map((item) => item.sourceChain) || [],
      });

      setSignResult(result);

      if (result.status === "success") {
        console.log("簽名結果:", result);
        console.log("簽名:", result.signature);
        console.log("鏈IDs:", result.sourceChainIds);
        console.log("Nonce:", result.nonce);

        // 第三步：等待交易產生（模擬）
        setStage("waiting");

        // 模擬等待交易階段，3秒後完成
        setTimeout(() => {
          setStage("completed");
          // 觸發完成回調
          if (onCompleted) {
            onCompleted(result);
          }
        }, 3000);
      } else {
        // 簽名失敗
        setStage("failed");
        toast.error(`簽名失敗: ${result.error}`);
      }
    } catch (err) {
      console.error("簽名過程中發生錯誤:", err);
      setStage("failed");
      toast.error("簽名過程中發生錯誤");
    }
  };

  const handleClose = () => {
    // 只有在確認階段或完成/失敗階段才允許關閉
    if (
      stage === "confirm" ||
      stage === "completed" ||
      stage === "failed" ||
      stage === "ready_to_sign"
    ) {
      // 重置狀態
      setStage("confirm");
      setSignResult(null);
      setProxyActionResult(null);
      onOpenChange(false);
    }
  };

  // 根據階段顯示不同的標題
  const stageTitle = {
    confirm: "確認交易資訊",
    verifying: "計算交易明細...",
    ready_to_sign: "請確認交易明細",
    signing: "簽名中...",
    waiting: "等待交易中...",
    completed: `交易完成${
      signResult ? " (Nonce: " + signResult.nonce + ")" : ""
    }`,
    failed: "交易失敗",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{stageTitle[stage]}</DialogTitle>
        </DialogHeader>

        {/* 交易資訊 */}
        {transactionData && (
          <div className="space-y-4 py-4">
            {/* 交易階段指示器 */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    stage === "confirm"
                      ? "bg-blue-500 text-white"
                      : stage === "verifying"
                      ? "bg-blue-500 text-white"
                      : stage === "ready_to_sign" ||
                        stage === "signing" ||
                        stage === "waiting" ||
                        stage === "completed" ||
                        stage === "failed"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {stage === "verifying" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : stage === "ready_to_sign" ||
                    stage === "signing" ||
                    stage === "waiting" ||
                    stage === "completed" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : stage === "failed" && !proxyActionResult ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    "1"
                  )}
                </div>
                <span className="text-xs mt-1">資訊與明細</span>
              </div>
              <div
                className={`h-px flex-grow mx-2 ${
                  stage === "ready_to_sign" ||
                  stage === "signing" ||
                  stage === "waiting" ||
                  stage === "completed"
                    ? "bg-blue-500"
                    : "bg-gray-200"
                }`}
              />
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    stage === "ready_to_sign"
                      ? "bg-yellow-500 text-white"
                      : stage === "signing"
                      ? "bg-blue-500 text-white"
                      : stage === "waiting" || stage === "completed"
                      ? "bg-blue-500 text-white"
                      : stage === "failed" &&
                        proxyActionResult?.status === "success"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {stage === "ready_to_sign" ? (
                    "2"
                  ) : stage === "signing" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : stage === "waiting" || stage === "completed" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : stage === "failed" &&
                    proxyActionResult?.status === "success" ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    "2"
                  )}
                </div>
                <span className="text-xs mt-1">簽名交易</span>
              </div>
              <div
                className={`h-px flex-grow mx-2 ${
                  stage === "waiting" || stage === "completed"
                    ? "bg-blue-500"
                    : "bg-gray-200"
                }`}
              />
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    stage === "waiting"
                      ? "bg-blue-500 text-white"
                      : stage === "completed"
                      ? "bg-green-500 text-white"
                      : stage === "failed" && signResult?.status === "success"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {stage === "waiting" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : stage === "completed" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : stage === "failed" && signResult?.status === "success" ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    "3"
                  )}
                </div>
                <span className="text-xs mt-1">完成交易</span>
              </div>
            </div>

            {/* 來源鏈 */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">可用來源鏈:</span>
              <div className="flex items-center gap-2">
                {transactionData.sourceChain.map((chain) => (
                  <Image
                    key={chain.network}
                    src={chain.image || ""}
                    alt={chain.network.toString()}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* 目標鏈 */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">目標鏈:</span>
              <div className="flex items-center gap-2">
                <Image
                  src={transactionData.destinationChain.image || ""}
                  alt={transactionData.destinationChain.network.toString()}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="font-medium">
                  {transactionData.destinationChain.network.toString()}
                </span>
              </div>
            </div>

            {/* 金額 */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">總金額:</span>
              <div className="flex items-center gap-2">
                <Image
                  src="/logo/usdc-logo.png"
                  alt="USDC"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="font-medium">
                  {transactionData.amount} USDC
                </span>
              </div>
            </div>

            {/* 收款地址 */}
            <div>
              <span className="text-sm text-gray-500">收款地址:</span>
              <div className="p-2 bg-gray-50 rounded-md mt-1 break-all">
                <span className="font-mono text-sm">
                  {transactionData.recipientAddress}
                </span>
              </div>
            </div>

            {/* 交易明細 - 當有轉移結果時才顯示 */}
            {proxyActionResult &&
              proxyActionResult.status === "success" &&
              proxyActionResult.result && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">預期交易明細:</h3>
                  <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                    {proxyActionResult.result.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <Image
                            src={item.sourceChain.image || ""}
                            alt={item.sourceChain.network.toString()}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                          <span className="text-sm">
                            {item.sourceChain.network}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {parseFloat(item.amount).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">USDC</span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                      <span className="text-sm font-medium">總計:</span>
                      <span className="text-sm font-bold">
                        {proxyActionResult.result
                          .reduce(
                            (sum, item) => sum + parseFloat(item.amount),
                            0
                          )
                          .toFixed(2)}{" "}
                        USDC
                      </span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={
              stage !== "confirm" &&
              stage !== "completed" &&
              stage !== "failed" &&
              stage !== "ready_to_sign"
            }
          >
            {stage === "completed"
              ? "完成"
              : stage === "failed"
              ? "關閉"
              : "取消"}
          </Button>
          {stage === "ready_to_sign" && (
            <Button
              onClick={handleProceedToSign}
              disabled={!transactionData || !proxyActionResult}
            >
              確認並簽名
            </Button>
          )}
          {(stage === "signing" ||
            stage === "verifying" ||
            stage === "waiting") && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {stage === "signing"
                ? "簽名中..."
                : stage === "verifying"
                ? "計算中..."
                : "處理中..."}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
