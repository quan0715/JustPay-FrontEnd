"use server";
import { getSignatureTransaction } from "@/app/_actions/transationRepo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Clock,
  Wallet,
  Hash,
  Calendar,
  Network,
} from "lucide-react";
import { ReactNode } from "react";
import { CCTVTransferButton } from "@/components/transaction/ActionButton";

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
        <Card className="w-full max-w-md p-6 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              找不到交易資訊
            </h1>
            <p className="text-gray-600">請確認交易 ID 是否正確</p>
          </div>
        </Card>
      </div>
    );
  }

  const {
    signature,
    status,
    metaData: {
      sourceChainIds,
      amountsEach,
      expirationTime,
      destinationChainId,
      senderAddress,
    },
  } = signatureTransaction;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {/* 標題區塊 */}
            <div className="px-6 py-5 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Hash className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      交易簽署資訊
                    </h1>
                    <p className="text-sm text-gray-500">
                      交易 ID: {signature_id}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`px-3 py-1 ${
                    statusColorMap[status] || "bg-gray-100"
                  }`}
                >
                  {status}
                </Badge>
              </div>
            </div>

            {/* 交易資訊區塊 */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* 來源鏈資訊 */}
                <InfoCard
                  title="來源鏈資訊"
                  icon={<Network className="h-5 w-5 text-blue-500" />}
                >
                  {sourceChainIds.map((chainId, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-md px-2 transition-colors"
                    >
                      <span className="text-gray-600">鏈 ID {index + 1}</span>
                      <span className="font-medium text-gray-900">
                        {chainId}
                      </span>
                    </div>
                  ))}
                </InfoCard>

                {/* 金額資訊 */}
                <InfoCard
                  title="交易金額"
                  icon={<Wallet className="h-5 w-5 text-green-500" />}
                >
                  {amountsEach.map((amount, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-md px-2 transition-colors"
                    >
                      <span className="text-gray-600">金額 {index + 1}</span>
                      <span className="font-medium text-gray-900">
                        {amount} ETH
                      </span>
                    </div>
                  ))}
                </InfoCard>

                {/* 交易詳情 */}
                <InfoCard
                  title="交易詳情"
                  icon={<Calendar className="h-5 w-5 text-purple-500" />}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 hover:bg-gray-50 rounded-md px-2 transition-colors">
                      <span className="text-gray-600">目標鏈 ID</span>
                      <span className="font-medium text-gray-900">
                        {destinationChainId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 hover:bg-gray-50 rounded-md px-2 transition-colors">
                      <span className="text-gray-600">過期時間</span>
                      <span className="font-medium text-gray-900">
                        {new Date(expirationTime * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </InfoCard>

                {/* 地址資訊 */}
                <InfoCard
                  title="地址資訊"
                  icon={<Wallet className="h-5 w-5 text-orange-500" />}
                >
                  <div className="space-y-2">
                    <span className="text-gray-600 block">發送者地址</span>
                    <code className="font-mono text-sm block p-2 bg-gray-50 rounded-md break-all hover:bg-gray-100 transition-colors">
                      {senderAddress}
                    </code>
                  </div>
                </InfoCard>
              </div>

              {/* 簽名資訊 */}
              <Separator className="my-6" />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    交易簽名
                  </h3>
                </div>
                <code className="font-mono text-sm block p-4 bg-gray-50 rounded-lg break-all hover:bg-gray-100 transition-colors">
                  {signature}
                </code>
              </div>

              {/* 交易狀態 */}
              <Separator className="my-6" />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Clock className="h-5 w-5 text-teal-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    交易狀態
                  </h3>
                </div>
                <div className="space-y-4">
                  {signatureTransaction.tokenTransferLogs?.map((log, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem
                          label="鏈 ID"
                          value={`Chain ${log.sourceChainId}`}
                        />
                        <InfoItem label="狀態" value={log.status} />
                        <InfoItem
                          label="交易類型"
                          value={log.transactionType}
                        />
                        <InfoItem label="金額" value={log.amount} />
                        <InfoItem
                          label="接收地址"
                          value={log.recipientAddress}
                          className="col-span-2"
                        />
                        <InfoItem
                          label="交易 Hash"
                          value={log.txHash}
                          className="col-span-2"
                        />
                        {log.status === "pending" && (
                          <div className="col-span-2 flex">
                            <CCTVTransferButton
                              transactionLog={log}
                              index={index}
                              transactionId={signature_id}
                              destinationChainId={destinationChainId}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 資訊卡片元件
interface InfoCardProps {
  title: string;
  children: ReactNode;
  icon: ReactNode;
}

function InfoCard({ title, children, icon }: InfoCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// 資訊項目元件
interface InfoItemProps {
  label: string;
  value: string;
  className?: string;
}

function InfoItem({ label, value, className = "" }: InfoItemProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <p className="font-medium text-gray-900 break-all">{value}</p>
    </div>
  );
}
