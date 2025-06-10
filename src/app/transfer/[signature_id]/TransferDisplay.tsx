"use client";

import { useState, useEffect, ReactNode } from "react";
import { getSignatureTransaction } from "@/app/_actions/transationRepo";
import { USDCTransferTransactionModel } from "@/models/transaction";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChainChip } from "@/components/dappComponent/ChainChip";
import { getUSDCMetadata } from "@/models/token";
import { ethers } from "ethers";
import { AddressDisplay } from "@/components/AddressDisplay";
import { PendingBadge } from "@/components/transaction/ActionButton";
import { ERC20TransferButton } from "@/components/transaction/ERC20TransferButton";
// import { CCTVTransferButton } from "@/components/transaction/CCTVTransferButton";

// 狀態標籤顏色映射 (從 page.tsx 複製過來，因為 Client Component 無法直接存取 Server Component 的變數)
const statusColorMap: Record<string, string> = {
  done: "bg-green-100 text-green-800 border-green-200",
  signed: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pending: "bg-blue-100 text-blue-800 border-blue-200", // 新增 pending 顏色
  failed: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-gray-100 text-gray-800 border-gray-200",
};

// DataRow 和 DataRowItem (從 page.tsx 複製過來，因為 Client Component 需要它們來渲染)
// 注意：如果這些組件在其他地方共用，最好將它們移到 components 目錄下
function DataRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row items-stretch justify-between gap-2">
      <h3 className="flex-1 text-2xl font-thin">{title}</h3>
      <div className="shrink-0 h-[1px] hidden md:block md:w-[1px] md:h-auto bg-foreground/10 md:mx-2" />
      <div className="flex-[2] flex flex-col justify-start items-start gap-2">
        {children}
      </div>
    </div>
  );
}

function DataRowItem({
  label,
  children,
  className,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-1 justify-start items-start ${className}`}
    >
      <span className="text-sm text-gray-500">{label}</span>
      {children}
    </div>
  );
}

interface TransferDisplayProps {
  initialTransaction: USDCTransferTransactionModel;
}

export function TransferDisplay({ initialTransaction }: TransferDisplayProps) {
  const [transaction, setTransaction] =
    useState<USDCTransferTransactionModel>(initialTransaction);
  const signature_id = initialTransaction.id;
  useEffect(() => {
    if (transaction.status === "pending" || transaction.status === "signed") {
      const intervalId = setInterval(async () => {
        try {
          console.log("Polling for transaction update:", signature_id);
          const updatedTransaction = await getSignatureTransaction({
            id: signature_id,
          });
          console.log("updatedTransaction", updatedTransaction);
          if (updatedTransaction) {
            setTransaction(updatedTransaction);
            if (
              ["done", "failed", "expired", "readyToTransfer"].includes(
                updatedTransaction.status
              )
            ) {
              clearInterval(intervalId);
            }
          } else {
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error polling transaction:", error);
          clearInterval(intervalId);
        }
        // router.refresh();
      }, 5000); // 每 5 秒輪詢一次

      return () => clearInterval(intervalId);
    }
  }, [transaction.status, signature_id]);

  const { status, tokenTransferLogs } = transaction;

  return (
    <>
      <Separator className="my-6" />
      <DataRow title={"交易狀態"}>
        <DataRowItem label="狀態">
          {status === "pending" ? (
            <PendingBadge />
          ) : (
            <Badge
              variant="outline"
              className={`px-3 py-1 ${
                statusColorMap[status] ||
                "bg-gray-100 text-gray-800 border-gray-200" // 添加預設灰色樣式
              }`}
            >
              {status}
            </Badge>
          )}
        </DataRowItem>
        <DataRowItem label="ERC20 轉帳">
          <ERC20TransferButton
            transactionId={signature_id}
            targetAddress={transaction.metaData.recipientAddress}
            targetChainId={transaction.metaData.destinationChainId}
            totalAmount={transaction.metaData.amountsEach
              .reduce((sum, amount) => sum + BigInt(amount), BigInt(0))
              .toString()}
            disabled={status === "pending" || status === "done"}
          />
        </DataRowItem>
      </DataRow>

      {tokenTransferLogs &&
        tokenTransferLogs.map((log, index) => (
          <div key={index}>
            <Separator className="my-6" />
            <DataRow title={`跨鏈交易 ${index + 1}`}>
              <DataRowItem label="鏈 ID">
                <ChainChip
                  key={log.sourceChainId}
                  label={getUSDCMetadata(log.sourceChainId).chainName}
                  tokenImage={getUSDCMetadata(log.sourceChainId).tokenImage}
                />
              </DataRowItem>
              <DataRowItem label="狀態">
                {log.status === "pending" ? (
                  <PendingBadge />
                ) : (
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 ${
                      statusColorMap[log.status] ||
                      "bg-gray-100 text-gray-800 border-gray-200" // 添加預設灰色樣式
                    }`}
                  >
                    {log.status}
                  </Badge>
                )}
              </DataRowItem>
              <DataRowItem label="金額">
                <p className="text-xl font-thin">
                  {ethers.formatUnits(log.amount, 6)} USDC
                </p>
              </DataRowItem>
              {log.txHash && (
                <DataRowItem label="交易 Hash">
                  <AddressDisplay
                    address={log.txHash}
                    chainId={log.sourceChainId}
                    type="txHash"
                    showFullAddress={false}
                  />
                </DataRowItem>
              )}
              {/* <DataRowItem label="手動轉移">
                <CCTVTransferButton
                  transactionId={signature_id}
                  transactionLog={log}
                  index={index}
                  destinationChainId={transaction.metaData.destinationChainId}
                />
              </DataRowItem> */}
            </DataRow>
          </div>
        ))}
    </>
  );
}
