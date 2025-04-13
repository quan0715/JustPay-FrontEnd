"use client";
import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface AddressDisplayProps {
  address: string;
  chainId: number;
  showFullAddress?: boolean;
}

const getExplorerUrl = (chainId: number, address: string): string => {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return `https://etherscan.io/address/${address}`;
    case 5: // Goerli
      return `https://goerli.etherscan.io/address/${address}`;
    case 137: // Polygon
      return `https://polygonscan.com/address/${address}`;
    case 80001: // Mumbai
      return `https://mumbai.polygonscan.com/address/${address}`;
    case 11155111: // Sepolia
      return `https://sepolia.etherscan.io/address/${address}`;
    case 84532: // Base Sepolia
      return `https://sepolia.basescan.org/address/${address}`;
    case 43113: // Avalanche Fuji
      return `https://testnet.snowtrace.io/address/${address}`;
    case 43114: // Avalanche Mainnet
      return `https://snowtrace.io/address/${address}`;
    default:
      return `https://etherscan.io/address/${address}`;
  }
};

export const AddressDisplay = ({
  address,
  chainId,
  showFullAddress = false,
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
          href={getExplorerUrl(chainId, address)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
};
