"use client";
import { Button } from "@/components/ui/button";
import { receiveMessage } from "@/app/_actions/transaction";
import { TokenTransferLog } from "@/models/transaction";
import { useRouter } from "next/navigation";
export function CCTVTransferButton({
  transactionLog,
  index,
  transactionId,
  destinationChainId,
}: {
  transactionLog: TokenTransferLog;
  index: number;
  transactionId: string;
  destinationChainId: number;
}) {
  const router = useRouter();
  return (
    <Button
      onClick={() =>
        receiveMessage({
          transactionLog,
          index,
          transactionId,
          destinationChainId,
        }).then(() => {
          router.refresh();
        })
      }
    >
      手動更新
    </Button>
  );
}
