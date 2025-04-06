export interface StatusBadgeProps {
  status: string;
  type?: "signature" | "transaction" | "default";
}

export function StatusBadge({ status, type = "default" }: StatusBadgeProps) {
  let bgColor = "bg-gray-200";
  let textColor = "text-gray-800";
  let statusText = status;

  switch (status) {
    case "pending":
    case "ready":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      if (type === "signature") statusText = "Ready to transfer";
      if (type === "transaction") statusText = "Waiting to process";
      break;
    case "completed":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      if (type === "signature") statusText = "Completed";
      if (type === "transaction") statusText = "Transaction completed";
      break;
    case "failed":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      if (type === "signature") statusText = "Signature failed";
      if (type === "transaction") statusText = "Transaction failed";
      break;
    default:
      bgColor = "bg-gray-200";
      textColor = "text-gray-800";
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      {statusText}
    </span>
  );
}
