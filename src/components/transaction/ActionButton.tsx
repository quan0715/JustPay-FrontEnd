"use client";
import { Button } from "@/components/ui/button";
import { receiveMessage } from "@/app/_actions/transaction";
import { TokenTransferLog } from "@/models/transaction";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { Loader2 } from "lucide-react";
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

export function PendingBadge() {
  return (
    <Badge
      variant="outline"
      className="px-3 py-1 flex flex-row items-center gap-2  "
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>進行中</span>
    </Badge>
  );
}
