"use server";
import { getSignatureTransaction } from "@/app/_actions/transationRepo";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";
// import { CCTVTransferButton } from "@/components/transaction/ActionButton";
import { ChainChip } from "@/components/dappComponent/ChainChip";
import { getUSDCMetadata } from "@/models/token";
import Image from "next/image";
import { ethers } from "ethers";
import { AddressDisplay } from "@/components/AddressDisplay";
import Link from "next/link";
import { TransferDisplay } from "./TransferDisplay";

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
          <div className="flex flex-col items-start justify-start">
            <Link href="/" className="py-8 flex flex-row items-center gap-2">
              <ArrowLeft className="h-6 w-6 text-gray-500 " />
              <span className="text-gray-500">返回首頁</span>
            </Link>
            <div className="flex flex-row justify-start items-start gap-3">
              <div>
                <h1 className="text-3xl font-bold">交易簽署資訊</h1>
                <p className="text-md text-gray-500">交易 ID: {signature_id}</p>
              </div>
            </div>
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
                type="address"
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
                chainId={destinationChainId}
                type="address"
                showFullAddress={false}
              />
            </DataRowItem>
          </DataRow>
          <TransferDisplay initialTransaction={signatureTransaction} />
        </div>
      </div>
    </div>
  );
}

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
