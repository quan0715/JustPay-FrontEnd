"use client";
import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface AddressDisplayProps {
  address: string;
  chainId: number;
  showFullAddress?: boolean;
  type?: "address" | "txHash";
}

const getExplorerUrl = (
  chainId: number,
  address: string,
  type: "address" | "txHash"
): string => {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return type === "address"
        ? `https://etherscan.io/address/${address}`
        : `https://etherscan.io/tx/${address}`;
    case 5: // Goerli
      return type === "address"
        ? `https://goerli.etherscan.io/address/${address}`
        : `https://goerli.etherscan.io/tx/${address}`;
    case 137: // Polygon
      return type === "address"
        ? `https://polygonscan.com/address/${address}`
        : `https://polygonscan.com/tx/${address}`;
    case 80001: // Mumbai
      return type === "address"
        ? `https://mumbai.polygonscan.com/address/${address}`
        : `https://mumbai.polygonscan.com/tx/${address}`;
    case 11155111: // Sepolia
      return type === "address"
        ? `https://sepolia.etherscan.io/address/${address}`
        : `https://sepolia.etherscan.io/tx/${address}`;
    case 84532: // Base Sepolia
      return type === "address"
        ? `https://sepolia.basescan.org/address/${address}`
        : `https://sepolia.basescan.org/tx/${address}`;
    case 43113: // Avalanche Fuji
      return type === "address"
        ? `https://testnet.snowtrace.io/address/${address}`
        : `https://testnet.snowtrace.io/tx/${address}`;
    case 43114: // Avalanche Mainnet
      return type === "address"
        ? `https://snowtrace.io/address/${address}`
        : `https://snowtrace.io/tx/${address}`;
    default:
      return type === "address"
        ? `https://etherscan.io/address/${address}`
        : `https://etherscan.io/tx/${address}`;
  }
};

export const AddressDisplay = ({
  address,
  chainId,
  showFullAddress = false,
  type = "address",
}: AddressDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("地址已複製到剪貼簿");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("複製失敗");
    }
  };

  const displayAddress = showFullAddress
    ? address
    : `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono">{displayAddress}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="h-8 w-8"
        disabled={copied}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
        <a
          href={getExplorerUrl(chainId, address, type)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
};
