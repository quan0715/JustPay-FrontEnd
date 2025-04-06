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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Check, Loader2 } from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { useApproveERC20 } from "@/hooks/useApproveERC20";
import { ChainToken, ChainTokenList } from "@/models/token";
import { ethers } from "ethers";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import useUpdatingUserData from "@/hooks/useUpdatingUserData";
import { useFactoryContract } from "@/hooks/useFactory";
import { deployCreate2 } from "@/app/_actions/deployCreate2";
// const SPENDER_ADDRESS = process.env.NEXT_PUBLIC_JUSTPAY_SPENDER_ADDRESS;

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
  const { getSpenderAddress } = useFactoryContract();
  const [spenderAddress, setSpenderAddress] = useState<string>("");
  const { isUpdating, updateUser } = useUpdatingUserData();

  const handleApproveSign = async () => {
    if (!selectedNetwork) {
      toast.error("Please select the network");
      return;
    }
    try {
      const spenderAddress = await getSpenderAddress();
      console.log("spenderAddress", spenderAddress);
      await approve({
        spender: spenderAddress as string,
        chainId: selectedNetwork.chainId,
        tokenAddress: selectedNetwork.contractAddress,
        useMax: true,
      });
      setSpenderAddress(spenderAddress as string);
    } catch (error) {
      console.error("Signing error:", error);
      toast.error("Signing error");
    }
  };

  const isNetworkAlreadyAdded = (network: ChainToken) => {
    return userData?.allowances.some(
      (allowance) => allowance.chainName === network.network
    );
  };
  const handleSaveApproval = async () => {
    if (!selectedNetwork) {
      toast.error("Please select the network");
      return;
    }
    toast.success(
      `Successfully signed the USDC authorization on ${selectedNetwork.network}`
    );
    try {
      await deployCreate2(address as `0x${string}`, selectedNetwork.chainId);
      // 這裡應該使用 API 路由來保存簽名數據
      await updateUser({
        address: address as `0x${string}`,
        spenderAddress: spenderAddress as string,
        allowances: [
          ...(userData?.allowances || []),
          {
            chainName: selectedNetwork.network,
            txHash: txHash as string,
            tokenAddress: selectedNetwork.contractAddress,
            amount: ethers.MaxUint256.toString(),
            spenderAddress: spenderAddress,
          },
        ],
      });
      toast.success("Authorization saved to your account");
      // 關閉對話框並刷新用戶數據
      setTimeout(() => {
        setIsDialogOpen(false);
      }, 1500);
    } catch (error) {
      console.error("Saving authorization error:", error);
      toast.error("Saving authorization error");
    }
  };

  // 關閉對話框時重置狀態
  useEffect(() => {
    if (!isDialogOpen) {
      refreshUserData();
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (isSuccess && spenderAddress) {
      handleSaveApproval();
    }
    if (approveError) {
      toast.error(`簽署失敗: ${approveError}`);
    }
  }, [isSuccess, approveError, spenderAddress]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="">
          <Plus className="h-4 w-4 mr-2" />
          Add Network
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Network Authorization</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 w-full">
          <div className="space-y-2 w-full">
            <label htmlFor="network" className="text-sm font-medium">
              Select Network
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
                  <SelectValue placeholder="Select Network" />
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
                            <span>Authorized</span>
                          </>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isSuccess && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md dark:bg-gray-800">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-sm font-medium">
                  Authorization signature created
                </p>
              </div>
              <p className="text-xs text-gray-500 truncate mt-1">
                Signature: {txHash?.substring(0, 20)}...
              </p>
              {isUpdating && (
                <div className="flex items-center mt-2 text-sm text-blue-500">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving authorization data...
                </div>
              )}
              {isSuccess && !isUpdating && (
                <div className="flex items-center mt-2 text-sm text-green-500">
                  <Check className="h-4 w-4 mr-2" />
                  Authorization saved, will close automatically
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isApproving || isUpdating}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleApproveSign}
            disabled={isApproving || isUpdating}
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              "Sign authorization"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
