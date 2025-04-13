"use server";
import { getSignatureTransaction } from "@/app/_actions/transationRepo";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Hash, Loader2 } from "lucide-react";
import { ReactNode } from "react";
// import { CCTVTransferButton } from "@/components/transaction/ActionButton";
import { ChainChip } from "@/components/dappComponent/ChainChip";
import { getUSDCMetadata } from "@/models/token";
import Image from "next/image";
import { ethers } from "ethers";
import { AddressDisplay } from "@/components/AddressDisplay";
// 狀態標籤顏色映射
const statusColorMap: Record<string, string> = {
  done: "bg-green-100 text-green-800 border-green-200",
  signed: "bg-yellow-100 text-yellow-800 border-yellow-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-gray-100 text-gray-800 border-gray-200",
};

export default async function TransferPage({
  params,
}: {
  params: Promise<{
    signature_id: string;
  }>;
}) {
  const { signature_id } = await params;
  const signatureTransaction = await getSignatureTransaction({
    id: signature_id,
  });

  if (!signatureTransaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md p-6 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              找不到交易資訊
            </h1>
            <p className="text-gray-600">請確認交易 ID 是否正確</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    status,
    metaData: {
      sourceChainIds,
      amountsEach,
      destinationChainId,
      senderAddress,
    },
  } = signatureTransaction;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col justify-start items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">交易簽署資訊</h1>
                <p className="text-sm text-gray-500">交易 ID: {signature_id}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`px-3 py-1 ${statusColorMap[status] || "bg-gray-100"}`}
            >
              {status === "pending" && (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4" />
                  <span>Pending</span>
                </span>
              )}
              {status}
            </Badge>
          </div>
          <Separator className="my-6" />
          <DataRow title="交易總金額">
            <DataRowItem label="金額">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-thin">
                  {ethers.formatUnits(
                    amountsEach.reduce((sum, amount) => {
                      return sum + Number(amount);
                    }, 0),
                    6
                  )}{" "}
                  USDC
                </p>
                <Image
                  src="/logo/usdc-logo.png"
                  alt="USDC"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
            </DataRowItem>
          </DataRow>
          <Separator className="my-6" />
          <DataRow title="發送者地址">
            <DataRowItem label="鏈 ID">
              <div className="flex flex-row gap-2">
                {sourceChainIds.map((chainId) => (
                  <ChainChip
                    key={chainId}
                    label={getUSDCMetadata(chainId).chainName}
                    tokenImage={getUSDCMetadata(chainId).tokenImage}
                  />
                ))}
              </div>
            </DataRowItem>
            <DataRowItem label="地址">
              <AddressDisplay
                address={senderAddress}
                chainId={sourceChainIds[0]}
                showFullAddress={false}
              />
            </DataRowItem>
          </DataRow>
          <Separator className="my-6" />
          <DataRow title="目標錢包地址">
            <DataRowItem label="鏈 ID">
              <ChainChip
                key={destinationChainId}
                label={getUSDCMetadata(destinationChainId).chainName}
                tokenImage={getUSDCMetadata(destinationChainId).tokenImage}
              />
            </DataRowItem>
            <DataRowItem label="地址">
              <AddressDisplay
                address={senderAddress}
                chainId={sourceChainIds[0]}
                showFullAddress={false}
              />
            </DataRowItem>
          </DataRow>
          {signatureTransaction.tokenTransferLogs &&
            signatureTransaction.tokenTransferLogs.map((log, index) => (
              <div key={index}>
                <Separator className="my-6" />
                <DataRow key={index} title={`跨鏈交易 ${index + 1}`}>
                  <DataRowItem label="鏈 ID">
                    <ChainChip
                      key={log.sourceChainId}
                      label={getUSDCMetadata(log.sourceChainId).chainName}
                      tokenImage={getUSDCMetadata(log.sourceChainId).tokenImage}
                    />
                  </DataRowItem>
                  <DataRowItem label="狀態">
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 ${
                        statusColorMap[log.status] || "bg-gray-100"
                      }`}
                    >
                      {log.status}
                    </Badge>
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
                        showFullAddress={false}
                      />
                    </DataRowItem>
                  )}
                </DataRow>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function DataRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row items-stretch justify-between gap-2">
      <h3 className="flex-1 text-2xl font-thin">{title}</h3>
      <div className="shrink-0 h-[1px] w-full md:w-[1px] md:h-auto bg-foreground/10 md:mx-2" />
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
