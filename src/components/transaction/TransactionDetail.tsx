import { USDCTransferTransactionMetaDataInput } from "@/models/transaction";
import Image from "next/image";
import { getUSDCMetadata } from "@/models/token";
import { ethers } from "ethers";
export function TransactionInfo({
  transaction,
}: {
  transaction: USDCTransferTransactionMetaDataInput;
}) {
  const getTotalAmount = () => {
    return transaction.expectedProxyDepositForBurnTransactions.reduce(
      (acc, curr) => acc + BigInt(curr.amount),
      BigInt(0)
    );
  };

  const targetChainMetadata = getUSDCMetadata(transaction.destinationChainId);
  return (
    <div className="w-full space-y-4">
      <h3 className="text-sm font-semibold mb-2">交易資訊:</h3>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">可用來源鏈:</span>
        <div className="flex items-center gap-2">
          {transaction.expectedProxyDepositForBurnTransactions.map(
            (proxyAction) => (
              <Image
                key={proxyAction.sourceChainId}
                src={getUSDCMetadata(proxyAction.sourceChainId).tokenImage}
                alt={proxyAction.sourceChainId.toString()}
                width={20}
                height={20}
                className="rounded-full"
              />
            )
          )}
        </div>
      </div>

      {/* 目標鏈 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">目標鏈:</span>
        <div className="flex items-center gap-2">
          <Image
            src={targetChainMetadata.tokenImage}
            alt={targetChainMetadata.chainName}
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="font-medium">{targetChainMetadata.chainName}</span>
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
          <span className="font-medium">
            {ethers.formatUnits(getTotalAmount(), 6)} USDC
          </span>
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

      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">預期交易明細:</h3>
        <div className="space-y-2 p-3 bg-gray-50 rounded-md">
          {transaction.expectedProxyDepositForBurnTransactions.map(
            (item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Image
                    src={getUSDCMetadata(item.sourceChainId).tokenImage || ""}
                    alt={getUSDCMetadata(item.sourceChainId).chainName}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <span className="text-sm">
                    {getUSDCMetadata(item.sourceChainId).chainName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">
                    {ethers.formatUnits(item.amount, 6)}
                  </span>
                  <span className="text-xs text-gray-500">USDC</span>
                </div>
              </div>
            )
          )}
          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
            <span className="text-sm font-medium">總計:</span>
            <span className="text-sm font-bold">
              {ethers.formatUnits(getTotalAmount(), 6)} USDC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
