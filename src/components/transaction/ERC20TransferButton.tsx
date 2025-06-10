"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChainChip } from "@/components/dappComponent/ChainChip";
import { getUSDCMetadata } from "@/models/token";
import { useContractWrite } from "@/hooks/useContractInteraction";
import { ethers } from "ethers";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { updateTransaction } from "@/app/_actions/transationRepo";

interface ERC20TransferButtonProps {
  transactionId: string;
  targetAddress: string; // 目標錢包地址
  targetChainId: number; // 目標鏈ID
  totalAmount: string; // 總交易金額
  disabled?: boolean;
}

export function ERC20TransferButton({
  transactionId,
  targetAddress,
  targetChainId,
  totalAmount,
  disabled = false,
}: ERC20TransferButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { writeContract, status, errorMessage } = useContractWrite();

  const targetChainMetadata = getUSDCMetadata(targetChainId);

  const isValidAddress = (address: string) => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  const canTransfer =
    isValidAddress(targetAddress) &&
    totalAmount &&
    parseFloat(totalAmount) > 0 &&
    status !== "Pending";

  const handleTransfer = async () => {
    if (!canTransfer) {
      return;
    }

    try {
      // const amountWei = ethers.parseUnits(totalAmount, 6); // USDC 有 6 位小數

      // ERC20 轉帳 ABI
      const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
      ];
      console.log(
        {
          contractAddress: targetChainMetadata.tokenContractAddress,
          contractAbi: erc20Abi,
          chainId: targetChainId,
        },
        "transfer",
        [targetAddress, totalAmount]
      );
      const tx = await writeContract(
        {
          contractAddress: targetChainMetadata.tokenContractAddress,
          contractAbi: erc20Abi,
          chainId: targetChainId,
        },
        "transfer",
        [targetAddress, totalAmount]
        // { waitForTx: true }
      );
      if (!tx) {
        throw new Error("轉帳失敗");
      }
      // const txHash = await depositToAAVE(
      //   targetChainMetadata.tokenContractAddress,
      //   totalAmount,
      //   targetChainId
      // );
      // console.log("txHash", txHash);
      // update transaction status to readyToTransfer
      await updateTransaction({
        id: transactionId,
        update: {
          status: "done",
        },
      });

      toast.success("轉帳成功！");
      setIsOpen(false);
    } catch (error) {
      console.error("轉帳失敗:", error);
      toast.error("轉帳失敗，請重試");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          ERC20 轉帳
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ERC20 USDC 轉帳</DialogTitle>
          <DialogDescription>轉帳 USDC 到目標錢包地址</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 目標鏈顯示 */}
          <div className="space-y-2">
            <Label>目標區塊鏈</Label>
            <div className="p-2 border rounded-md bg-gray-50">
              <ChainChip
                label={targetChainMetadata.chainName}
                tokenImage={targetChainMetadata.tokenImage}
              />
            </div>
          </div>

          {/* 目標地址顯示 */}
          <div className="space-y-2">
            <Label>收款地址</Label>
            <div className="p-2 border rounded-md bg-gray-50 text-sm font-mono">
              {targetAddress}
            </div>
          </div>

          {/* 轉帳金額顯示 */}
          <div className="space-y-2">
            <Label>轉帳金額</Label>
            <div className="p-2 border rounded-md bg-gray-50 text-lg font-semibold">
              {parseFloat(ethers.formatUnits(totalAmount, 6)).toFixed(2)} USDC
            </div>
          </div>

          {/* 錯誤訊息 */}
          {errorMessage && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {errorMessage}
            </div>
          )}

          {/* 確認按鈕 */}
          <Button
            onClick={handleTransfer}
            disabled={!canTransfer}
            className="w-full"
          >
            {status === "Pending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                轉帳中...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                確認轉帳
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
