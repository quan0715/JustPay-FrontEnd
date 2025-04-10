import { ContractInteractionStatus } from "@/models/contract";
import { Loader2, Check, X } from "lucide-react";

export function InteractionStatusMessage({
  status,
  idleMessage,
  pendingMessage,
  successMessage,
  errorMessage,
}: {
  status: ContractInteractionStatus;
  idleMessage?: string;
  pendingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}) {
  if (status === "Idle") {
    return (
      <div className="flex items-center mt-2 text-sm text-gray-500">
        {idleMessage}
      </div>
    );
  }
  if (status === "Pending") {
    return (
      <div className="flex items-center mt-2 text-sm text-blue-500">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        {pendingMessage}
      </div>
    );
  }
  if (status === "Success") {
    return (
      <div className="flex items-center mt-2 text-sm text-green-500">
        <Check className="h-4 w-4 mr-2" />
        {successMessage}
      </div>
    );
  }
  if (status === "Failed") {
    return (
      <div className="flex items-center mt-2 text-sm text-red-500">
        <X className="h-4 w-4 mr-2" />
        {errorMessage}
      </div>
    );
  }
  return null;
}
