"use client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Check, Loader2 } from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { useApproveERC20 } from "@/hooks/useApproveERC20";
import { ChainToken, ChainTokenList } from "@/models/token";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import useUpdatingUserData from "@/hooks/useUpdatingUserData";
const SPENDER_ADDRESS = process.env.NEXT_PUBLIC_JUSTPAY_SPENDER_ADDRESS;

export default function AddNetworkDialogWidget() {
  const {
    address,
    data: userData,
    isLoading: isUserLoading,
    refreshData: refreshUserData,
  } = useUserData();

  const {
    approve,
    isApproving,
    txHash,
    error: approveError,
    isSuccess,
  } = useApproveERC20();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<ChainToken | null>(
    null
  );
  const [approveAmount, setApproveAmount] = useState("1000");
  const { isUpdating, updateUser } = useUpdatingUserData();

  const handleApproveSign = async () => {
    if (!selectedNetwork) {
      toast.error("請選擇網絡");
      return;
    }
    try {
      await approve({
        spender: SPENDER_ADDRESS as string,
        amount: approveAmount,
        chainId: selectedNetwork.chainId,
        tokenAddress: selectedNetwork.contractAddress,
      });
    } catch (error) {
      console.error("簽署時發生錯誤:", error);
      toast.error("簽署時發生錯誤");
    }
  };

  const isNetworkAlreadyAdded = (network: ChainToken) => {
    return userData?.allowances.some(
      (allowance) => allowance.chainName === network.network
    );
  };
  const handleSaveApproval = async () => {
    if (!selectedNetwork) {
      toast.error("請選擇網絡");
      return;
    }
    toast.success(`已成功簽署 ${selectedNetwork.network} 上的 USDC 授權`);
    try {
      // 這裡應該使用 API 路由來保存簽名數據
      await updateUser({
        address: address as `0x${string}`,
        allowances: [
          ...(userData?.allowances || []),
          {
            chainName: selectedNetwork.network,
            txHash: txHash as string,
            tokenAddress: selectedNetwork.contractAddress,
            amount: approveAmount,
          },
        ],
      });
      toast.success("授權已保存到您的帳戶");
      // 關閉對話框並刷新用戶數據
      setTimeout(() => {
        setIsDialogOpen(false);
      }, 1500);
    } catch (error) {
      console.error("保存授權時發生錯誤:", error);
      toast.error("保存授權時發生錯誤");
    }
  };

  // 關閉對話框時重置狀態
  useEffect(() => {
    if (!isDialogOpen) {
      refreshUserData();
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (isSuccess) {
      handleSaveApproval();
    }
    if (approveError) {
      toast.error(`簽署失敗: ${approveError}`);
    }
  }, [isSuccess, approveError]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-full ">
          <Plus className="h-4 w-4 mr-2" />
          新增網絡
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加網絡授權</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 w-full">
          <div className="space-y-2 w-full">
            <label htmlFor="network" className="text-sm font-medium">
              選擇網絡
            </label>
            {isUserLoading ? (
              <Skeleton className="w-full h-10" />
            ) : (
              <Select
                onValueChange={(value) =>
                  setSelectedNetwork(
                    ChainTokenList.find(
                      (network) => network.chainId.toString() === value
                    ) || null
                  )
                }
                value={selectedNetwork?.chainId.toString() || ""}
                disabled={isApproving || isUpdating || isUserLoading}
              >
                <SelectTrigger id="network" className="w-full">
                  <SelectValue placeholder="選擇網絡" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {ChainTokenList.map((network) => (
                    <SelectItem
                      // disabled={isNetworkAlreadyAdded(network)}
                      key={network.chainId}
                      value={network.chainId.toString()}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-2">
                        {network.image && (
                          <Image
                            src={network.image}
                            alt={network.network}
                            className="w-4 h-4"
                            width={16}
                            height={16}
                          />
                        )}
                        <span>{network.network}</span>
                        {isNetworkAlreadyAdded(network) && (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>已授權</span>
                          </>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              授權數量 (USDC)
            </label>
            <Input
              id="amount"
              type="number"
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
              placeholder="授權數量"
              disabled={isApproving || isUpdating}
            />
          </div>

          {isSuccess && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md dark:bg-gray-800">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-sm font-medium">授權簽名已創建</p>
              </div>
              <p className="text-xs text-gray-500 truncate mt-1">
                簽名: {txHash?.substring(0, 20)}...
              </p>
              {isUpdating && (
                <div className="flex items-center mt-2 text-sm text-blue-500">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  正在保存授權數據...
                </div>
              )}
              {isSuccess && !isUpdating && (
                <div className="flex items-center mt-2 text-sm text-green-500">
                  <Check className="h-4 w-4 mr-2" />
                  授權已保存，將自動關閉
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isApproving || isUpdating}>
              取消
            </Button>
          </DialogClose>
          <Button
            onClick={handleApproveSign}
            disabled={isApproving || isUpdating}
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                簽署中...
              </>
            ) : (
              "簽署授權"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
