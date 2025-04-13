import Image from "next/image";
import { CheckCircle } from "lucide-react";
export function ChainChip({
  label,
  tokenImage,
  isAuthorized = false,
}: {
  label?: string;
  tokenImage?: string;
  isAuthorized?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-foreground/5 p-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <Image src={tokenImage || ""} alt={label || ""} width={16} height={16} />
      {isAuthorized && (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
        </>
      )}
    </div>
  );
}

export function ChainSelectItem({
  label,
  tokenImage,
  isAuthorized = false,
}: {
  label?: string;
  tokenImage?: string;
  isAuthorized?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <Image src={tokenImage || ""} alt={label || ""} width={16} height={16} />
      {isAuthorized && (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
        </>
      )}
    </div>
  );
}
