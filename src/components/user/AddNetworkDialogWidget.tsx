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
import { useEnableNetwork } from "@/hooks/useEnableNetwork";
import { ChainToken, ChainTokenList } from "@/models/token";
import { ethers } from "ethers";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import useUpdatingUserData from "@/hooks/useUpdatingUserData";
import { InteractionStatusMessage } from "@/components/contract/InteractionStatusMessage";
import { useUser } from "@/hooks/useUserData";
import { useRouter } from "next/navigation";

export default function AddNetworkDialogWidget() {
  const { userData, isLoadingUserData } = useUser();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<ChainToken | null>(
    null
  );
  const [spenderAddress, setSpenderAddress] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const { isUpdating, updateUser } = useUpdatingUserData();

  const {
    getSpenderAddress,
    getSpenderAddressStatus,
    approveERC20,
    approveStatus,
    deployCreate2,
    deployCreate2Status,
  } = useEnableNetwork();

  const isApproving =
    deployCreate2Status === "Pending" ||
    approveStatus === "Pending" ||
    getSpenderAddressStatus === "Pending";

  const isNetworkAlreadyAdded = (network: ChainToken) => {
    return userData?.allowances.some(
      (allowance) => allowance.chainName === network.network
    );
  };

  const onSubmit = async () => {
    if (!selectedNetwork) {
      toast.error("Please select the network");
      return;
    }
    if (!userData) {
      toast.error("Please connect your wallet");
      return;
    }
    const spenderAddress = await getSpenderAddress({
      chainId: selectedNetwork.chainId,
      userAddress: userData.address,
      salt: userData?.salt,
    });
    if (spenderAddress) {
      setSpenderAddress(spenderAddress as string);
    }
  };

  useEffect(() => {
    const handleUpdateUserData = async () => {
      if (!selectedNetwork) {
        toast.error("Please select the network");
        return;
      }
      if (!userData) {
        toast.error("Please connect your wallet");
        return;
      }
      await updateUser({
        ...userData,
        spenderAddress: spenderAddress as string,
        allowances: [
          ...userData.allowances,
          {
            chainId: selectedNetwork.chainId,
            chainName: selectedNetwork.network,
            txHash: txHash,
            tokenAddress: selectedNetwork.contractAddress,
            amount: ethers.MaxUint256.toString(),
            spenderAddress: spenderAddress,
          },
        ],
      });
      toast.success("Updated user data");
      setIsDialogOpen(false);
      router.refresh();
    };
    if (deployCreate2Status === "Success" && txHash) {
      toast.success("Deployed create2");
      handleUpdateUserData();
    }
  }, [deployCreate2Status, txHash]);

  useEffect(() => {
    const handleCreate2 = async () => {
      if (!selectedNetwork) {
        toast.error("Please select the network");
        return;
      }
      if (!userData) {
        toast.error("Please connect your wallet");
        return;
      }
      const txHash = await deployCreate2({
        userAddress: userData.address,
        chainId: selectedNetwork.chainId,
        salt: userData.salt,
      });
      setTxHash(txHash as string);
    };
    if (approveStatus === "Failed") {
      toast.error("Approve failed");
    }
    if (approveStatus === "Success") {
      handleCreate2();
    }
  }, [approveStatus]);

  useEffect(() => {
    const handleApprove = async () => {
      if (!selectedNetwork) {
        toast.error("Please select the network");
        return;
      }
      await approveERC20({
        spenderAddress: spenderAddress as string,
        chainId: selectedNetwork.chainId,
        tokenAddress: selectedNetwork.contractAddress,
        useMax: true,
      });
    };

    if (getSpenderAddressStatus === "Success") {
      if (spenderAddress) {
        toast.success("Get spender address success");
        handleApprove();
      }
    }
    if (getSpenderAddressStatus === "Failed") {
      toast.error("Get spender address failed");
    }
  }, [getSpenderAddressStatus, spenderAddress]);

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
            {isLoadingUserData ? (
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
                disabled={isApproving || isUpdating || isLoadingUserData}
              >
                <SelectTrigger id="network" className="w-full">
                  <SelectValue placeholder="Select Network" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {ChainTokenList.map((network) => (
                    <SelectItem
                      disabled={isNetworkAlreadyAdded(network)}
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

          <InteractionStatusMessage
            status={getSpenderAddressStatus}
            pendingMessage="Getting spender address..."
            successMessage={`Spender address: ${spenderAddress}`}
            errorMessage="Getting spender address failed"
          />

          <InteractionStatusMessage
            status={approveStatus}
            pendingMessage="Approving with USDC..."
            successMessage="Approved with USDC"
            errorMessage="Approving with USDC failed"
          />

          <InteractionStatusMessage
            status={deployCreate2Status}
            pendingMessage="Deploying create2..."
            successMessage="Deployed create2"
            errorMessage="Deploying create2 failed"
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isApproving || isUpdating}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={isApproving || isUpdating || !selectedNetwork}
            onClick={onSubmit}
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Enable Network"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
