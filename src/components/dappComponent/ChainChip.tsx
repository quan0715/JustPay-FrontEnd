import { type ChainToken } from "@/models/token";
import Image from "next/image";
export function ChainChip({
  withLabel,
  chainToken,
}: {
  withLabel: boolean;
  chainToken: ChainToken;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-2">
      {withLabel && (
        <p className="text-sm font-medium text-gray-500">
          {chainToken.network}
        </p>
      )}
      <Image
        src={chainToken.image || ""}
        alt={chainToken.network}
        width={16}
        height={16}
      />
    </div>
  );
}
