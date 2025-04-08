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
import { SignProxyOffChainTransaction } from "@/models/transaction";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
// 交易階段定義
export type TransactionStage =
  | "confirm"
  | "verifying"
  | "ready_to_sign"
  | "signing"
  | "waiting"
  | "completed"
  | "failed";

// 交易階段配置
const TRANSACTION_STAGES: {
  [key in TransactionStage]: {
    title: string;
    stepIndex: number;
    canClose: boolean;
    buttonText?: string;
  };
} = {
  confirm: {
    title: "確認交易資訊",
    stepIndex: 0,
    canClose: true,
  },
  verifying: {
    title: "計算交易明細...",
    stepIndex: 0,
    canClose: false,
  },
  ready_to_sign: {
    title: "請確認交易明細",
    stepIndex: 1,
    canClose: true,
    buttonText: "確認並簽名",
  },
  signing: {
    title: "簽名中...",
    stepIndex: 1,
    canClose: false,
  },
  waiting: {
    title: "等待交易中...",
    stepIndex: 2,
    canClose: false,
  },
  completed: {
    title: "交易完成",
    stepIndex: 2,
    canClose: true,
    buttonText: "完成",
  },
  failed: {
    title: "交易失敗",
    stepIndex: 2,
    canClose: true,
    buttonText: "關閉",
  },
};

// 元件 Props 類型定義
interface ConfirmTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionData: SignProxyOffChainTransaction | null;
  onCompleted?: (result: SignResult) => void;
}

// 代理操作結果類型定義
interface ProxyActionResult {
  status: "loading" | "error" | "success";
  message: string;
  result?: {
    amount: bigint;
    sourceChain: ChainToken;
  }[];
}

// PIPE 處理器類型定義
type PipeHandler<T, R> = (input: T) => Promise<R>;

// 重用元件：步驟指示器
function StepIndicator({ currentStage }: { currentStage: TransactionStage }) {
  // 獲取當前步驟索引
  const currentStepIndex = TRANSACTION_STAGES[currentStage].stepIndex;

  // 構建步驟狀態數據
  const steps = [
    {
      index: 0,
      label: "資訊與明細",
      isActive: currentStepIndex >= 0,
      isLoading: currentStage === "verifying",
      isCompleted: currentStepIndex > 0,
      isError: currentStage === "failed" && currentStepIndex === 0,
    },
    {
      index: 1,
      label: "簽名交易",
      isActive: currentStepIndex >= 1,
      isLoading: currentStage === "signing",
      isCompleted: currentStepIndex > 1,
      isError: currentStage === "failed" && currentStepIndex === 1,
    },
    {
      index: 2,
      label: "完成交易",
      isActive: currentStepIndex >= 2,
      isLoading: currentStage === "waiting",
      isCompleted: currentStage === "completed",
      isError: currentStage === "failed" && currentStepIndex === 2,
    },
  ];

  return (
    <div className="flex justify-between items-center">
      {steps.map((step, idx) => (
        <React.Fragment key={`step-${step.index}`}>
          <div className="flex flex-col items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                step.isLoading
                  ? "bg-blue-500 text-white"
                  : step.isCompleted
                  ? "bg-blue-500 text-white"
                  : step.isActive
                  ? "bg-yellow-500 text-white"
                  : step.isError
                  ? "bg-red-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {step.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : step.isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : step.isError ? (
                <XCircle className="h-5 w-5" />
              ) : (
                step.index + 1
              )}
            </div>
            <span className="text-xs mt-1">{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`h-px flex-grow mx-2 ${
                currentStepIndex > idx ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// 重用元件：交易資訊顯示
function TransactionInfo({
  transaction,
}: {
  transaction: SignProxyOffChainTransaction;
}) {
  return (
    <div className="space-y-4">
      {/* 來源鏈 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">可用來源鏈:</span>
        <div className="flex items-center gap-2">
          {transaction.sourceChain.map((chain) => (
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
            src={transaction.destinationChain.image || ""}
            alt={transaction.destinationChain.network.toString()}
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="font-medium">
            {transaction.destinationChain.network.toString()}
          </span>
        </div>
      </div>

      {/* 金額 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">總數量:</span>
        <div className="flex items-center gap-2">
          <Image
            src="/logo/usdc-logo.png"
            alt="USDC"
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="font-medium">{transaction.amount} USDC</span>
        </div>
      </div>

      {/* 收款地址 */}
      <div>
        <span className="text-sm text-gray-500">收款地址:</span>
        <div className="p-2 bg-gray-50 rounded-md mt-1 break-all">
          <span className="font-mono text-sm">
            {transaction.recipientAddress}
          </span>
        </div>
      </div>
    </div>
  );
}

// 重用元件：交易明細顯示
function TransactionDetails({
  proxyResult,
}: {
  proxyResult: ProxyActionResult;
}) {
  if (proxyResult.status !== "success" || !proxyResult.result) {
    return null;
  }

  const total = proxyResult.result.reduce(
    (sum, item) => sum + parseFloat(item.amount.toString()),
    0
  );

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold mb-2">預期交易明細:</h3>
      <div className="space-y-2 p-3 bg-gray-50 rounded-md">
        {proxyResult.result.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image
                src={item.sourceChain.image || ""}
                alt={item.sourceChain.network.toString()}
                width={16}
                height={16}
                className="rounded-full"
              />
              <span className="text-sm">{item.sourceChain.network}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {ethers.formatUnits(item.amount, 6)}
              </span>
              <span className="text-xs text-gray-500">USDC</span>
            </div>
          </div>
        ))}
        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
          <span className="text-sm font-medium">總計:</span>
          <span className="text-sm font-bold">
            {ethers.formatUnits(total, 6)} USDC
          </span>
        </div>
      </div>
    </div>
  );
}

// 重用元件：操作按鈕區域
function ActionButtons({
  stage,
  canProceed,
  onClose,
  onProceed,
  signResult,
}: {
  stage: TransactionStage;
  canProceed: boolean;
  onClose: () => void;
  onProceed: () => void;
  signResult?: SignResult | null;
}) {
  const router = useRouter();

  // 處理查看交易記錄按鈕點擊
  const handleViewTransactions = () => {
    router.push("/transactions");
    onClose();
  };

  // 各階段的按鈕顯示
  switch (stage) {
    case "ready_to_sign":
      return (
        <Button
          onClick={onProceed}
          disabled={!canProceed}
          className="w-full"
          size="lg"
        >
          確認並簽名
        </Button>
      );
    case "signing":
    case "waiting":
    case "verifying":
      return (
        <Button disabled className="w-full" size="lg">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          請稍等
        </Button>
      );
    case "completed":
      return (
        <div className="flex w-full gap-2">
          <Button onClick={onClose} className="flex-1" size="lg">
            <CheckCircle className="mr-2 h-4 w-4" />
            完成
          </Button>
          {signResult?.signatureTransactionId && (
            <Button
              onClick={handleViewTransactions}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              查看交易記錄
            </Button>
          )}
        </div>
      );
    case "failed":
      return (
        <Button
          onClick={onClose}
          variant="destructive"
          className="w-full"
          size="lg"
        >
          <XCircle className="mr-2 h-4 w-4" />
          關閉
        </Button>
      );
    default:
      return (
        <Button onClick={onClose} className="w-full" size="lg">
          關閉
        </Button>
      );
  }
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

  const { signMessage, executeBurnProxy } = useJustPaySign();
  const { prepareProxyAction } = usePrepareProxyAction();
  const { address } = useAuth();
  const { data: userData } = useUserData();

  // PIPE 流程處理函數

  // 階段1: 準備交易 - 計算交易明細
  const prepareTransaction: PipeHandler<
    SignProxyOffChainTransaction,
    ProxyActionResult
  > = async (transaction) => {
    setStage("verifying");

    try {
      const proxyResult = await prepareProxyAction({
        totalAmount: transaction.amount,
        sourceChain: transaction.sourceChain,
      });

      console.log("prepareProxyAction result:", proxyResult);

      // 將結果轉換為指定類型
      const typedProxyResult = {
        ...proxyResult,
        status: proxyResult.status as "loading" | "error" | "success",
      };

      setProxyActionResult(typedProxyResult);

      if (typedProxyResult.status === "success") {
        setStage("ready_to_sign");
      } else {
        setStage("failed");
        toast.error(`交易準備失敗：${typedProxyResult.message}`);
      }

      return typedProxyResult;
    } catch (error) {
      console.error("計算交易明細過程中發生錯誤:", error);
      setStage("failed");
      toast.error("計算交易明細過程中發生錯誤");

      return {
        status: "error",
        message: error instanceof Error ? error.message : "未知錯誤",
      };
    }
  };

  // 階段2: 簽名交易
  const signTransaction: PipeHandler<
    ProxyActionResult,
    SignResult | null
  > = async (proxyResult) => {
    if (proxyResult.status !== "success" || !transactionData) {
      return null;
    }

    setStage("signing");

    try {
      const result = await signMessage({
        targetAddress: transactionData.recipientAddress,
        destinationChainId: transactionData.destinationChain.chainId,
        sourceChains:
          proxyResult.result?.map((item) => ({
            amount: item.amount,
            sourceChain: item.sourceChain,
          })) || [],
      });

      setSignResult(result);

      if (result.status === "success") {
        console.log("簽名結果:", result);
        setStage("waiting");
        return result;
      } else {
        setStage("failed");
        toast.error(`簽名失敗: ${result.error}`);
        return result;
      }
    } catch (error) {
      console.error("簽名過程中發生錯誤:", error);
      setStage("failed");
      toast.error("簽名過程中發生錯誤");

      return null;
    }
  };

  // 階段3: 完成交易 - 確保執行 burnProxy 操作
  const finalizeTransaction: PipeHandler<SignResult | null, void> = async (
    result
  ) => {
    if (
      !result ||
      result.status !== "success" ||
      !proxyActionResult ||
      !proxyActionResult.result ||
      !transactionData
    ) {
      return;
    }

    try {
      setStage("waiting");

      // 取得用戶地址
      const userAddress = address || "";

      console.log("簽名交易記錄ID:", result.signatureTransactionId);

      // 對每個來源鏈執行 burnProxy (重要：這是唯一執行 burnProxy 的地方)
      for (const [index, item] of proxyActionResult.result.entries()) {
        console.log(`執行第 ${index + 1} 個來源鏈的 burnProxy:`, item);
        if (
          item.sourceChain.chainId === transactionData.destinationChain.chainId
        ) {
          console.log(`跳過與目標鏈相同的來源鏈: ${item.sourceChain.chainId}`);
          continue;
        }
        // amount 0 不執行
        if (item.amount === BigInt(0)) {
          console.log(`跳過金額為 0 的來源鏈: ${item.sourceChain.chainId}`);
          continue;
        }

        // 從 proxyResult 獲取來源鏈和金額
        const sourceChainId = item.sourceChain.chainId;
        console.log(`處理來源鏈 ID: ${sourceChainId}, 金額: ${item.amount}`);

        // 從 transactionData 獲取目標鏈和地址
        const destinationChainId = transactionData.destinationChain.chainId;
        const recipientAddress = transactionData.recipientAddress;

        // 從 signResult 獲取對應的 nonce 和簽名
        const signature = result.signature as string;

        try {
          console.log(
            `開始執行 burnProxy: 從鏈 ${sourceChainId} 到 ${destinationChainId}`
          );
          console.log(`spenderAddress: ${userData?.spenderAddress}`);

          // 執行 burnProxy 並獲取結果
          const burnResult = await executeBurnProxy(
            userData?.spenderAddress as string,
            item.amount,
            sourceChainId,
            destinationChainId,
            signature,
            result.sourceChainIds,
            result.amountsEach,
            result.nonces,
            result.expirationTime,
            destinationChainId,
            recipientAddress,
            userAddress
          );

          // 處理交易結果
          if (burnResult && burnResult.status === "success") {
            toast.success(
              `交易已提交至區塊鏈，交易哈希: ${burnResult.transactionHash}`
            );

            // 如果有交易記錄ID，可以顯示查看交易記錄的連結
            if (burnResult.transactionLogId) {
              console.log("交易記錄ID:", burnResult.transactionLogId);
              console.log("簽名交易記錄ID:", result.signatureTransactionId);
              console.log("Circle ID:", burnResult.circleId || "無");
            }
          } else if (burnResult) {
            toast.error(`交易失敗: ${burnResult.message}`);
          }
        } catch (error) {
          console.error(`執行第 ${index + 1} 個源鏈的交易時出錯:`, error);
          toast.error(
            `交易執行錯誤: ${
              error instanceof Error ? error.message : "未知錯誤"
            }`
          );
        }
      }

      // 設置完成狀態
      setStage("completed");

      // 觸發完成回調
      if (onCompleted && result) {
        onCompleted(result);
      }
    } catch (error) {
      console.error("執行 burnProxy 過程中發生錯誤:", error);
      setStage("failed");
      toast.error("執行交易過程中發生錯誤");
    }
  };

  // 組合PIPE流程
  const executePipeline = async () => {
    if (!transactionData) return;

    try {
      await prepareTransaction(transactionData);
      // 階段1結束後不自動進入階段2，由用戶點擊確認按鈕觸發
    } catch (error) {
      console.error("交易流程執行失敗:", error);
    }
  };

  // 用戶確認後處理簽名和後續流程
  const handleProceedToSign = async () => {
    if (!transactionData || !proxyActionResult) return;

    try {
      // 執行簽名階段
      const signResult = await signTransaction(proxyActionResult);

      // 執行最終階段
      if (signResult && signResult.status === "success") {
        await finalizeTransaction(signResult);
      }
    } catch (error) {
      console.error("處理交易簽名過程中發生錯誤:", error);
    }
  };

  // 當對話框打開時自動開始流程
  useEffect(() => {
    if (open && transactionData && stage === "confirm") {
      executePipeline();
    }
  }, [open, transactionData]);

  // 處理對話框關閉
  const handleClose = () => {
    const stageConfig = TRANSACTION_STAGES[stage];

    if (stageConfig.canClose) {
      // 重置狀態
      setStage("confirm");
      setSignResult(null);
      setProxyActionResult(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{TRANSACTION_STAGES[stage].title}</DialogTitle>
        </DialogHeader>

        {transactionData && (
          <div className="space-y-4 py-4">
            {/* 步驟指示器 */}
            <StepIndicator currentStage={stage} />

            {/* 交易資訊 */}
            <TransactionInfo transaction={transactionData} />

            {/* 交易明細 - 當有轉移結果時才顯示 */}
            {proxyActionResult && (
              <TransactionDetails proxyResult={proxyActionResult} />
            )}
          </div>
        )}

        <DialogFooter>
          <ActionButtons
            stage={stage}
            canProceed={
              !!transactionData &&
              !!proxyActionResult &&
              proxyActionResult.status === "success"
            }
            onClose={handleClose}
            onProceed={handleProceedToSign}
            signResult={signResult}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
