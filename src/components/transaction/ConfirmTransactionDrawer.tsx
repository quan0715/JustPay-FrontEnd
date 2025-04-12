import { useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { USDCTransferTransactionMetaDataInput } from "@/models/transaction";
import { TransactionInfo } from "./TransactionDetail";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { createSignatureTransaction } from "@/app/_actions/transationRepo";
import { useProxySign } from "@/hooks/useMessageSign";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { executeSignatureTransaction } from "@/app/_actions/transaction";
import { useUser } from "@/hooks/useUserData";
// 元件 Props 類型定義
interface ConfirmTransactionDialogProps {
  open: boolean;
  transactionData: USDCTransferTransactionMetaDataInput;
  setOpen: (open: boolean) => void;
  onActionSuccess: () => void;
}

export function ConfirmTransactionDrawer({
  open,
  setOpen,
  transactionData,
  onActionSuccess,
}: ConfirmTransactionDialogProps) {
  const { signProxy, signData, signature, status, errorMessage, reset } =
    useProxySign();

  const { userData } = useUser();

  const router = useRouter();
  const [isSyncWithRemote, startTransition] = useTransition();

  function onSubmit() {
    console.log("確認並簽名");
    signProxy({ data: transactionData });
  }

  useEffect(() => {
    if (status === "Success") {
      console.log("簽名結果:", signature);
      console.log("簽名資料:", signData);
      if (!signData) {
        console.error("簽名資料不存在");
        return;
      }
      startTransition(async () => {
        try {
          // 創建簽名交易，並更新到資料庫上
          if (!userData?.spenderAddress) {
            throw new Error("找不到 spenderAddress");
          }
          const signatureTransaction = await createSignatureTransaction({
            signature: signature,
            metaData: {
              senderAddress: transactionData.senderAddress,
              spenderAddress: userData?.spenderAddress,
              ...signData,
            },
          });

          if (!signatureTransaction) {
            throw new Error("建立簽名交易失敗");
          }

          executeSignatureTransaction({
            transactionId: signatureTransaction?.id,
          });
          reset();
          onActionSuccess();
          toast.success("準備前往交易結果頁面");
          setOpen(false);
          router.push(`/transfer/${signatureTransaction?.id}`);
        } catch (error) {
          console.error("簽名交易結果:", error);
        }
      });
    }
  }, [status]);

  return (
    <Drawer open={open} direction="right" onOpenChange={setOpen}>
      <DrawerContent className="w-full p-4">
        <DrawerHeader>
          <DrawerTitle>確認交易資訊</DrawerTitle>
          <DrawerDescription>
            檢查交易資訊是否正確，以及調整每個鏈的 TransferProxy 金額
          </DrawerDescription>
        </DrawerHeader>
        <div className="w-full p-4">
          <TransactionInfo transaction={transactionData} />
        </div>
        <DrawerFooter>
          <Button
            onClick={onSubmit}
            disabled={isSyncWithRemote || status === "Pending"}
          >
            {isSyncWithRemote || status === "Pending"
              ? "簽署中..."
              : "確認並簽名"}
          </Button>
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
